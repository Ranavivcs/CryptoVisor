import type { Request, Response } from 'express';
import { currentUserId } from '../../middleware/require-auth.js';
import { VoteKeySchema } from './feedback.schemas.js';
import * as feedbackService from './feedback.service.js';

/** PUT /api/feedback: body `{ section, itemId, vote, content }`. */
export async function vote(req: Request, res: Response) {
  res.json({ feedback: await feedbackService.saveVote(currentUserId(req), req.body) });
}

/** DELETE /api/feedback/:section/:itemId */
export async function unvote(req: Request, res: Response) {
  await feedbackService.removeVote(currentUserId(req), VoteKeySchema.parse(req.params));
  res.status(204).end();
}
