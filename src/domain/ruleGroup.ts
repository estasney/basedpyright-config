import { z } from 'zod';

const ruleGroupIdSchema = z
  .string()
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/)
  .describe('kebab-case id');

export const ruleGroupSchema = z.object({
  name: z.string().describe('UI heading'),
  settings: z.array(z.string()).nonempty().describe('basedpyright setting names, in display order'),
});

export const ruleGroupCatalogSchema = z.object({
  $schema: z.string().describe('JSON Schema path'),
  groups: z.record(ruleGroupIdSchema, ruleGroupSchema).describe('in display order'),
});

export type TRuleGroup = z.infer<typeof ruleGroupSchema>;
export type TRuleGroupCatalog = z.infer<typeof ruleGroupCatalogSchema>;
export type TRuleGroups = TRuleGroupCatalog['groups'];
