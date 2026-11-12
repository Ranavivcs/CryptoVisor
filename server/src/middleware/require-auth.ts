import type { Request, RequestHandler } from 'express';
import { verifyToken } from '../lib/jwt.js';
import { HttpError } from '../lib/http-error.js';
import { AUTH_COOKIE } from '../modules/auth/auth.cookie.js';

declare module 'express-serve-static-core' {
  interface Request {
    /** Set by requireAuth: the id of the signed-in user. */
    userId?: string;
  }
}

/** Rejects the request with 401 unless it carries a valid session cookie. */
export const requireAuth: RequestHandler = (req, _res, next) => {
  const token: unknown = req.cookies?.[AUTH_COOKIE];
  const userId = typeof token === 'string' ? verifyToken(token) : null;
  if (!userId) throw new HttpError(401, 'Not signed in');
  req.userId = userId;
  next();
};

/** Reads the user id set by requireAuth. Only call it in routes mounted behind requireAuth. */
export function currentUserId(req: Request): string {
  if (!req.userId) throw new HttpError(401, 'Not signed in');
  return req.userId;
}
