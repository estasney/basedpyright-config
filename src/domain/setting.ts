import { z } from 'zod';

export const typeCheckingModeSchema = z.enum(['off', 'basic', 'standard', 'strict', 'recommended', 'all']);

export const severitySchema = z.enum(['none', 'hint', 'information', 'warning', 'error']);

export const settingKindSchema = z.enum(['severity', 'boolean']);

export type TTypeCheckingMode = z.infer<typeof typeCheckingModeSchema>;
export type TSeverity = z.infer<typeof severitySchema>;
export type TSettingKind = z.infer<typeof settingKindSchema>;

export const mapModes = <T>(valueOf: (mode: TTypeCheckingMode) => T): Record<TTypeCheckingMode, T> => ({
  [typeCheckingModeSchema.enum.off]: valueOf(typeCheckingModeSchema.enum.off),
  [typeCheckingModeSchema.enum.basic]: valueOf(typeCheckingModeSchema.enum.basic),
  [typeCheckingModeSchema.enum.standard]: valueOf(typeCheckingModeSchema.enum.standard),
  [typeCheckingModeSchema.enum.strict]: valueOf(typeCheckingModeSchema.enum.strict),
  [typeCheckingModeSchema.enum.recommended]: valueOf(typeCheckingModeSchema.enum.recommended),
  [typeCheckingModeSchema.enum.all]: valueOf(typeCheckingModeSchema.enum.all),
});

interface ISettingValueByKind {
  severity: TSeverity;
  boolean: boolean;
}

export type TSettingValueOf<K extends TSettingKind> = ISettingValueByKind[K];

// Only the catalog plugin mints these, so a name of one kind cannot key another kind's values.
// Distributing over K keeps a name of either kind assignable to the name of the kind union.
export type TSettingNameOf<K extends TSettingKind> = K extends TSettingKind ? string & z.$brand<K> : never;

export type TSettingOf<K extends TSettingKind> = {
  kind: K;
  name: TSettingNameOf<K>;
  title: string;
  baselines: Record<TTypeCheckingMode, TSettingValueOf<K>>;
};

export type TSetting<K extends TSettingKind = TSettingKind> = { [P in K]: TSettingOf<P> }[K];

export type TSettingGroupOf<K extends TSettingKind> = {
  kind: K;
  name: string;
  settings: TSettingOf<K>[];
};

export type TSettingGroup<K extends TSettingKind = TSettingKind> = { [P in K]: TSettingGroupOf<P> }[K];

export type TSettingGroups = Record<string, TSettingGroup>;

const severitySettingSchema = z.object({
  kind: settingKindSchema.extract([settingKindSchema.enum.severity]),
  name: z.string().brand<typeof settingKindSchema.enum.severity>(),
  title: z.string(),
  baselines: z.record(typeCheckingModeSchema, severitySchema),
}) satisfies z.ZodType<TSettingOf<'severity'>>;

const booleanSettingSchema = z.object({
  kind: settingKindSchema.extract([settingKindSchema.enum.boolean]),
  name: z.string().brand<typeof settingKindSchema.enum.boolean>(),
  title: z.string(),
  baselines: z.record(typeCheckingModeSchema, z.boolean()),
}) satisfies z.ZodType<TSettingOf<'boolean'>>;

const severityGroupSchema = z.object({
  kind: settingKindSchema.extract([settingKindSchema.enum.severity]),
  name: z.string(),
  settings: z.array(severitySettingSchema),
}) satisfies z.ZodType<TSettingGroupOf<'severity'>>;

const booleanGroupSchema = z.object({
  kind: settingKindSchema.extract([settingKindSchema.enum.boolean]),
  name: z.string(),
  settings: z.array(booleanSettingSchema),
}) satisfies z.ZodType<TSettingGroupOf<'boolean'>>;

export const settingGroupsSchema = z.record(
  z.string(),
  z.discriminatedUnion('kind', [severityGroupSchema, booleanGroupSchema]),
) satisfies z.ZodType<TSettingGroups>;

interface ISettingBehavior<K extends TSettingKind> {
  values: readonly TSettingValueOf<K>[];
}

export const settingBehaviors: { [K in TSettingKind]: ISettingBehavior<K> } = {
  [settingKindSchema.enum.severity]: { values: severitySchema.options },
  [settingKindSchema.enum.boolean]: { values: [true, false] },
};

export const configDocsUrl = (basedpyrightVersion: string, name: string) =>
  `https://docs.basedpyright.com/v${basedpyrightVersion}/configuration/config-files/#${name}`;
