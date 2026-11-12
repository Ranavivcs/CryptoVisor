import { z } from 'zod';
import { ContentType, InvestorType } from '../../generated/prisma/enums.js';
import { SUPPORTED_COIN_IDS } from './preferences.catalog.js';

/** Removes duplicates so `["bitcoin", "bitcoin"]` is stored once. */
const unique = <T>(values: T[]) => [...new Set(values)];

export const PreferencesSchema = z.object({
  assets: z
    .array(z.enum(SUPPORTED_COIN_IDS as [string, ...string[]]))
    .min(1, 'Pick at least one coin')
    .transform(unique),
  investorType: z.enum(InvestorType, 'Pick the investor type that fits you best'),
  contentTypes: z
    .array(z.enum(ContentType))
    .min(1, 'Pick at least one kind of content')
    .transform(unique),
});

export type PreferencesInput = z.infer<typeof PreferencesSchema>;
