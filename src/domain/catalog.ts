import { z } from 'zod';

// Relative imports: the catalog plugin loads this module outside the app's `~` alias.
import { projectOptionTitlesSchema, type TProjectOptionTitles } from './projectOption';
import { settingGroupsSchema, type TSettingGroups } from './setting';

export type TCatalog = {
  basedpyrightVersion: string;
  groups: TSettingGroups;
  projectOptionTitles: TProjectOptionTitles;
};

export const catalogSchema = z.object({
  basedpyrightVersion: z.string(),
  groups: settingGroupsSchema,
  projectOptionTitles: projectOptionTitlesSchema,
}) satisfies z.ZodType<TCatalog>;
