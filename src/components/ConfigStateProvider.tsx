import type {ReactNode} from 'react';
import {useCallback, useEffect, useMemo, useRef, useState} from 'react';

import catalog from 'virtual:basedpyright-catalog';
import {ConfigStateContext, type IConfigStateContext} from "~/context/ConfigStateContext";
import {serializeConfig} from "~/domain/config";
import type {TProjectOptionName, TProjectOptionValues} from "~/domain/projectOption";
import {mapModes, type TSettingKind, type TSettingOf, type TTypeCheckingMode} from "~/domain/setting";
import {countOverrides, indexSettings, type TSettingChangeOf, withChange} from "~/domain/settingState";
import {
    type IConfigState,
    type IHydratedState,
    initialHydratedState,
    makeSnapshot,
    parseSnapshot,
    reconcileSnapshot,
    type TSnapshot,
} from "~/domain/snapshot";
import {readStoredSnapshot, writeStoredSnapshot} from "~/lib/snapshotStore";

const {basedpyrightVersion} = catalog;
const settingIndex = indexSettings(catalog.groups);

const PERSIST_DEBOUNCE_MS = 300;

const loadHydratedState = async (): Promise<IHydratedState> => {
    const stored = await readStoredSnapshot();
    if (stored === undefined) return initialHydratedState;
    const snapshot = parseSnapshot(stored);
    if (!snapshot) throw new Error('Stored snapshot does not match the current schema');
    return reconcileSnapshot(settingIndex, snapshot);
};

interface IHydratedProviderProps {
    hydrated: IHydratedState;
    children: ReactNode;
}

const HydratedConfigStateProvider = ({hydrated, children}: IHydratedProviderProps) => {
    const [state, setState] = useState<IConfigState>(hydrated);

    const overrides = state.overridesByMode[state.mode];

    const overrideCounts = useMemo(
        () => mapModes((mode) => countOverrides(state.overridesByMode[mode])),
        [state.overridesByMode],
    );

    const getConfig = useCallback(
        () =>
            serializeConfig({
                typeCheckingMode: state.mode,
                projectOptions: state.projectOptions,
                overrides,
                executionEnvironments: [],
            }),
        [state.mode, state.projectOptions, overrides],
    );

    const setMode = useCallback((mode: TTypeCheckingMode) => {
        setState((prev) => ({...prev, mode}));
    }, []);

    const changeSettings = useCallback(
        <K extends TSettingKind>(kind: K, settings: readonly TSettingOf<K>[], change: TSettingChangeOf<K>) => {
            setState((prev) => ({
                ...prev,
                overridesByMode: {
                    ...prev.overridesByMode,
                    [prev.mode]: withChange(prev.overridesByMode[prev.mode], prev.mode, kind, settings, change),
                },
            }));
        },
        [],
    );

    const setProjectOption = useCallback(
        <N extends TProjectOptionName>(name: N, value: TProjectOptionValues[N]) => {
            setState((prev) => ({...prev, projectOptions: {...prev.projectOptions, [name]: value}}));
        },
        [],
    );

    const pendingSnapshotRef = useRef<TSnapshot | null>(null);

    const flushPendingSnapshot = useCallback(() => {
        const snapshot = pendingSnapshotRef.current;
        if (!snapshot) return;
        pendingSnapshotRef.current = null;
        writeStoredSnapshot(snapshot).catch((error: unknown) => {
            console.error('Failed to persist config state:', error);
        });
    }, []);

    useEffect(() => {
        // Persist only user edits; the hydrated state may stand in for a snapshot this build cannot read.
        if (state === hydrated) return;
        pendingSnapshotRef.current = makeSnapshot(basedpyrightVersion, state);
        const timer = window.setTimeout(flushPendingSnapshot, PERSIST_DEBOUNCE_MS);
        return () => {
            window.clearTimeout(timer);
        };
    }, [state, hydrated, flushPendingSnapshot]);

    useEffect(() => {
        const onVisibilityChange = () => {
            if (document.visibilityState === 'hidden') flushPendingSnapshot();
        };
        window.addEventListener('pagehide', flushPendingSnapshot);
        document.addEventListener('visibilitychange', onVisibilityChange);
        return () => {
            window.removeEventListener('pagehide', flushPendingSnapshot);
            document.removeEventListener('visibilitychange', onVisibilityChange);
        };
    }, [flushPendingSnapshot]);

    const value = useMemo<IConfigStateContext>(
        () => ({
            catalog,
            mode: state.mode,
            overrides,
            overrideCounts,
            projectOptions: state.projectOptions,
            droppedNames: hydrated.droppedNames,
            getConfig,
            setMode,
            changeSettings,
            setProjectOption,
        }),
        [
            state.mode,
            overrides,
            overrideCounts,
            state.projectOptions,
            hydrated.droppedNames,
            getConfig,
            setMode,
            changeSettings,
            setProjectOption,
        ],
    );

    return <ConfigStateContext.Provider value={value}>{children}</ConfigStateContext.Provider>;
};

interface IConfigStateProviderProps {
    children: ReactNode;
}

export const ConfigStateProvider = ({children}: IConfigStateProviderProps) => {
    const [hydrated, setHydrated] = useState<IHydratedState | null>(null);

    useEffect(() => {
        let cancelled = false;
        void loadHydratedState()
            .catch((error: unknown): IHydratedState => {
                console.error('Failed to load config state:', error);
                return initialHydratedState;
            })
            .then((result) => {
                if (!cancelled) setHydrated(result);
            });
        return () => {
            cancelled = true;
        };
    }, []);

    if (hydrated === null) return null;

    return <HydratedConfigStateProvider hydrated={hydrated}>{children}</HydratedConfigStateProvider>;
};
