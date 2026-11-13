import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client.js';
import { env } from '../config/env.js';

/** The single Prisma client shared by the whole server (one connection pool). */
export const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: env.DATABASE_URL }),
});

/**
 * True when a Prisma write failed on a unique constraint (Prisma error code P2002), e.g. a second
 * signup with the same email. Lets services turn that race into a clear 4xx instead of a 500.
 * Used by `register` in auth.service.ts.
 */
export function isUniqueViolation(err: unknown): boolean {
  return typeof err === 'object' && err !== null && 'code' in err && err.code === 'P2002';
}
