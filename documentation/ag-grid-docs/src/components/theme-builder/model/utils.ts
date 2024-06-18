export const mapObjectValues = <T, U>(input: Record<string, T>, mapper: (value: T) => U): Record<string, U> =>
    Object.fromEntries(Object.entries(input).map(([key, value]) => [key, mapper(value)]));

export const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

export const titleCase = (variableName: string, prefix?: string) => {
    if (prefix && variableName.startsWith(prefix)) {
        variableName = variableName.substring(prefix.length);
    }
    return variableName
        .replaceAll('-', ' ')
        .replace(/(?:^|\W)+\w/g, (match) => match.toUpperCase())
        .replace(/(?<=[a-z])(?=[A-Z])/g, ' ');
};

export const logErrorMessage = (message: string, error?: unknown) => {
    if (error) {
        // eslint-disable-next-line no-console
        console.error(message, error);
    } else {
        // eslint-disable-next-line no-console
        console.error(message);
    }
};

const loggedMessages = new Set<string>();
export const logErrorMessageOnce = (message: string) => {
    if (loggedMessages.has(message)) return;
    loggedMessages.add(message);
    logErrorMessage(message);
};

export const indexBy = <T, K extends keyof T>(list: readonly T[], property: K): Record<string, T> =>
    Object.fromEntries(list.map((item) => [String(item[property]), item]));

export const memoize = <R, A = void>(fn: (arg: A) => R): ((arg: A) => R) => {
    const values = new Map<string, R>();
    return (a) => {
        const key = String(a);
        if (!values.has(key)) {
            values.set(key, fn(a));
        }
        return values.get(key)!;
    };
};

export const convertProductionUrlsForStaging = (url: string) => {
    const host = typeof window !== 'undefined' ? window.location.host : '';
    if (!host) return url;
    return url.replace(/:\/\/(www\.)?ag-grid.com/, `://${host}`);
};

export const stripFloatingPointErrors = (value: number) => value.toFixed(10).replace(/\.?0+$/, '');

export const paramToVariableName = (param: string) => `--ag-${kebabCase(param)}`;
const kebabCase = (str: string) => str.replace(/[A-Z]/g, (m) => `-${m}`).toLowerCase();
