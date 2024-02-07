import dotenv from 'dotenv';
import path from 'path';
import prompts from 'prompts';

import { transformMdxToMarkdoc } from './transformMdxToMarkdoc';
import { removeExtraHtmlElements } from './transformers/removeExtraHtmlElements';
import {
    copyFiles,
    exists,
    getFileExtension,
    getFilePathBaseName,
    getFolderFiles,
    readFile,
    writeFile,
} from './utils/files';

dotenv.config();
const { SOURCE_FOLDER, DEST_FOLDER } = process.env;
const ROOT_MDX = 'index.md';

type CreateType = 'cancel' | 'show-output' | 'show-ast' | 'successful' | 'successful-warning';
type MigrationType = 'all' | 'new' | 'existing' | 'existing-mdoc' | 'select';
interface WarningResult {
    type: 'warning';
    folder: string;
    folderPath: string;
    files: string[];
    output: string;
    warnings: string[];
    ast: any;
}
interface SuccessResult {
    type: 'success';
    folder: string;
    folderPath: string;
    files: string[];
    output: string;
    ast: any;
}
interface ErrorResult {
    type: 'error';
    error: any;
    message: string;
    ast: any;
    folder: string;
}

type Result = WarningResult | SuccessResult | ErrorResult;
type CreateableResult = WarningResult | SuccessResult;

interface CreateFoldersResult {
    warnings: string[];
    successResults: Result[];
}

async function getDocsWithPrompts({
    sourceDocs,
    destDocs,
    destFolder,
}: {
    sourceDocs: string[];
    destDocs: string[];
    destFolder: string;
}): Promise<{
    migrationType: MigrationType;
    docs: string[];
}> {
    const docsChoices = sourceDocs.map((doc) => {
        const title = destDocs.includes(doc) ? `✅ ${doc} (exists)` : doc;
        return { title, value: doc };
    });
    const newDocs = sourceDocs.filter((doc) => !destDocs.includes(doc));
    const existingDocs = destDocs.filter((doc) => sourceDocs.includes(doc));
    const existingDocsWithMarkdoc = (
        await Promise.all(
            existingDocs.map(async (doc) => {
                const mdoc = path.join(destFolder, doc, 'index.mdoc');
                const mdocExists = await exists(mdoc);
                return mdocExists ? doc : undefined;
            })
        )
    ).filter(Boolean);

    const { migrationType } = (await prompts<'migrationType'>({
        type: 'select',
        name: 'migrationType',
        message: `Which folders do you want to migrate?`,
        hint: SOURCE_FOLDER,
        choices: [
            { title: `All (${docsChoices.length})`, value: 'all' },
            {
                title: `Only if not already in destination folder (${newDocs.length})`,
                description: DEST_FOLDER,
                value: 'new',
            },
            {
                title: `Replace all existing folders in destination folder (${existingDocs.length})`,
                description: DEST_FOLDER,
                value: 'existing',
            },
            {
                title: `Replace existing folders with 'index.mdoc' in destination folder (${existingDocsWithMarkdoc.length})`,
                description: DEST_FOLDER,
                value: 'existing-mdoc',
            },
            { title: 'Select them manually', value: 'select' },
        ],
        initial: 1,
    })) as { migrationType: MigrationType };

    let docs = [];
    if (migrationType === 'all') {
        docs = sourceDocs;
    } else if (migrationType === 'new') {
        docs = newDocs;
    } else if (migrationType === 'existing') {
        docs = existingDocs;
    } else if (migrationType === 'existing-mdoc') {
        docs = existingDocsWithMarkdoc;
    } else if (migrationType === 'select') {
        const answers = await prompts<'docs'>({
            type: 'autocompleteMultiselect',
            name: 'docs',
            message: 'Which docs do you want to migrate?',
            choices: docsChoices,
        });

        docs = answers.docs;
    }

    return {
        docs,
        migrationType,
    };
}

function displayTransformResults({ results, total }: { results: Result[]; total: number }) {
    const allSuccesses = results.filter(({ type }) => type === 'success') as SuccessResult[];
    const numSuccess = allSuccesses.length;
    const allWarnings = results.filter(({ type }) => type === 'warning') as WarningResult[];
    const numWarnings = allWarnings.length;
    const allErrors = results.filter(({ type }) => type === 'error') as ErrorResult[];
    const numErrors = allErrors.length;
    const errorTypes = {};

    if (numWarnings) {
        console.error('\nWarnings:');

        allWarnings.forEach(({ folder, warnings }) => {
            console.log(`⚠️  ${folder}: ${warnings}`);
        });
    }

    if (numErrors) {
        console.error('\nErrors:');

        allErrors.forEach(({ message, folder, error }) => {
            const { markdownErrorType } = error;
            errorTypes[markdownErrorType] =
                errorTypes[markdownErrorType] === undefined ? 1 : errorTypes[markdownErrorType] + 1;
            console.error(`❌ ${folder}: ${message}`);
        });
    }

    const errorTypesString = Object.entries(errorTypes)
        .map(([type, num]) => `${type}: ${num}`)
        .join(',');
    console.log('\n------------------------------------------------------------');
    console.log(
        `✅ Success: ${numSuccess} / ⚠️  Warnings: ${numWarnings} / ❌ Errors: ${numErrors}${numErrors > 0 ? ` (${errorTypesString})` : ''} / Total: ${total}`
    );
}

async function transformDocs({
    docs,
    sourceFolder,
    destFolder,
}: {
    docs: string[];
    sourceFolder: string;
    destFolder: string;
}): Promise<Result[]> {
    const promises = docs.map(async (docFolder) => {
        const sourceDocsFolder = path.join(sourceFolder, docFolder);
        const destDocsFolder = path.join(destFolder, docFolder);
        const files = await getFolderFiles(sourceDocsFolder);

        const rootFilePath = path.join(sourceDocsFolder, ROOT_MDX);
        const contents = await readFile(rootFilePath);

        let result: Result;
        try {
            const { warnings, replacedContents } = removeExtraHtmlElements(contents);
            const transformResult = await transformMdxToMarkdoc({
                contents: replacedContents,
            });
            const { output, ast } = transformResult;
            const allWarnings = warnings.concat(transformResult.warnings);

            result = allWarnings.length
                ? {
                      type: 'warning',
                      folder: docFolder,
                      folderPath: destDocsFolder,
                      files: files,
                      output: output,
                      warnings: allWarnings,
                      ast,
                  }
                : {
                      type: 'success',
                      folder: docFolder,
                      folderPath: destDocsFolder,
                      files: files,
                      output: output,
                      ast,
                  };
        } catch (error) {
            result = {
                type: 'error',
                error: error,
                message: error.message,
                ast: error.ast,
                folder: docFolder,
            };
        }

        return result;
    });

    return Promise.all(promises);
}

async function getResultsToCreateWithPrompts({
    results,
    destFolder,
}: {
    results: Result[];
    destFolder: string;
}): Promise<{ resultsToCreate: CreateableResult[]; createType: CreateType }> {
    const { createType } = (await prompts<'createType'>({
        type: 'select',
        name: 'createType',
        message: `Do you want to create the files in the destination folder?`,
        hint: destFolder,
        choices: [
            { title: `No`, value: 'cancel' },
            { title: `No, show output`, value: 'show-output' },
            { title: `No, show mdast Abstract Syntax Tree`, value: 'show-ast' },
            {
                title: `Only ✅ Success transforms`,
                value: 'successful',
            },
            {
                title: `All ✅ Success and ⚠️  Warning transforms`,
                value: 'successful-warning',
            },
        ],
        initial: 1,
    })) as { createType: CreateType };

    let resultsToCreate: CreateableResult[] = [];
    if (createType === 'successful') {
        resultsToCreate = results.filter(({ type }) => type === 'success') as SuccessResult[];
    } else if (['successful-warning', 'show-output', 'show-ast'].includes(createType)) {
        resultsToCreate = results.filter(({ type }) => type === 'success' || type === 'warning') as (
            | SuccessResult
            | WarningResult
        )[];
    }

    return { resultsToCreate, createType };
}

async function createFolders({
    sourceFolder,
    results,
}: {
    sourceFolder: string;
    results: CreateableResult[];
}): Promise<CreateFoldersResult> {
    const knownFiles = ['index.md', 'examples', 'resources'];
    const fileExtsToFilter = ['.json']; // Filter out json, as it should go into `contents` folder
    const warnings: string[] = [];
    const successResults: Result[] = [];

    const createFilePromises = results.map(async (result) => {
        const { folderPath, folder, output, files } = result;
        const markdocFile = path.join(folderPath, 'index.mdoc');

        const otherFiles = files.filter((file) => !knownFiles.includes(file));
        if (otherFiles.length) {
            warnings.push(`⚠️  ${folder}: Other files found that have not been moved - ${otherFiles}`);
        }
        await writeFile(markdocFile, output);

        // Copy resources
        if (files.includes('resources')) {
            const resourcesFolder = path.join(sourceFolder, folder, 'resources');
            const destResourcesFolder = path.join(folderPath, 'resources');
            const filter = (src: string) => {
                const ext = getFileExtension(src);
                const shouldExcludeFileExt = fileExtsToFilter.includes(ext);

                if (shouldExcludeFileExt) {
                    warnings.push(
                        `⚠️  ${folder}: JSON file not moved - ${path.join('resources', getFilePathBaseName(src))}`
                    );
                }
                return !shouldExcludeFileExt;
            };

            await copyFiles(resourcesFolder, destResourcesFolder, filter);
        }

        // TODO: Move examples

        successResults.push(result);
    });

    await Promise.all(createFilePromises);

    return {
        warnings,
        successResults,
    };
}

function displayCreateFolderResults({ result, isVerbose }: { result: CreateFoldersResult; isVerbose?: boolean }) {
    const { successResults, warnings } = result;
    if (warnings.length) {
        console.log(`Warnings (${warnings.length}):`);
        warnings.forEach((warning) => console.log(warning));
    }

    if (isVerbose) {
        console.log('Created:');
        successResults.forEach(({ folder }) => {
            console.log(`✅ ${folder}`);
        });
    }

    console.log(`\nUpdated ${successResults.length} folders`);
}

function displayOutput({
    results,
    resultsToCreate,
    createType,
}: {
    results: Result[];
    resultsToCreate: CreateableResult[];
    createType: CreateType;
}) {
    resultsToCreate.forEach(({ type, output, folder, ast }) => {
        const status = type === 'success' ? '✅' : '⚠️ ';
        console.log(`${status} ${folder}`);
        const displayOutput = createType === 'show-output' ? output : JSON.stringify(ast, null, 2);
        console.log(displayOutput);
    });

    const allErrors = results.filter(({ type }) => type === 'error') as ErrorResult[];
    const numErrors = allErrors.length;
    if (numErrors) {
        console.error('\nErrors:');

        allErrors.forEach(({ message, folder, error }) => {
            const { markdownErrorType } = error;
            console.error(`❌ ${folder}: (${markdownErrorType}) ${message}`);
            console.error(error);
        });
    }
}

async function main() {
    if (!SOURCE_FOLDER) {
        console.error(`No "SOURCE_FOLDER" defined in \`.env\``);
        return;
    } else if (!DEST_FOLDER) {
        console.error(`No "DEST_FOLDER" defined in \`.env\``);
        return;
    }

    console.log('Options', {
        SOURCE_FOLDER,
        DEST_FOLDER,
    });

    const sourceFolder = SOURCE_FOLDER;
    const destFolder = DEST_FOLDER;

    const sourceDocs = await getFolderFiles(sourceFolder);
    const destDocs = await getFolderFiles(destFolder);

    const { docs, migrationType } = await getDocsWithPrompts({
        sourceDocs,
        destDocs,
        destFolder,
    });

    if (!docs || !migrationType) {
        return;
    }

    const results = await transformDocs({
        docs,
        sourceFolder,
        destFolder,
    });
    displayTransformResults({ results, total: docs.length });

    const { resultsToCreate, createType } = await getResultsToCreateWithPrompts({ results, destFolder });

    if (['show-output', 'show-ast'].includes(createType)) {
        displayOutput({ results, resultsToCreate, createType });
        return;
    }

    const createFolderResults = await createFolders({ sourceFolder, results: resultsToCreate });
    displayCreateFolderResults({
        result: createFolderResults,
    });
}

main();
