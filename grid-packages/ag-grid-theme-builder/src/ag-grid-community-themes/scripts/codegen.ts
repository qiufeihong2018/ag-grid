import fs from 'fs';
import { globSync } from 'glob';
import path from 'path';
import * as prettier from 'prettier';
import { Helper, ParamMeta, allPartsMeta, cssBorderStyles } from '../metadata';
import { DefinePartArgs, camelCase, logErrorMessage } from '../theme-utils';

const projectDir = path.join(__dirname, '../');

const main = async () => {
  await validatePartsMeta();
  await writeTsFile('GENERATED-parts-public.ts', makePublicFile());
};

const generatedWarning = `
//
// NOTE: THIS FILE IS GENERATED DO NOT EDIT IT DIRECTLY!
// It can be regenerated by running \`npm run codegen\` or
// \`npm run codegen:watch\` to regenerate on changes.
//

`;

const makePublicFile = (): string => {
  let result = generatedWarning;

  result += "import { definePart } from './theme-utils';\n";
  result += "import * as helpers from './css-helpers';\n\n";
  result +=
    'export type BorderStyle = ' + cssBorderStyles.map((s) => `'${s}'`).join(' | ') + ';\n\n';

  for (const part of allPartsMeta) {
    if (part.params) {
      const paramsUnion = part.params.map((p) => JSON.stringify(p.property)).join(' | ');
      result += `export type ${paramsUnionName(part.partId)} = ${paramsUnion};\n\n`;
    }
  }

  for (const part of allPartsMeta) {
    const args: DefinePartArgs = {
      partId: part.partId,
    };
    if (part.params) {
      args.defaults = {};
      for (const { property, defaultValue } of part.params) {
        if (defaultValue && typeof defaultValue === 'object' && defaultValue.helper) {
          args.defaults[property] = codeLiteral(`helpers.${renderHelper(defaultValue)}`);
        } else {
          args.defaults[property] = defaultValue;
        }
      }
    }

    const cssFilesDir = projectDir + `css/${part.partId}/`;

    const partEntryFiles = globSync(cssFilesDir + `${part.partId}.css`);
    const partImplementationFiles = globSync(cssFilesDir + `**/*.css`).filter(
      (file) => !partEntryFiles.includes(file),
    );
    const partEntrySource = partEntryFiles.map((file) => fs.readFileSync(file, 'utf8')).join('\n');
    for (const file of partImplementationFiles) {
      const pathWithinFolder = file.replace(cssFilesDir, '');
      if (!partEntrySource.includes(`@import './${pathWithinFolder}';`)) {
        throw fatalError(
          `Part ${part.partId} has an implementation file ${pathWithinFolder} that is not imported in the entry file`,
        );
      }
    }

    const files = [...globSync(cssFilesDir + `**/*.ts`), ...partEntryFiles]
      .map((f) => f.replace(cssFilesDir, ''))
      .sort();
    if (files.length > 0) {
      args.css = [];
      for (const fileName of files) {
        const importName = fileToImportName(fileName);
        result += `import ${importName} from './css/${part.partId}/${fileToImportPath(fileName)}';\n`;
        args.css.push(codeLiteral(importName));
      }
    }
    if (part.iconsFile) {
      const importName = fileToImportName(part.iconsFile);
      result += `import ${importName} from './css/${part.partId}/${part.iconsFile}';\n`;
      args.icons = codeLiteral(importName);
    }
    const argsCode = restoreLiterals(JSON.stringify(args, null, '    '));
    result += '\n';
    result += `export const ${camelCase(part.partId)} = definePart<${paramsUnionName(part.partId)}>(${argsCode});\n\n`;
  }

  result += 'export type ParamTypes = {\n';
  for (const part of allPartsMeta) {
    if (part.params) {
      for (const param of part.params) {
        result += paramDocComment(param);
        result += `${param.property}: ${paramTsType(param)},\n\n`;
      }
    }
  }
  result += '}\n\n';

  result += `export type Param = keyof ParamTypes;\n\n`;

  result += `export const allParts = [${allPartsMeta.map((p) => camelCase(p.partId)).join(', ')}]\n\n`;

  if (process.argv.includes('--hot-reload')) {
    result += `
    if (import.meta.hot) {
      import.meta.hot.accept((newModule) => {
        if (newModule) {
          const oldParts = newModule.allParts.map((p: any) => p.partId).join(', ');
          const newParts = allParts.map((p) => p.partId).join(', ');
          if (oldParts !== newParts) {
            import.meta.hot?.invalidate();
          } else {
            for (let i = 0; i < allParts.length; i++) {
              // update the existing part object with data from the new module
              Object.assign(allParts[i], newModule.allParts[i]);
              // replace the new object in the module with the updated existing object
              newModule.allParts[i] = allParts[i];
            }
            (window as any).handlePartsCssChange?.();
          }
        }
      });
    }
  `;
  }

  return result;
};

const codeLiteral = (code: string): any => `$CODE-LITERAL-START$${code}$CODE-LITERAL-END$`;

const restoreLiterals = (json: string) =>
  json.replace(/"\$CODE-LITERAL-START\$(.*?)\$CODE-LITERAL-END\$"/g, (_, match) =>
    JSON.parse(`"${match}"`),
  );

const validatePartsMeta = async () => {
  const variablesDefinedIn: Record<string, string> = {};
  const corePart = allPartsMeta.find((p) => p.partId === 'core');
  if (!corePart) {
    throw fatalError('No core part defined');
  }
  for (const { partId, presets, params } of allPartsMeta) {
    if (presets) {
      const defaultPresets = presets.filter((p) => p.isDefault);
      if (defaultPresets.length === 0) {
        throw fatalError(`Part ${partId} has no default preset`);
      } else if (defaultPresets.length > 1) {
        throw fatalError(
          `Part ${partId} has more than one default preset (${defaultPresets.join(', ')} are both default)`,
        );
      }

      for (const { property } of params || []) {
        const alreadyDefinedIn = variablesDefinedIn[property];
        if (alreadyDefinedIn) {
          throw fatalError(
            alreadyDefinedIn === partId
              ? `Param ${property} is defined twice in ${partId}`
              : `Param ${property} is defined in both ${alreadyDefinedIn} and ${partId}`,
          );
        }
        variablesDefinedIn[property] = partId;
      }

      const paramsAndCoreParams = [...(corePart.params || []), ...(params || [])];

      for (const { paramValues } of presets) {
        for (const [paramName, paramValue] of Object.entries(paramValues)) {
          const param = paramsAndCoreParams?.find((p) => p.property === paramName);
          if (!param) {
            throw fatalError(`Part ${partId} has a preset for unknown param ${paramName}`);
          }
          if (!paramValueIsValid(param, paramValue)) {
            throw fatalError(
              `Part ${partId} has an invalid value ${JSON.stringify(paramValue)} for param ${paramName}`,
            );
          }
        }
      }
    }
  }
};

const writeTsFile = async (filename: string, content: string) => {
  const fs = await import('fs');
  const path = await import('path');
  const prettierConfig = (await prettier.resolveConfig(__dirname)) || undefined;
  try {
    content = await prettier.format(content, { parser: 'typescript', ...prettierConfig });
  } catch (e) {
    logErrorMessage(e);
    content += `\n\nSYNTAX ERROR WHILE FORMATTING:\n\n${(e as any).stack || e}`;
  }
  fs.writeFileSync(path.join(projectDir, filename), content);
};

const paramTsType = (param: ParamMeta): string => {
  const { type } = param;
  switch (param.type) {
    case 'color':
    case 'length':
    case 'css':
      return 'string';
    case 'borderStyle':
      return 'BorderStyle';
    case 'border':
      return 'string | boolean';
    case 'preset':
      return `${upperCamelCase(param.property)} | null`;
  }
  fatalError(`Unknown param type: ${type}`);
};

const paramValueIsValid = (param: ParamMeta, value: any): boolean => {
  const { type } = param;
  switch (param.type) {
    case 'color':
    case 'length':
    case 'css':
      return typeof value === 'string';
    case 'borderStyle':
      return cssBorderStyles.includes(value);
    case 'border':
      return typeof value === 'string' || typeof value === 'boolean';
    case 'preset':
      return value == null || param.presetNames.includes(value);
  }
  fatalError(`Unknown param type: ${type}`);
};

const paramExtraDocs = (param: ParamMeta): string | null => {
  const { type } = param;
  switch (param.type) {
    case 'color':
      return !param.preventTransparency && !param.preventVariables
        ? 'Any valid CSS color expression is accepted. A JavaScript number between 0 and 1 is interpreted as a semi-transparent foreground color.'
        : 'Any valid CSS color expression is accepted.';
    case 'borderStyle':
      return 'A CSS border-style value e.g. "solid" or "dashed".';
    case 'border':
      return 'A CSS border value e.g. "solid 1px red". Passing true is equivalent to "solid 1px var(--ag-border-color)", and false to "none".';
    case 'length':
      return `A CSS number value with length units, e.g. "1px" or "2em". If a JavaScript number is provided, its units are assumed to be 'px'.`;
    case 'css':
      return 'Any valid CSS expression is accepted.';
    case 'preset':
      return 'Setting a preset provides default values for other properties that you can then override if required.';
  }
  fatalError(`Unknown param type: ${type}`);
};

const paramDocComment = (param: ParamMeta) =>
  docComment({
    mainComment: param.docs,
    extraComment: paramExtraDocs(param),
    defaultValue: param.defaultValue,
    defaultValueComment: param.defaultValueComment,
  });

const docComment = (arg: {
  mainComment: string;
  extraComment?: string | null;
  defaultValue?: any;
  defaultValueComment?: string;
}) => {
  let result = '/**\n';
  result += ` * ${arg.mainComment}\n`;
  if (arg.extraComment) {
    result += ` *\n`;
    result += ` * ${arg.extraComment}\n`;
  }
  if (arg.defaultValue !== undefined) {
    let defaultValueString: string;
    if (arg.defaultValue && typeof arg.defaultValue === 'object' && arg.defaultValue.helper) {
      defaultValueString = renderHelper(arg.defaultValue);
    } else {
      defaultValueString = JSON.stringify(arg.defaultValue);
    }
    result += ' *\n';
    if (arg.defaultValueComment) {
      defaultValueString += ` (${arg.defaultValueComment})`;
    }
    result += ` * @default ${defaultValueString}\n`;
  }
  result += ' */\n';
  return result;
};

const renderHelper = ({ helper, arg }: Helper) =>
  arg === undefined ? `${helper}()` : `${helper}(${JSON.stringify(arg)})`;

const fatalError = (message: string) => {
  // eslint-disable-next-line no-console
  console.error(message);
  process.exit(1);
};

const fileToImportName = (file: string) => `${camelCase(file)}Import`;

const fileToImportPath = (file: string) => {
  if (file.endsWith('.css')) {
    return `${file}?inline`;
  }
  if (file.endsWith('.ts')) {
    return file.slice(0, -3);
  }
  throw new Error(`Unexpected kind of import: ${file}`);
};

const upperCamelCase = (str: string) => camelCase(str[0].toUpperCase() + str.slice(1));

const presetTypeName = (partId: string) => `${upperCamelCase(partId)}Preset`;
const paramsUnionName = (partId: string) => `${upperCamelCase(partId)}Param`;

void main();
