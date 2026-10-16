import { z } from 'zod';

export const projectOptionKindSchema = z.enum(['path-list']);

export const projectOptionNameSchema = z.enum(['include', 'extraPaths', 'exclude', 'ignore']);

export type TProjectOptionKind = z.infer<typeof projectOptionKindSchema>;
export type TProjectOptionName = z.infer<typeof projectOptionNameSchema>;

export const projectOptionKinds = {
  include: projectOptionKindSchema.enum['path-list'],
  extraPaths: projectOptionKindSchema.enum['path-list'],
  exclude: projectOptionKindSchema.enum['path-list'],
  ignore: projectOptionKindSchema.enum['path-list'],
} satisfies Record<TProjectOptionName, TProjectOptionKind>;

export type TProjectOptionKindOf<N extends TProjectOptionName> = (typeof projectOptionKinds)[N];

interface IProjectOptionValueByKind {
  'path-list': readonly string[];
}

export type TProjectOptionValueOf<K extends TProjectOptionKind> = IProjectOptionValueByKind[K];

export type TProjectOptionValues = {
  [N in TProjectOptionName]: TProjectOptionValueOf<TProjectOptionKindOf<N>>;
};

export const projectOptionTitlesSchema = z.record(projectOptionNameSchema, z.string());

export type TProjectOptionTitles = z.infer<typeof projectOptionTitlesSchema>;

interface IProjectOptionBehavior<K extends TProjectOptionKind> {
  defaultValue: TProjectOptionValueOf<K>;
  isDefault: (value: TProjectOptionValueOf<K>) => boolean;
  tomlValue: (value: TProjectOptionValueOf<K>) => string;
}

export const projectOptionBehaviors: { [K in TProjectOptionKind]: IProjectOptionBehavior<K> } = {
  [projectOptionKindSchema.enum['path-list']]: {
    defaultValue: [],
    isDefault: (paths) => paths.length === 0,
    tomlValue: (paths) => `[\n${paths.map((path) => `    ${JSON.stringify(path)},`).join('\n')}\n]`,
  },
};

export const defaultProjectOptionValues: TProjectOptionValues = {
  include: projectOptionBehaviors[projectOptionKinds.include].defaultValue,
  extraPaths: projectOptionBehaviors[projectOptionKinds.extraPaths].defaultValue,
  exclude: projectOptionBehaviors[projectOptionKinds.exclude].defaultValue,
  ignore: projectOptionBehaviors[projectOptionKinds.ignore].defaultValue,
};
