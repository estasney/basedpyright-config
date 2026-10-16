import { z } from 'zod';

import { mapModes, settingKindSchema, severitySchema } from './setting';

// One row per setting, with its value under every typeCheckingMode; strict so a new mode fails the build.
const severityRowSchema = z
  .strictObject({ 'Diagnostic Rule': z.string(), ...mapModes(() => severitySchema) })
  .transform(({ 'Diagnostic Rule': name, ...baselines }) => ({
    kind: settingKindSchema.enum.severity,
    name,
    baselines,
  }));

const booleanRowSchema = z
  .strictObject({ 'Diagnostic Rule': z.string(), ...mapModes(() => z.boolean()) })
  .transform(({ 'Diagnostic Rule': name, ...baselines }) => ({
    kind: settingKindSchema.enum.boolean,
    name,
    baselines,
  }));

// The output of `basedpyright --printdiagnosticrulesets`.
export const basedpyrightRulesetSchema = z.array(z.union([severityRowSchema, booleanRowSchema]));

export type TBasedpyrightRulesetRow = z.infer<typeof basedpyrightRulesetSchema>[number];
