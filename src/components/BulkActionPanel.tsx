import {useCallback, useMemo} from "react";

import {settingKindViews} from "~/components/settingKinds";
import type {TSelectionOf} from "~/domain/selection";
import {settingBehaviors, type TSettingKind, type TSettingOf, type TSettingValueOf} from "~/domain/setting";
import type {TSettingChangeOf} from "~/domain/settingState";

type TChangeSettings<K extends TSettingKind> = (
    kind: K,
    settings: readonly TSettingOf<K>[],
    change: TSettingChangeOf<K>,
) => void;

interface IBulkValueButtonProps<K extends TSettingKind> {
    kind: K;
    settings: readonly TSettingOf<K>[];
    value: TSettingValueOf<K>;
    onChange: TChangeSettings<K>;
}

const BulkValueButton = <K extends TSettingKind>({kind, settings, value, onChange}: IBulkValueButtonProps<K>) => {
    const handleClick = useCallback(() => {
        onChange(kind, settings, {to: 'value', value});
    }, [onChange, kind, settings, value]);

    return (
        <button
            onClick={handleClick}
            className={`px-3 py-1.5 text-sm bg-gray-700 rounded hover:bg-gray-600 ${settingKindViews[kind].valueClassName(value)}`}
        >
            {String(value)}
        </button>
    );
};

interface IBulkActionPanelProps<K extends TSettingKind> {
    selection: TSelectionOf<K>;
    onChange: TChangeSettings<K>;
    onClear: () => void;
}

export const BulkActionPanel = <K extends TSettingKind>({selection, onChange, onClear}: IBulkActionPanelProps<K>) => {
    const settings = useMemo(() => [...selection.settings.values()], [selection.settings]);

    const applyAndClearSelection = useCallback<TChangeSettings<K>>((kind, changed, change) => {
        onChange(kind, changed, change);
        onClear();
    }, [onChange, onClear]);

    const handleReset = useCallback(() => {
        onChange(selection.kind, settings, {to: 'baseline'});
    }, [onChange, selection.kind, settings]);

    return (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-blue-800 bg-gray-800/95 shadow-2xl">
            <div className="max-w-6xl mx-auto flex flex-wrap items-center gap-3 px-4 py-3">
                <span className="text-sm text-gray-200">
                    <strong>{settings.length}</strong> {selection.kind} {settings.length === 1 ? 'setting' : 'settings'} selected
                </span>
                <span className="text-sm text-gray-400">Set to</span>
                <div className="flex flex-wrap gap-2">
                    {settingBehaviors[selection.kind].values.map((value) => (
                        <BulkValueButton
                            key={String(value)}
                            kind={selection.kind}
                            settings={settings}
                            value={value}
                            onChange={applyAndClearSelection}
                        />
                    ))}
                </div>
                <button
                    onClick={handleReset}
                    className="px-3 py-1.5 text-sm text-gray-200 border border-gray-600 rounded hover:border-gray-400"
                >
                    Reset to baseline
                </button>
                <button onClick={onClear} className="ml-auto px-3 py-1.5 text-sm text-gray-300 hover:text-gray-100">
                    Clear selection
                </button>
            </div>
        </div>
    );
};
