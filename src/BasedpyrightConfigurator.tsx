import {useCallback, useMemo, useState} from 'react';

import {BulkActionPanel} from "~/components/BulkActionPanel";
import {ConfigModal} from "~/components/ConfigModal";
import {ModePicker} from "~/components/ModePicker";
import {ProjectOptions} from "~/components/ProjectOptions";
import {SettingGroup} from "~/components/SettingGroup";
import {
    selectableKind,
    settingsInRange,
    type TSelection,
    withAllVisibleSelected,
    withSelected,
} from "~/domain/selection";
import type {TSetting, TSettingKind, TSettingOf} from "~/domain/setting";
import {countSettings} from "~/domain/settingState";
import {useConfigState} from "~/hooks/useConfigState.ts";
import {useGroupSearch} from "~/hooks/useGroupSearch.ts";

type TExpandedGroups = Set<string>;

export const BasedpyrightConfigurator = () => {
    const {
        catalog,
        mode,
        overrides,
        overrideCounts,
        projectOptions,
        droppedNames,
        getConfig,
        setMode,
        changeSettings,
        setProjectOption,
    } = useConfigState();
    const {basedpyrightVersion, groups} = catalog;
    const [expandedGroups, setExpandedGroups] = useState<TExpandedGroups>(() => new Set());

    const expandAll = useCallback(() => {
        setExpandedGroups(new Set(Object.keys(groups)));
    }, [groups]);

    const {searchTerm, filteredGroups, onSearchChange} = useGroupSearch(groups, expandAll);
    const [selection, setSelection] = useState<TSelection | null>(null);
    const [anchorName, setAnchorName] = useState<string | null>(null);
    const [showConfig, setShowConfig] = useState(false);
    const [dropNoticeDismissed, setDropNoticeDismissed] = useState(false);

    const totalSettings = useMemo(() => countSettings(groups), [groups]);

    // Rows on screen, in display order: matching the search and inside an expanded group.
    const visibleSettings = useMemo(
        () =>
            filteredGroups.flatMap(([groupId, group]): readonly TSetting[] =>
                expandedGroups.has(groupId) ? group.settings : [],
            ),
        [filteredGroups, expandedGroups],
    );

    const toggleGroup = useCallback((groupId: string) => {
        setExpandedGroups((prev) => {
            const next = new Set(prev);
            if (next.has(groupId)) next.delete(groupId);
            else next.add(groupId);
            return next;
        });
    }, []);

    const collapseAll = useCallback(() => {
        setExpandedGroups(new Set());
    }, []);

    const selectSetting = useCallback(
        <K extends TSettingKind>(setting: TSettingOf<K>, isSelected: boolean, isRange: boolean) => {
            const settings = isRange && anchorName !== null ? settingsInRange(visibleSettings, anchorName, setting) : [setting];
            setSelection((prev) => withSelected(prev, setting.kind, settings, isSelected));
            setAnchorName(setting.name);
        },
        [anchorName, visibleSettings],
    );

    const selectGroup = useCallback(
        <K extends TSettingKind>(kind: K, settings: readonly TSettingOf<K>[], isSelected: boolean) => {
            setSelection((prev) => withSelected(prev, kind, settings, isSelected));
        },
        [],
    );

    const selectAllVisible = useCallback(() => {
        setSelection((prev) => withAllVisibleSelected(prev, visibleSettings));
    }, [visibleSettings]);

    const clearSelection = useCallback(() => {
        setSelection(null);
        setAnchorName(null);
    }, []);

    const openConfig = useCallback(() => {
        setShowConfig(true);
    }, []);

    const closeConfig = useCallback(() => {
        setShowConfig(false);
    }, []);

    const dismissDropNotice = useCallback(() => {
        setDropNoticeDismissed(true);
    }, []);

    const canSelectAllVisible = selectableKind(selection, visibleSettings) !== null;

    return (
        <div className={`min-h-screen bg-gray-900 p-4 ${selection === null ? '' : 'pb-24'}`}>
            <div className="max-w-6xl mx-auto">
                <div className="bg-gray-800 rounded-t-lg shadow-lg p-6">
                    <div className="flex items-baseline gap-3 mb-4">
                        <h1 className="text-2xl font-bold text-gray-100">basedpyright Configurator</h1>
                        <span className="text-sm text-gray-400">basedpyright {basedpyrightVersion}</span>
                        <span className="text-sm text-gray-400">Built: {__BUILD_DATE__}</span>
                    </div>
                    <ModePicker mode={mode} overrideCounts={overrideCounts} onChange={setMode} />
                    <div className="flex flex-wrap gap-4 items-center mb-4">
                        <input
                            type="text"
                            placeholder="Search settings..."
                            value={searchTerm}
                            onChange={onSearchChange}
                            className="flex-1 min-w-64 px-4 py-2 bg-gray-700 text-gray-100 placeholder-gray-400 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <div className="flex gap-2">
                            <button onClick={expandAll} className="px-3 py-2 text-sm bg-gray-700 text-gray-200 rounded hover:bg-gray-600">
                                Expand All
                            </button>
                            <button onClick={collapseAll} className="px-3 py-2 text-sm bg-gray-700 text-gray-200 rounded hover:bg-gray-600">
                                Collapse All
                            </button>
                            <button
                                onClick={selectAllVisible}
                                disabled={!canSelectAllVisible}
                                title={
                                    canSelectAllVisible
                                        ? 'Select every visible setting of the selectable kind'
                                        : 'Visible settings mix severity and boolean settings; select a row or group first'
                                }
                                className="px-3 py-2 text-sm bg-gray-700 text-gray-200 rounded hover:bg-gray-600 disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                Select Visible
                            </button>
                            <button onClick={openConfig} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                                Generate Config
                            </button>
                        </div>
                    </div>

                    <div className="flex gap-6 text-sm text-gray-300">
                        <span>Total: <strong>{totalSettings}</strong></span>
                        <span className="text-amber-300">Overridden in {mode}: <strong>{overrideCounts[mode]}</strong></span>
                    </div>
                </div>

                <ProjectOptions
                    basedpyrightVersion={basedpyrightVersion}
                    titles={catalog.projectOptionTitles}
                    values={projectOptions}
                    onChange={setProjectOption}
                />

                {droppedNames.length > 0 && !dropNoticeDismissed ? (
                    <div className="bg-amber-950 border border-amber-700 rounded-lg p-4 mb-4 flex items-start justify-between gap-4 text-sm text-amber-200">
                        <span>
                            Your saved overrides included {droppedNames.length === 1 ? 'a setting that no longer exists' : `${String(droppedNames.length)} settings that no longer exist`} in
                            basedpyright {basedpyrightVersion} and were updated: {droppedNames.join(', ')}
                        </span>
                        <button onClick={dismissDropNotice} className="px-3 py-1 border border-amber-700 rounded hover:bg-amber-900 shrink-0">
                            Dismiss
                        </button>
                    </div>
                ) : null}

                <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
                    {filteredGroups.map(([groupId, group]) => (
                        <SettingGroup
                            key={groupId}
                            groupId={groupId}
                            group={group}
                            isExpanded={expandedGroups.has(groupId)}
                            basedpyrightVersion={basedpyrightVersion}
                            mode={mode}
                            overrides={overrides}
                            selection={selection}
                            onToggle={toggleGroup}
                            onSelectGroup={selectGroup}
                            onSelectSetting={selectSetting}
                            onChange={changeSettings}
                        />
                    ))}
                </div>

                {filteredGroups.length === 0 ? (
                    <div className="bg-gray-800 rounded-lg shadow-lg p-8 text-center text-gray-400">
                        No settings match your search.
                    </div>
                ) : null}
            </div>

            {selection === null ? null : (
                <BulkActionPanel selection={selection} onChange={changeSettings} onClear={clearSelection} />
            )}

            {showConfig ? <ConfigModal config={getConfig()} onClose={closeConfig} /> : null}
        </div>
    );
};
