import { Router, type Request, type Response } from 'express';
import { currentUserId, requireAuth } from '../../middleware/require-auth.js';
import * as dashboard from './dashboard.service.js';

/**
 * One endpoint per dashboard section, so each card loads, fails and refreshes on its own.
 * The handlers are one-liners, so they live here instead of a separate controller file.
 */
export const dashboardRouter = Router();

dashboardRouter.use(requireAuth);

/** Wraps a section loader as a route handler: (userId) → JSON. */
const section = (load: (userId: string) => Promise<unknown>) => async (req: Request, res: Response) => {
  res.json(await load(currentUserId(req)));
};

dashboardRouter.get('/prices', section(dashboard.getPricesSection));
dashboardRouter.get('/news', section(dashboard.getNewsSection));
// ?tz=Asia/Jerusalem decides which calendar day "today" is. An unknown or missing zone falls back to UTC.
dashboardRouter.get('/insight', async (req, res) => {
  const timeZone = dashboard.isTimeZone(req.query.tz) ? req.query.tz : 'UTC';
  res.json(await dashboard.getInsightSection(currentUserId(req), timeZone));
});
dashboardRouter.get('/meme', section(dashboard.getMemeSection));
