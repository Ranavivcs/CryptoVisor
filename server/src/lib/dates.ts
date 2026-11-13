/**
 * Calendar-day helpers. "Insight of the day" needs to know which day it is for the user,
 * and that depends on their time zone, not the server's.
 */

/**
 * True for an IANA time zone name this runtime knows, e.g. "Asia/Jerusalem".
 * Used by the insight route (dashboard.routes.ts) to validate the client's `?tz=`.
 */
export function isTimeZone(value: unknown): value is string {
  if (typeof value !== 'string' || value === '') return false;
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

/**
 * Today's calendar date in the given time zone, as a date with no time part (UTC midnight of
 * that date, which is how Postgres `@db.Date` columns are read and written).
 * Using the user's zone (not UTC) makes the insight switch at the user's own midnight, the same
 * moment the dashboard's date line changes. The server computes the date itself (the client only
 * names its zone), so a client can't ask for arbitrary days and trigger extra LLM calls.
 * Used by `getInsightSection` (dashboard.service.ts).
 */
export function todayIn(timeZone = 'UTC', now = new Date()): Date {
  // en-CA formats as YYYY-MM-DD.
  const day = new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
  return new Date(day);
}

/** "2026-11-13" for a date from `todayIn`. Used to build the id of a not-stored fallback insight. */
export const dayKey = (day: Date): string => day.toISOString().slice(0, 10);
