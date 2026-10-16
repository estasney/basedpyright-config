import {
  projectOptionBehaviors,
  projectOptionKinds,
  projectOptionNameSchema,
  type TProjectOptionName,
  type TProjectOptionValues,
} from '~/domain/projectOption';
import type { TTypeCheckingMode } from '~/domain/setting';
import type { TOverrides } from '~/domain/settingState';

interface IExecutionEnvironment {
  root: string;
  overrides: TOverrides;
}

export interface IConfigDocument {
  typeCheckingMode: TTypeCheckingMode;
  projectOptions: TProjectOptionValues;
  overrides: TOverrides;
  executionEnvironments: readonly IExecutionEnvironment[];
}

const projectOptionLines = <N extends TProjectOptionName>(name: N, value: TProjectOptionValues[N]): string[] => {
  const behavior = projectOptionBehaviors[projectOptionKinds[name]];
  return behavior.isDefault(value) ? [] : [`${name} = ${behavior.tomlValue(value)}`];
};

// Sorted by name so a setting's line is found the same way whatever its kind.
const overrideLines = (overrides: TOverrides): string[] =>
  Object.values(overrides)
    .flatMap((kindOverrides) => [...kindOverrides])
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, value]) => `${name} = ${JSON.stringify(value)}`);

// TOML basic strings accept every escape JSON.stringify emits, so scalars are written as JSON.
export const serializeConfig = (document: IConfigDocument): string => {
  const lines = [
    '[tool.basedpyright]',
    `typeCheckingMode = ${JSON.stringify(document.typeCheckingMode)}`,
    ...projectOptionNameSchema.options.flatMap((name) => projectOptionLines(name, document.projectOptions[name])),
    ...overrideLines(document.overrides),
  ];
  for (const environment of document.executionEnvironments) {
    lines.push(
      '',
      '[[tool.basedpyright.executionEnvironments]]',
      `root = ${JSON.stringify(environment.root)}`,
      ...overrideLines(environment.overrides),
    );
  }
  return `${lines.join('\n')}\n`;
};
