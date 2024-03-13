import { corePart } from '.';
import { logErrorMessageOnce } from '../model/utils';
import { ParamTypes } from './GENERATED-param-types';
import { AnyPart, CssSource, Part, borderValueToCss } from './theme-types';
import { camelCase, paramToVariableName } from './theme-utils';

export type Theme = {
  css: string;
  icons: Record<string, string>;
  paramDefaults: Record<string, string>;
};

export type PickVariables<P extends AnyPart, V extends object> = {
  [K in P['params'][number]]?: K extends keyof V ? V[K] : never;
};

export const defineTheme = <P extends AnyPart, V extends object = ParamTypes>(
  partOrParts: P | readonly P[],
  parameters: PickVariables<P, V>,
): Theme => {
  const result: Theme = {
    css: '',
    icons: {},
    paramDefaults: {},
  };

  const parts = [corePart];
  flattenParts(Array.isArray(partOrParts) ? partOrParts : [partOrParts], parts);
  const overrideParams = parameters as Record<string, any>;
  const mergedParams: Record<string, any> = {};

  // merge part defaults
  for (const part of parts) {
    Object.assign(mergedParams, part.defaults);
  }

  // TODO apply exclusion group

  const allowedParams = new Set(parts.flatMap((part) => part.params));

  // apply override params passed to this method
  for (const [name, value] of Object.entries(overrideParams)) {
    if (value === undefined) continue;
    if (allowedParams.has(name)) {
      if (validateParam(name, value, allowedParams)) {
        mergedParams[name] = value;
      }
    } else {
      logErrorMessageOnce(`Invalid theme parameter ${name} provided. ${invalidParamMessage}`);
    }
  }

  // render variable defaults using :where(:root) to ensure lowest specificity so that
  // `html { --ag-foreground-color: red; }` will override this
  let variableDefaults = ':where(:root) {\n';
  for (const name of Object.keys(mergedParams)) {
    let value = mergedParams[name];
    if (isBorderParam(name)) {
      value = borderValueToCss(value);
    }
    if (typeof value === 'string' && value) {
      variableDefaults += `\t${paramToVariableName(name)}: ${value};\n`;
      result.paramDefaults[name] = value;
    }
  }
  variableDefaults += '}';

  // combine CSS
  const mainCSS: string[] = [variableDefaults];
  for (const part of parts) {
    if (part.css) {
      mainCSS.push(`/* Part ${part.featureId}/${part.variantId} */`);
      mainCSS.push(...part.css.map((p) => cssPartToString(p, mergedParams)));
    }
  }
  result.css = mainCSS.join('\n');

  checkForUnsupportedVariables(result.css, Object.keys(mergedParams));

  // combine icons
  for (const part of parts) {
    Object.assign(result.icons, part.icons);
  }

  return result;
};

export const checkForUnsupportedVariables = (css: string, params: string[]) => {
  const allowedVariables = new Set(params.map(paramToVariableName));
  allowedVariables.add('--ag-line-height');
  allowedVariables.add('--ag-indentation-level');
  for (const [, variable] of css.matchAll(/var\((--ag-[\w-]+)[^)]*\)/g)) {
    if (!allowedVariables.has(variable) && !variable.startsWith('--ag-internal')) {
      logErrorMessageOnce(`${variable} does not match a theme param`);
    }
  }
};

const cssPartToString = (p: CssSource, params: Record<string, any>): string =>
  // TODO allowing part functions to take params is a hack for icons to include
  // the stroke width in the embedded SVG, when we implement inline SVGs combine
  // all part CSS at build time and treat it as a string
  typeof p === 'function' ? p(params) : p;

const isBorderParam = (property: string) =>
  property.startsWith('borders') || property.endsWith('Border');

const validateParam = (property: string, value: unknown, allowedParams: Set<string>): boolean => {
  const actualType = typeof value;
  if (isBorderParam(property) && actualType === 'boolean') return true;
  if (actualType !== 'string') {
    logErrorMessageOnce(
      `Invalid value for ${property} (expected a string, got ${describeValue(value)})`,
    );
    return false;
  }
  if (typeof value === 'string') {
    for (const varMatch of value.matchAll(/var\(--ag-([a-z-]+)[^)]*\)/g)) {
      const paramName = camelCase(varMatch[1]);
      if (!allowedParams.has(paramName)) {
        logErrorMessageOnce(
          `Invalid value provided to theme parameter ${property}. Expression "${varMatch[0]}" refers to non-existent parameter ${paramName}. ${invalidParamMessage}`,
        );
      }
    }
  }
  return true;
};

const invalidParamMessage =
  'It may be misspelled, or your theme may not include the part that defines it.';

const describeValue = (value: any): string => {
  if (value == null) return String(value);
  return `${typeof value} ${value}`;
};

const flattenParts = (parts: readonly AnyPart[], accumulator: Part[]) => {
  for (const part of parts) {
    if ('componentParts' in part) {
      flattenParts(part.componentParts, accumulator);
    } else {
      accumulator.push(part);
    }
  }
  return accumulator;
};

export const installTheme = (theme: Theme, container?: HTMLElement | null) => {
  const id = 'ag-injected-style';
  if (!container) {
    container = document.querySelector('head');
    if (!container) throw new Error("Can't install theme before document head is created");
  }
  let style = container.querySelector(`#${id}`) as HTMLStyleElement;
  if (!style) {
    style = document.createElement('style');
    style.setAttribute('id', id);
    container.insertBefore(style, container.firstChild);
  }
  style.textContent = theme.css;
};
