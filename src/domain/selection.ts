import {
  settingKindSchema,
  type TSetting,
  type TSettingKind,
  type TSettingNameOf,
  type TSettingOf,
} from '~/domain/setting';

// A selection holds settings of one kind, so a bulk change can only offer values valid for all of them.
export type TSelectionOf<K extends TSettingKind> = {
  kind: K;
  settings: ReadonlyMap<TSettingNameOf<K>, TSettingOf<K>>;
};

export type TSelection<K extends TSettingKind = TSettingKind> = { [P in K]: TSelectionOf<P> }[K];

interface ISelectionBehavior<K extends TSettingKind> {
  // Null when the selection holds the other kind.
  settingsOf: (selection: TSelection) => TSelectionOf<K>['settings'] | null;
  select: (settings: TSelectionOf<K>['settings']) => TSelection;
  narrow: (settings: readonly TSetting[]) => TSettingOf<K>[];
}

// Spelled out per kind because a union narrows only against a concrete kind.
const selectionBehaviors: { [K in TSettingKind]: ISelectionBehavior<K> } = {
  [settingKindSchema.enum.severity]: {
    settingsOf: (selection) => (selection.kind === settingKindSchema.enum.severity ? selection.settings : null),
    select: (settings) => ({ kind: settingKindSchema.enum.severity, settings }),
    narrow: (settings) => settings.flatMap((setting) => (setting.kind === settingKindSchema.enum.severity ? [setting] : [])),
  },
  [settingKindSchema.enum.boolean]: {
    settingsOf: (selection) => (selection.kind === settingKindSchema.enum.boolean ? selection.settings : null),
    select: (settings) => ({ kind: settingKindSchema.enum.boolean, settings }),
    narrow: (settings) => settings.flatMap((setting) => (setting.kind === settingKindSchema.enum.boolean ? [setting] : [])),
  },
};

export const isSettingSelected = <K extends TSettingKind>(selection: TSelection | null, setting: TSettingOf<K>): boolean =>
  selection !== null && (selectionBehaviors[setting.kind].settingsOf(selection)?.has(setting.name) ?? false);

export type TGroupSelectionState = 'all' | 'some' | 'none';

export const groupSelectionState = <K extends TSettingKind>(
  selection: TSelection | null,
  settings: readonly TSettingOf<K>[],
): TGroupSelectionState => {
  const selectedCount = settings.filter((setting) => isSettingSelected(selection, setting)).length;
  if (selectedCount === 0) return 'none';
  return selectedCount === settings.length ? 'all' : 'some';
};

// A selection of another kind is returned unchanged.
export const withSelected = <K extends TSettingKind>(
  selection: TSelection | null,
  kind: K,
  settings: Iterable<TSettingOf<K>>,
  isSelected: boolean,
): TSelection | null => {
  const current = selection === null ? new Map() : selectionBehaviors[kind].settingsOf(selection);
  if (current === null) return selection;
  const next = new Map(current);
  for (const setting of settings) {
    if (isSelected) next.set(setting.name, setting);
    else next.delete(setting.name);
  }
  return next.size === 0 ? null : selectionBehaviors[kind].select(next);
};

// The settings between the anchor and the target, inclusive, in display order and of the target's kind.
export const settingsInRange = <K extends TSettingKind>(
  orderedSettings: readonly TSetting[],
  anchorName: string,
  target: TSettingOf<K>,
): TSettingOf<K>[] => {
  const anchorIndex = orderedSettings.findIndex((setting) => setting.name === anchorName);
  const targetIndex = orderedSettings.findIndex((setting) => setting.name === target.name);
  if (anchorIndex === -1 || targetIndex === -1) return [target];
  const range = orderedSettings.slice(Math.min(anchorIndex, targetIndex), Math.max(anchorIndex, targetIndex) + 1);
  return selectionBehaviors[target.kind].narrow(range);
};

// The kind "select all" acts on: the current selection's, or the one kind shown when nothing is selected.
export const selectableKind = (selection: TSelection | null, visibleSettings: readonly TSetting[]): TSettingKind | null => {
  if (selection !== null) return selection.kind;
  const kinds = new Set(visibleSettings.map((setting) => setting.kind));
  const [onlyKind] = kinds;
  return kinds.size === 1 ? onlyKind : null;
};

export const withAllVisibleSelected = (selection: TSelection | null, visibleSettings: readonly TSetting[]): TSelection | null => {
  const kind = selectableKind(selection, visibleSettings);
  if (kind === null) return selection;
  return withSelected(selection, kind, selectionBehaviors[kind].narrow(visibleSettings), true);
};
