import type { Request, Response } from 'express';
import { signToken } from '../../lib/jwt.js';
import { currentUserId } from '../../middleware/require-auth.js';
import { AUTH_COOKIE, authCookieOptions, sessionCookieOptions } from './auth.cookie.js';
import * as authService from './auth.service.js';

/** POST /api/auth/register: creates the account and signs the user in. */
export async function register(req: Request, res: Response) {
  const user = await authService.register(req.body);
  res.cookie(AUTH_COOKIE, signToken(user.id), sessionCookieOptions);
  res.status(201).json({ user });
}

/** POST /api/auth/login */
export async function login(req: Request, res: Response) {
  const user = await authService.login(req.body);
  res.cookie(AUTH_COOKIE, signToken(user.id), sessionCookieOptions);
  res.json({ user });
}

/** POST /api/auth/logout */
export function logout(_req: Request, res: Response) {
  res.clearCookie(AUTH_COOKIE, authCookieOptions);
  res.status(204).end();
}

/** GET /api/auth/me: who is signed in. The client calls it on page load. */
export async function me(req: Request, res: Response) {
  res.json({ user: await authService.getUser(currentUserId(req)) });
}
