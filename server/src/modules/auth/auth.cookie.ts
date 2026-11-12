import type { CookieOptions } from 'express';
import { isProduction } from '../../config/env.js';
import { TOKEN_MAX_AGE_MS } from '../../lib/jwt.js';

export const AUTH_COOKIE = 'token';

/**
 * httpOnly: page JavaScript can't read the token, which limits the damage of an XSS bug.
 * sameSite lax: enough because the client calls the API on its own origin
 * (Vite proxy locally, Vercel rewrite in production), so the cookie is first-party.
 */
export const authCookieOptions: CookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  secure: isProduction,
  path: '/',
};

export const sessionCookieOptions: CookieOptions = { ...authCookieOptions, maxAge: TOKEN_MAX_AGE_MS };
