import { prisma } from '../../lib/db.js';
import type { PreferencesInput } from './preferences.schemas.js';

const preferencesSelect = { assets: true, investorType: true, contentTypes: true, updatedAt: true } as const;

/** The user's saved answers, or null if they haven't finished onboarding. */
export function getPreferences(userId: string) {
  return prisma.preferences.findUnique({ where: { userId }, select: preferencesSelect });
}

/** Saves the quiz answers. The first save completes onboarding; later saves overwrite (upsert). */
export function savePreferences(userId: string, input: PreferencesInput) {
  return prisma.preferences.upsert({
    where: { userId },
    create: { userId, ...input },
    update: input,
    select: preferencesSelect,
  });
}

export type Preferences = NonNullable<Awaited<ReturnType<typeof getPreferences>>>;
