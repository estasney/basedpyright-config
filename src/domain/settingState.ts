import {
  mapModes,
  settingKindSchema,
  type TSettingGroup,
  type TSettingGroupOf,
  type TSettingGroups,
  type TSettingKind,
  type TSettingNameOf,
  type TSettingOf,
  type TSettingValueOf,
  type TTypeCheckingMode,
} from '~/domain/setting';

// One map per setting kind, so a value can only be stored under a name of its own kind.
export type TOverrides = { [K in TSettingKind]: ReadonlyMap<TSettingNameOf<K>, TSettingValueOf<K>> };

export type TModeOverrides = Record<TTypeCheckingMode, TOverrides>;

export type TSettingIndex = { [K in TSettingKind]: ReadonlyMap<string, TSettingOf<K>> };

export type TSettingChangeOf<K extends TSettingKind> = { to: 'value'; value: TSettingValueOf<K> } | { to: 'baseline' };

export const noOverrides: TOverrides = {
  [settingKindSchema.enum.severity]: new Map(),
  [settingKindSchema.enum.boolean]: new Map(),
};

export const noModeOverrides: TModeOverrides = mapModes(() => noOverrides);

const indexGroup = <K extends TSettingKind>(
  index: { [P in TSettingKind]: Map<string, TSettingOf<P>> },
  group: TSettingGroupOf<K>,
): void => {
  for (const setting of group.settings) index[group.kind].set(setting.name, setting);
};

export const indexSettings = (groups: TSettingGroups): TSettingIndex => {
  const index = {
    [settingKindSchema.enum.severity]: new Map<string, TSettingOf<'severity'>>(),
    [settingKindSchema.enum.boolean]: new Map<string, TSettingOf<'boolean'>>(),
  };
  for (const group of Object.values(groups)) indexGroup(index, group);
  return index;
};

// A value equal to the mode's baseline drops the override, so every stored override changes the outcome.
export const withChange = <K extends TSettingKind>(
  overrides: TOverrides,
  mode: TTypeCheckingMode,
  kind: K,
  settings: Iterable<TSettingOf<K>>,
  change: TSettingChangeOf<K>,
): TOverrides => {
  const next = new Map(overrides[kind]);
  for (const setting of settings) {
    const baseline = setting.baselines[mode];
    const value = change.to === 'value' ? change.value : baseline;
    if (value === baseline) next.delete(setting.name);
    else next.set(setting.name, value);
  }
  return { ...overrides, [kind]: next };
};

export const countOverrides = (overrides: TOverrides): number =>
  Object.values(overrides).reduce((sum, kindOverrides) => sum + kindOverrides.size, 0);

export const countSettings = (groups: TSettingGroups): number =>
  Object.values(groups).reduce((sum, group) => sum + group.settings.length, 0);

const filterGroup = <K extends TSettingKind>(group: TSettingGroup<K>, needle: string): TSettingGroup<K> | null => {
  if (group.name.toLowerCase().includes(needle)) return group;
  const settings = group.settings.filter(
    (setting) => setting.name.toLowerCase().includes(needle) || setting.title.toLowerCase().includes(needle),
  );
  return settings.length > 0 ? { ...group, settings } : null;
};

export const filterGroups = (groups: TSettingGroups, term: string): [string, TSettingGroup][] => {
  if (!term) return Object.entries(groups);
  const needle = term.toLowerCase();
  return Object.entries(groups).flatMap(([id, group]): [string, TSettingGroup][] => {
    const filtered = filterGroup(group, needle);
    return filtered ? [[id, filtered]] : [];
  });
};
