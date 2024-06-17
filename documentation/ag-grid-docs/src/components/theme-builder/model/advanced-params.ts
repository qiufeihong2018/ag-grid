import { atomWithJSONStorage } from '@components/theme-builder/model/JSONStorage';
import { atom, useAtomValue, useSetAtom } from 'jotai';

import type { ParamModel } from './ParamModel';

const enabledPropertiesArrayAtom = atomWithJSONStorage<string[]>('advanced-properties', []);

const enabledPropertiesSetAtom = atom((get) => new Set(get(enabledPropertiesArrayAtom)));

export const useSetAdvancedParamEnabled = () => {
    const all = useAtomValue(enabledPropertiesSetAtom);
    const setAll = useSetAtom(enabledPropertiesArrayAtom);
    return (param: ParamModel, enabled: boolean) => {
        const copy = new Set(all);
        if (enabled) {
            copy.add(param.property);
        } else {
            copy.delete(param.property);
        }
        setAll(Array.from(copy));
    };
};

export const useAdvancedParamIsEnabled = () => {
    const all = useAtomValue(enabledPropertiesSetAtom);

    return (param: ParamModel) => {
        return all.has(param.property);
    };
};
