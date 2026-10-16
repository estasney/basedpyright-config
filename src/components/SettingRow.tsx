import {type MouseEvent, useCallback} from "react";

import {CodeSpans} from "~/components/CodeSpans";
import {settingKindViews} from "~/components/settingKinds";
import type {TSettingKind, TSettingOf, TSettingValueOf} from "~/domain/setting";
import type {TSettingChangeOf} from "~/domain/settingState";

interface ISettingRowProps<K extends TSettingKind> {
    setting: TSettingOf<K>;
    baseline: TSettingValueOf<K>;
    override: TSettingValueOf<K> | undefined;
    docsUrl: string;
    isSelected: boolean;
    isSelectionDisabled: boolean;
    onSelect: (setting: TSettingOf<K>, isSelected: boolean, isRange: boolean) => void;
    onChange: (kind: K, settings: readonly TSettingOf<K>[], change: TSettingChangeOf<K>) => void;
}

export const SettingRow = <K extends TSettingKind>({
    setting,
    baseline,
    override,
    docsUrl,
    isSelected,
    isSelectionDisabled,
    onSelect,
    onChange,
}: ISettingRowProps<K>) => {
    const {Editor, valueClassName} = settingKindViews[setting.kind];

    const handleSelect = useCallback(
        (event: MouseEvent<HTMLInputElement>) => {
            onSelect(setting, event.currentTarget.checked, event.shiftKey);
        },
        [onSelect, setting],
    );

    const handleValueChange = useCallback(
        (value: TSettingValueOf<K>) => {
            onChange(setting.kind, [setting], {to: 'value', value});
        },
        [onChange, setting],
    );

    const handleReset = useCallback(() => {
        onChange(setting.kind, [setting], {to: 'baseline'});
    }, [onChange, setting]);

    return (
        <tr
            className={`border-t border-gray-700 hover:bg-gray-700/40 ${
                isSelected ? 'bg-blue-950/60' : ''
            }`}
        >
            <td className="px-2 py-1 text-center">
                <input
                    type="checkbox"
                    checked={isSelected}
                    disabled={isSelectionDisabled}
                    readOnly
                    onClick={handleSelect}
                    className="h-4 w-4 cursor-pointer accent-blue-500 disabled:cursor-not-allowed disabled:opacity-30"
                />
            </td>
            <td className="px-3 py-2 font-mono text-xs font-medium">
                <a
                    href={docsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 hover:underline"
                >
                    {setting.name}
                </a>
            </td>
            <td className="px-3 py-2 text-gray-400 text-xs">
                <CodeSpans text={setting.title} />
            </td>
            <td className="px-3 py-2">
                <div className="flex items-center gap-2">
                    <Editor value={override ?? baseline} onChange={handleValueChange} />
                    {override === undefined ? null : (
                        <>
                            <span className="whitespace-nowrap text-xs text-gray-500">
                                baseline <span className={valueClassName(baseline)}>{String(baseline)}</span>
                            </span>
                            <button
                                onClick={handleReset}
                                title="Reset to baseline"
                                className="px-1.5 text-sm leading-none text-gray-400 border border-gray-600 rounded hover:text-gray-200 hover:border-gray-400"
                            >
                                ↺
                            </button>
                        </>
                    )}
                </div>
            </td>
        </tr>
    );
};
