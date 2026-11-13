import { prisma } from '../../lib/db.js';
import { HttpError } from '../../lib/http-error.js';
import type { PreferencesInput } from './preferences.schemas.js';

const preferencesSelect = { assets: true, investorType: true, contentTypes: true, updatedAt: true } as const;

/**
 * The user's saved answers, or null if they haven't finished onboarding.
 * Used by the preferences controller (GET /api/preferences) and by `requirePreferences` below.
 */
export function getPreferences(userId: string) {
  return prisma.preferences.findUnique({ where: { userId }, select: preferencesSelect });
}

/**
 * The user's saved answers, or a 409 if they haven't finished onboarding: nothing personalised
 * can be served or voted on before the quiz. Used by every dashboard section (dashboard.service.ts)
 * and by `saveVote` (feedback.service.ts), so the rule and its message live in one place.
 */
export async function requirePreferences(userId: string): Promise<Preferences> {
  const preferences = await getPreferences(userId);
  if (!preferences) throw new HttpError(409, 'Finish onboarding first');
  return preferences;
}

/**
 * Saves the quiz answers. The first save completes onboarding; later saves overwrite (upsert).
 * Used by the preferences controller (PUT /api/preferences).
 */
export function savePreferences(userId: string, input: PreferencesInput) {
  return prisma.preferences.upsert({
    where: { userId },
    create: { userId, ...input },
    update: input,
    select: preferencesSelect,
  });
}

export type Preferences = NonNullable<Awaited<ReturnType<typeof getPreferences>>>;
