import type { Section } from '../../generated/prisma/enums.js';
import type { Prisma } from '../../generated/prisma/client.js';
import { prisma } from '../../lib/db.js';
import { requirePreferences } from '../preferences/preferences.service.js';
import type { VoteInput, VoteKey } from './feedback.schemas.js';

/**
 * Votes (👍/👎) on dashboard items. Read by dashboard.service.ts (to show each thumb's state and to
 * hide what the user voted down) and written by the feedback controller (PUT/DELETE /api/feedback).
 */

/** 1 = up, -1 = down, 0 = no vote yet. */
export type MyVote = 1 | -1 | 0;

/** The user's votes on the given items, so each card can show its current thumb state. Used by `withVotes` (dashboard.service.ts). */
export async function getMyVotes(userId: string, section: Section, itemIds: string[]): Promise<Map<string, MyVote>> {
  const rows = await prisma.feedback.findMany({
    where: { userId, section, itemId: { in: itemIds } },
    select: { itemId: true, vote: true },
  });
  return new Map(rows.map((row) => [row.itemId, row.vote as MyVote]));
}

/** Item ids the user voted down in a section. Used by the news and meme sections to stop showing them. */
export async function getDownvotedIds(userId: string, section: Section): Promise<Set<string>> {
  const rows = await prisma.feedback.findMany({ where: { userId, section, vote: -1 }, select: { itemId: true } });
  return new Set(rows.map((row) => row.itemId));
}

/**
 * Records a thumbs up/down. Voting again on the same item changes the vote (upsert).
 * The snapshot stores what the user saw together with their preferences at that moment:
 * that pair (context → content → reaction) is what makes the row usable as training data
 * (see docs/FEEDBACK_TRAINING.md). Called by the vote controller (PUT /api/feedback).
 */
export async function saveVote(userId: string, { section, itemId, vote, content }: VoteInput) {
  const { assets, investorType, contentTypes } = await requirePreferences(userId);
  const snapshot = { item: content, preferences: { assets, investorType, contentTypes }, votedAt: new Date().toISOString() };
  const contentSnapshot = snapshot as Prisma.InputJsonValue;

  return prisma.feedback.upsert({
    where: { userId_section_itemId: { userId, section, itemId } },
    create: { userId, section, itemId, vote, contentSnapshot },
    update: { vote, contentSnapshot },
    select: { section: true, itemId: true, vote: true },
  });
}

/**
 * Removes a vote (the user clicked the same thumb again). Removing a missing vote is a no-op.
 * Called by the unvote controller (DELETE /api/feedback/:section/:itemId).
 */
export async function removeVote(userId: string, { section, itemId }: VoteKey) {
  await prisma.feedback.deleteMany({ where: { userId, section, itemId } });
}
