import { z } from 'zod';

import {
  defaultProjectOptionValues,
  projectOptionNameSchema,
  type TProjectOptionValues,
} from '~/domain/projectOption';
import {
  mapModes,
  settingKindSchema,
  severitySchema,
  type TSettingKind,
  type TSettingNameOf,
  type TSettingValueOf,
  type TTypeCheckingMode,
  typeCheckingModeSchema,
} from '~/domain/setting';
import { noModeOverrides, type TModeOverrides, type TOverrides, type TSettingIndex } from '~/domain/settingState';

export const SNAPSHOT_SCHEMA_VERSION = 1;

type TStoredOverrides = { [K in TSettingKind]: Record<string, TSettingValueOf<K>> };

const storedOverridesSchema = z.object({
  [settingKindSchema.enum.severity]: z.record(z.string(), severitySchema),
  [settingKindSchema.enum.boolean]: z.record(z.string(), z.boolean()),
}) satisfies z.ZodType<TStoredOverrides>;

export const snapshotSchema = z.object({
  schemaVersion: z.literal(SNAPSHOT_SCHEMA_VERSION),
  basedpyrightVersion: z.string(),
  mode: typeCheckingModeSchema,
  overridesByMode: z.record(typeCheckingModeSchema, storedOverridesSchema),
  projectOptions: z.record(projectOptionNameSchema, z.array(z.string()).readonly()) satisfies z.ZodType<TProjectOptionValues>,
});

export type TSnapshot = z.infer<typeof snapshotSchema>;

export interface IConfigState {
  mode: TTypeCheckingMode;
  overridesByMode: TModeOverrides;
  projectOptions: TProjectOptionValues;
}

export interface IHydratedState extends IConfigState {
  droppedNames: readonly string[];
}

export const initialHydratedState: IHydratedState = {
  mode: typeCheckingModeSchema.enum.recommended,
  overridesByMode: noModeOverrides,
  projectOptions: defaultProjectOptionValues,
  droppedNames: [],
};

export const parseSnapshot = (raw: unknown): TSnapshot | null => {
  const result = snapshotSchema.safeParse(raw);
  return result.success ? result.data : null;
};

export const makeSnapshot = (basedpyrightVersion: string, state: IConfigState): TSnapshot => ({
  schemaVersion: SNAPSHOT_SCHEMA_VERSION,
  basedpyrightVersion,
  mode: state.mode,
  overridesByMode: mapModes((mode) => ({
    [settingKindSchema.enum.severity]: Object.fromEntries(state.overridesByMode[mode].severity),
    [settingKindSchema.enum.boolean]: Object.fromEntries(state.overridesByMode[mode].boolean),
  })),
  projectOptions: state.projectOptions,
});

// Stored names are plain strings; looking them up in the catalog index is what restores their kind.
// Overrides that now equal the mode's baseline are dropped silently, since they no longer change the outcome.
const reconcileKind = <K extends TSettingKind>(
  index: TSettingIndex,
  kind: K,
  mode: TTypeCheckingMode,
  stored: Record<string, TSettingValueOf<K>>,
  droppedNames: Set<string>,
): ReadonlyMap<TSettingNameOf<K>, TSettingValueOf<K>> => {
  const kept = new Map<TSettingNameOf<K>, TSettingValueOf<K>>();
  for (const [name, value] of Object.entries(stored)) {
    const setting = index[kind].get(name);
    if (setting === undefined) droppedNames.add(name);
    else if (value !== setting.baselines[mode]) kept.set(setting.name, value);
  }
  return kept;
};

const reconcileOverrides = (
  index: TSettingIndex,
  mode: TTypeCheckingMode,
  stored: TStoredOverrides,
  droppedNames: Set<string>,
): TOverrides => ({
  [settingKindSchema.enum.severity]: reconcileKind(index, settingKindSchema.enum.severity, mode, stored.severity, droppedNames),
  [settingKindSchema.enum.boolean]: reconcileKind(index, settingKindSchema.enum.boolean, mode, stored.boolean, droppedNames),
});

export const reconcileSnapshot = (index: TSettingIndex, snapshot: TSnapshot): IHydratedState => {
  const droppedNames = new Set<string>();
  const overridesByMode = mapModes((mode) =>
    reconcileOverrides(index, mode, snapshot.overridesByMode[mode], droppedNames),
  );
  return {
    mode: snapshot.mode,
    overridesByMode,
    projectOptions: snapshot.projectOptions,
    droppedNames: [...droppedNames].sort(),
  };
};
