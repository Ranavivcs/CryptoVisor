import { z } from 'zod';
import { Section } from '../../generated/prisma/enums.js';

const MAX_SNAPSHOT_CHARS = 5000;

export const VoteSchema = z.object({
  section: z.enum(Section),
  itemId: z.string().trim().min(1).max(200),
  vote: z.union([z.literal(1), z.literal(-1)], 'Vote must be 1 (up) or -1 (down)'),
  /** What the user saw: the item as the dashboard displayed it. */
  content: z
    .record(z.string(), z.unknown())
    .refine((value) => JSON.stringify(value).length <= MAX_SNAPSHOT_CHARS, 'Content is too large'),
});

export const VoteKeySchema = z.object({
  section: z.enum(Section),
  itemId: z.string().trim().min(1).max(200),
});

export type VoteInput = z.infer<typeof VoteSchema>;
export type VoteKey = z.infer<typeof VoteKeySchema>;
