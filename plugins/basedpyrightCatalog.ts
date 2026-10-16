import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { Plugin } from 'vite';
import { z } from 'zod';

import { basedpyrightConfigSchemaSchema, type TBasedpyrightConfigSchema } from '../src/domain/basedpyrightConfigSchema';
import { basedpyrightRulesetSchema, type TBasedpyrightRulesetRow } from '../src/domain/basedpyrightRuleset';
import { catalogSchema, type TCatalog } from '../src/domain/catalog';
import { projectOptionNameSchema } from '../src/domain/projectOption';
import { ruleGroupCatalogSchema, type TRuleGroup } from '../src/domain/ruleGroup';
import { invariant } from '../src/lib/invariant';

const VIRTUAL_ID = 'virtual:basedpyright-catalog';
const RESOLVED_ID = '\0' + VIRTUAL_ID;

const ASSETS = resolve(dirname(fileURLToPath(import.meta.url)), '../src/assets');
const RULESET_PATH = resolve(ASSETS, 'basedpyrightRulesets.json');
const VERSION_PATH = resolve(ASSETS, 'basedpyrightVersion.json');
const CONFIG_SCHEMA_PATH = resolve(ASSETS, 'basedpyrightConfigSchema.json');
const RULE_GROUPS_PATH = resolve(ASSETS, 'ruleGroups.json');

const parseOrThrow = <T>(label: string, raw: unknown, schema: z.ZodType<T>): T => {
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    console.error(`[basedpyright-catalog] ${label} does not match its schema:`);
    console.error(z.prettifyError(parsed.error));
    throw new Error(`${label} failed schema validation`);
  }
  return parsed.data;
};

const parseAsset = <T>(path: string, schema: z.ZodType<T>): T =>
  parseOrThrow(path, JSON.parse(readFileSync(path, 'utf8')), schema);

const titleOf = (configSchema: TBasedpyrightConfigSchema, name: string): string => {
  const title = configSchema.properties[name]?.title ?? configSchema.definitions[name]?.title;
  invariant(title !== undefined, `${CONFIG_SCHEMA_PATH} has no title for ${name}`);
  return title;
};

// Every ruleset row must land in exactly one group, and a group must hold a single setting kind.
const buildGroup = (
  id: string,
  group: TRuleGroup,
  rows: ReadonlyMap<string, TBasedpyrightRulesetRow>,
  placed: Set<string>,
  configSchema: TBasedpyrightConfigSchema,
) => {
  const settings = group.settings.map((name) => {
    const row = rows.get(name);
    invariant(row, `${id}: ${name} is not a basedpyright setting`);
    invariant(!placed.has(name), `${name} is listed in more than one group`);
    placed.add(name);
    return { ...row, title: titleOf(configSchema, name) };
  });
  const kinds = new Set(settings.map((setting) => setting.kind));
  const [kind] = kinds;
  invariant(kinds.size === 1, `${id}: mixes setting kinds ${[...kinds].join(', ')}`);
  return { kind, name: group.name, settings };
};

export const loadCatalog = (): TCatalog => {
  const ruleset = parseAsset(RULESET_PATH, basedpyrightRulesetSchema);
  const { version } = parseAsset(VERSION_PATH, z.object({ version: z.string() }));
  const configSchema = parseAsset(CONFIG_SCHEMA_PATH, basedpyrightConfigSchemaSchema);
  const { groups } = parseAsset(RULE_GROUPS_PATH, ruleGroupCatalogSchema);

  const rows = new Map(ruleset.map((row) => [row.name, row] as const));
  const placed = new Set<string>();
  const builtGroups = Object.fromEntries(
    Object.entries(groups).map(([id, group]) => [id, buildGroup(id, group, rows, placed, configSchema)]),
  );
  const unplaced = ruleset.map((row) => row.name).filter((name) => !placed.has(name));
  invariant(unplaced.length === 0, `${RULE_GROUPS_PATH} is missing ${unplaced.join(', ')}`);

  const projectOptionTitles = Object.fromEntries(
    projectOptionNameSchema.options.map((name) => [name, titleOf(configSchema, name)]),
  );

  return parseOrThrow(
    'the built catalog',
    { basedpyrightVersion: version, groups: builtGroups, projectOptionTitles },
    catalogSchema,
  );
};

export const basedpyrightCatalog = (): Plugin => ({
  name: 'basedpyright-catalog',
  resolveId(id) {
    if (id === VIRTUAL_ID) return RESOLVED_ID;
  },
  load(id) {
    if (id !== RESOLVED_ID) return;
    this.addWatchFile(RULESET_PATH);
    this.addWatchFile(VERSION_PATH);
    this.addWatchFile(CONFIG_SCHEMA_PATH);
    this.addWatchFile(RULE_GROUPS_PATH);
    return `export default ${JSON.stringify(loadCatalog())}`;
  },
});
