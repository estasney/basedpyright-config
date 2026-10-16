import { z } from 'zod';

const titledSchema = z.object({
  title: z.string().optional(),
});

// The parts of basedpyright's pyrightconfig JSON Schema that supply titles. A setting's title sits
// under `properties`, or under `definitions` when its property is only a `$ref`.
export const basedpyrightConfigSchemaSchema = z.object({
  properties: z.partialRecord(z.string(), titledSchema),
  definitions: z.partialRecord(z.string(), titledSchema),
});

export type TBasedpyrightConfigSchema = z.infer<typeof basedpyrightConfigSchemaSchema>;
