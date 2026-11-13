import bcrypt from 'bcryptjs';
import { isUniqueViolation, prisma } from '../../lib/db.js';
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

/** DB row → the client-facing user (`hasPreferences` instead of the preferences row). Used by every function below. */
function toPublicUser(row: PublicUserRow): PublicUser {
  return { id: row.id, email: row.email, name: row.name, hasPreferences: row.preferences !== null };
}

/**
 * A hash of a throwaway password, computed once at startup. `login` compares against it when the
 * email is unknown, so both cases cost one bcrypt check and take about the same time.
 */
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', BCRYPT_ROUNDS);

/**
 * Creates a user. Throws 409 if the email is already registered.
 * The database's unique email constraint is the check, so two signups racing each other with
 * the same email still get a 409, not a 500. Called by the register controller (POST /api/auth/register).
 */
export async function register({ email, name, password }: RegisterInput): Promise<PublicUser> {
  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  try {
    const user = await prisma.user.create({
      data: { email, name, passwordHash },
      select: publicUserSelect,
    });
    return toPublicUser(user);
  } catch (err) {
    if (isUniqueViolation(err)) throw new HttpError(409, 'An account with this email already exists');
    throw err;
  }
}

/**
 * Checks credentials. Throws the same 401, after the same amount of work, whether the email or the
 * password is wrong, so neither the response nor its timing reveals which emails are registered.
 * Called by the login controller (POST /api/auth/login).
 */
export async function login({ email, password }: LoginInput): Promise<PublicUser> {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { ...publicUserSelect, passwordHash: true },
  });
  const matches = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !matches) throw new HttpError(401, 'Invalid email or password');
  return toPublicUser(user);
}

/** Loads the signed-in user. Throws 401 if the account no longer exists. Called by the me controller (GET /api/auth/me). */
export async function getUser(userId: string): Promise<PublicUser> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: publicUserSelect });
  if (!user) throw new HttpError(401, 'Not signed in');
  return toPublicUser(user);
}
