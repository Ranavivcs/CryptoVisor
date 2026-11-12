import bcrypt from 'bcryptjs';
import { prisma } from '../../lib/db.js';
import { HttpError } from '../../lib/http-error.js';
import type { LoginInput, RegisterInput } from './auth.schemas.js';

const BCRYPT_ROUNDS = 10;

/** The user as the client sees it. Never includes the password hash. */
export interface PublicUser {
  id: string;
  email: string;
  name: string;
  hasPreferences: boolean;
}

const publicUserSelect = {
  id: true,
  email: true,
  name: true,
  preferences: { select: { id: true } },
} as const;

interface PublicUserRow {
  id: string;
  email: string;
  name: string;
  preferences: { id: string } | null;
}

function toPublicUser(row: PublicUserRow): PublicUser {
  return { id: row.id, email: row.email, name: row.name, hasPreferences: row.preferences !== null };
}

/** Creates a user. Throws 409 if the email is already registered. */
export async function register({ email, name, password }: RegisterInput): Promise<PublicUser> {
  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (existing) throw new HttpError(409, 'An account with this email already exists');

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const user = await prisma.user.create({
    data: { email, name, passwordHash },
    select: publicUserSelect,
  });
  return toPublicUser(user);
}

/**
 * Checks credentials. Throws the same 401 whether the email or the password is wrong,
 * so the response doesn't reveal which emails are registered.
 */
export async function login({ email, password }: LoginInput): Promise<PublicUser> {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { ...publicUserSelect, passwordHash: true },
  });
  const valid = user !== null && (await bcrypt.compare(password, user.passwordHash));
  if (!user || !valid) throw new HttpError(401, 'Invalid email or password');
  return toPublicUser(user);
}

/** Loads the signed-in user. Throws 401 if the account no longer exists. */
export async function getUser(userId: string): Promise<PublicUser> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: publicUserSelect });
  if (!user) throw new HttpError(401, 'Not signed in');
  return toPublicUser(user);
}
