import {type ChangeEvent, useCallback, useMemo} from "react";

import type {TSettingGroup, TSettingGroups} from "~/domain/setting";
import {filterGroups} from "~/domain/settingState";
import {useDebouncedState} from "~/hooks/useDebouncedState.ts";

interface IUseGroupSearch {
    searchTerm: string;
    filteredGroups: [string, TSettingGroup][];
    onSearchChange: (event: ChangeEvent<HTMLInputElement>) => void;
}

export const useGroupSearch = (groups: TSettingGroups, onSearchStart: () => void): IUseGroupSearch => {
    const [searchTerm, debouncedSearchTerm, setSearchTerm] = useDebouncedState('', 250);

    const filteredGroups = useMemo(
        () => filterGroups(groups, debouncedSearchTerm),
        [groups, debouncedSearchTerm],
    );

    const onSearchChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
        if (searchTerm === '' && event.target.value !== '') onSearchStart();
        setSearchTerm(event.target.value);
    }, [searchTerm, setSearchTerm, onSearchStart]);

    return {searchTerm, filteredGroups, onSearchChange};
};
