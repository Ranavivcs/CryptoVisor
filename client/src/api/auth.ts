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

/** The signed-in user, or null when there is no valid session. */
export async function fetchMe(): Promise<User | null> {
  try {
    const { user } = await apiFetch<{ user: User }>('/auth/me');
    return user;
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) return null;
    throw err;
  }
}

export async function login(input: LoginInput): Promise<User> {
  const { user } = await apiFetch<{ user: User }>('/auth/login', { method: 'POST', body: input });
  return user;
}

export async function register(input: RegisterInput): Promise<User> {
  const { user } = await apiFetch<{ user: User }>('/auth/register', { method: 'POST', body: input });
  return user;
}

export function logout(): Promise<void> {
  return apiFetch<void>('/auth/logout', { method: 'POST' });
}
