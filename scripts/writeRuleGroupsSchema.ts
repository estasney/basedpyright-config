import { writeFileSync } from 'node:fs';

import { z } from 'zod';

import { ruleGroupCatalogSchema } from '../src/domain/ruleGroup.ts';

writeFileSync(
  new URL('../src/assets/ruleGroups.schema.json', import.meta.url),
  `${JSON.stringify(z.toJSONSchema(ruleGroupCatalogSchema), null, 2)}\n`,
);
