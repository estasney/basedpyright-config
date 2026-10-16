import {useCallback} from "react";

import {SettingRow} from "~/components/SettingRow";
import {TriStateCheckbox} from "~/components/TriStateCheckbox";
import {groupSelectionState, isSettingSelected, type TSelection} from "~/domain/selection";
import {
    configDocsUrl,
    type TSettingGroupOf,
    type TSettingKind,
    type TSettingOf,
    type TTypeCheckingMode,
} from "~/domain/setting";
import type {TOverrides, TSettingChangeOf} from "~/domain/settingState";

interface ISettingGroupProps<K extends TSettingKind> {
    groupId: string;
    group: TSettingGroupOf<K>;
    isExpanded: boolean;
    basedpyrightVersion: string;
    mode: TTypeCheckingMode;
    overrides: TOverrides;
    selection: TSelection | null;
    onToggle: (groupId: string) => void;
    onSelectGroup: (kind: K, settings: readonly TSettingOf<K>[], isSelected: boolean) => void;
    onSelectSetting: (setting: TSettingOf<K>, isSelected: boolean, isRange: boolean) => void;
    onChange: (kind: K, settings: readonly TSettingOf<K>[], change: TSettingChangeOf<K>) => void;
}

export const SettingGroup = <K extends TSettingKind>({
    groupId,
    group,
    isExpanded,
    basedpyrightVersion,
    mode,
    overrides,
    selection,
    onToggle,
    onSelectGroup,
    onSelectSetting,
    onChange,
}: ISettingGroupProps<K>) => {
    const kindOverrides = overrides[group.kind];
    const overriddenCount = group.settings.filter((setting) => kindOverrides.has(setting.name)).length;
    const isSelectionDisabled = selection !== null && selection.kind !== group.kind;

    const handleToggle = useCallback(() => {
        onToggle(groupId);
    }, [onToggle, groupId]);

    const handleGroupSelect = useCallback(
        (isSelected: boolean) => {
            onSelectGroup(group.kind, group.settings, isSelected);
        },
        [onSelectGroup, group],
    );

    return (
        <div className="border-b border-gray-700 last:border-b-0">
            <div className="flex items-center bg-gray-700/40 hover:bg-gray-700">
                <div className="w-12 shrink-0 flex justify-center">
                    <TriStateCheckbox
                        state={groupSelectionState(selection, group.settings)}
                        disabled={isSelectionDisabled}
                        onChange={handleGroupSelect}
                    />
                </div>
                <button
                    onClick={handleToggle}
                    className="flex-1 flex items-center justify-between px-4 py-3 text-left text-sm"
                >
                    <div>
                        <span className="font-bold text-gray-200">{group.name}</span>
                        <span className="ml-2 text-xs text-gray-400">({group.settings.length} settings)</span>
                        {overriddenCount > 0 ? (
                            <span className="ml-2 text-xs text-amber-300">{overriddenCount} overridden</span>
                        ) : null}
                    </div>
                    <span className="font-sans text-base text-gray-400">{isExpanded ? '▾' : '▸'}</span>
                </button>
            </div>

            {isExpanded ? (
                <div className="border-t border-gray-700 bg-gray-800">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-700/40 text-left text-gray-300">
                            <tr>
                                <th className="w-12 px-2 py-2" />
                                <th className="w-80 px-3 py-2 font-medium">Setting</th>
                                <th className="px-3 py-2 font-medium">Description</th>
                                <th className="w-80 px-3 py-2 font-medium">Value</th>
                            </tr>
                        </thead>
                        <tbody>
                            {group.settings.map((setting) => (
                                <SettingRow
                                    key={setting.name}
                                    setting={setting}
                                    baseline={setting.baselines[mode]}
                                    override={kindOverrides.get(setting.name)}
                                    docsUrl={configDocsUrl(basedpyrightVersion, setting.name)}
                                    isSelected={isSettingSelected(selection, setting)}
                                    isSelectionDisabled={isSelectionDisabled}
                                    onSelect={onSelectSetting}
                                    onChange={onChange}
                                />
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : null}
        </div>
    );
};
