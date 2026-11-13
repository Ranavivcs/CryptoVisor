import { Router, type Request, type Response } from 'express';
import { isTimeZone } from '../../lib/dates.js';
import { currentUserId, requireAuth } from '../../middleware/require-auth.js';
import * as dashboard from './dashboard.service.js';

/**
 * One endpoint per dashboard section, so each card loads, fails and refreshes on its own.
 * Mounted at /api/dashboard in app.ts. The handlers are one-liners, so they live here
 * instead of a separate controller file.
 */
export const dashboardRouter = Router();

dashboardRouter.use(requireAuth);

/** Wraps a section loader as a route handler: (userId, request) → JSON. Used by the routes below. */
const section = (load: (userId: string, req: Request) => Promise<unknown>) => async (req: Request, res: Response) => {
  res.json(await load(currentUserId(req), req));
};

/** `?tz=Asia/Jerusalem` decides which calendar day "today" is; an unknown or missing zone means UTC. */
const timeZoneOf = (req: Request): string => (isTimeZone(req.query.tz) ? req.query.tz : 'UTC');

dashboardRouter.get('/prices', section(dashboard.getPricesSection));
dashboardRouter.get('/news', section(dashboard.getNewsSection));
dashboardRouter.get('/insight', section((userId, req) => dashboard.getInsightSection(userId, timeZoneOf(req))));
dashboardRouter.get('/meme', section(dashboard.getMemeSection));
