import type { Request, Response } from 'express';
import { currentUserId } from '../../middleware/require-auth.js';
import { PREFERENCE_OPTIONS } from './preferences.catalog.js';
import * as preferencesService from './preferences.service.js';

/** GET /api/preferences/options: the quiz's answer choices. */
export function options(_req: Request, res: Response) {
  res.json(PREFERENCE_OPTIONS);
}

/** GET /api/preferences: `{ preferences }`, which is null before onboarding. */
export async function get(req: Request, res: Response) {
  res.json({ preferences: await preferencesService.getPreferences(currentUserId(req)) });
}

/** PUT /api/preferences: saves the quiz answers (body already validated). */
export async function save(req: Request, res: Response) {
  res.json({ preferences: await preferencesService.savePreferences(currentUserId(req), req.body) });
}
