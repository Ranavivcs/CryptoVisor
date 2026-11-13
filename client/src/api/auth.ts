import { ApiError, apiFetch } from './client';

/** Mirrors `PublicUser` on the server. */
export interface User {
  id: string;
  email: string;
  name: string;
  hasPreferences: boolean;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput extends LoginInput {
  name: string;
}

/** GET /api/auth/me: the signed-in user, or null when there is no valid session. Used by useMe. */
export async function fetchMe(): Promise<User | null> {
  try {
    const { user } = await apiFetch<{ user: User }>('/auth/me');
    return user;
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) return null;
    throw err;
  }
}

/** POST /api/auth/login. The server sets the session cookie. Used by useLogin. */
export async function login(input: LoginInput): Promise<User> {
  const { user } = await apiFetch<{ user: User }>('/auth/login', { method: 'POST', body: input });
  return user;
}

/** POST /api/auth/register: creates the account and signs it in. Used by useRegister. */
export async function register(input: RegisterInput): Promise<User> {
  const { user } = await apiFetch<{ user: User }>('/auth/register', { method: 'POST', body: input });
  return user;
}

/** POST /api/auth/logout: the server clears the cookie. Used by useLogout. */
export function logout(): Promise<void> {
  return apiFetch<void>('/auth/logout', { method: 'POST' });
}
