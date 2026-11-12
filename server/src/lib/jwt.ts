import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

const TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days
export const TOKEN_MAX_AGE_MS = TOKEN_TTL_SECONDS * 1000;

/** Signs a session token whose subject (`sub`) is the user id. */
export function signToken(userId: string): string {
  return jwt.sign({ sub: userId }, env.JWT_SECRET, { expiresIn: TOKEN_TTL_SECONDS });
}

/** Returns the user id inside a valid token, or null if the token is invalid or expired. */
export function verifyToken(token: string): string | null {
  try {
    const payload = jwt.verify(token, env.JWT_SECRET);
    return typeof payload === 'object' && typeof payload.sub === 'string' ? payload.sub : null;
  } catch {
    return null;
  }
}
