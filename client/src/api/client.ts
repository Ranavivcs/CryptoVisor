/** Field-level validation messages from the API, e.g. `{ email: ['Enter a valid email'] }`. */
export type FieldErrors = Partial<Record<string, string[]>>;

/** Any non-2xx response. Carries the server's message and, for 400s, per-field errors. */
export class ApiError extends Error {
  readonly status: number;
  readonly fieldErrors: FieldErrors;

  /** Built by `apiFetch` from the server's `{ error, details }` reply. */
  constructor(status: number, message: string, fieldErrors: FieldErrors = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
}

/**
 * The only place the client talks HTTP. Calls `/api/...` on the same origin
 * (the auth cookie is sent automatically), parses JSON, and throws ApiError on failure.
 * Used by every function in src/api (auth, preferences, dashboard).
 */
export async function apiFetch<T>(path: string, { method = 'GET', body }: RequestOptions = {}): Promise<T> {
  const res = await fetch(`/api${path}`, {
    method,
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (res.status === 204) return undefined as T;

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(res.status, data.error ?? 'Request failed', data.details);
  }
  return data as T;
}
