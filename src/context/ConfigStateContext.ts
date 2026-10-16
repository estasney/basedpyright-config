import {createContext} from 'react';

import type {TCatalog} from "~/domain/catalog";
import type {TProjectOptionName, TProjectOptionValues} from "~/domain/projectOption";
import type {TSettingKind, TSettingOf, TTypeCheckingMode} from "~/domain/setting";
import type {TOverrides, TSettingChangeOf} from "~/domain/settingState";

export interface IConfigStateContext {
    catalog: TCatalog;
    mode: TTypeCheckingMode;
    overrides: TOverrides;
    overrideCounts: Record<TTypeCheckingMode, number>;
    projectOptions: TProjectOptionValues;
    droppedNames: readonly string[];
    getConfig: () => string;
    setMode: (mode: TTypeCheckingMode) => void;
    changeSettings: <K extends TSettingKind>(
        kind: K,
        settings: readonly TSettingOf<K>[],
        change: TSettingChangeOf<K>,
    ) => void;
    setProjectOption: <N extends TProjectOptionName>(name: N, value: TProjectOptionValues[N]) => void;
}

export const ConfigStateContext = createContext<IConfigStateContext | null>(null);
