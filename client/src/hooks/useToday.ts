import { useSyncExternalStore } from 'react';

/** The local calendar date as YYYY-MM-DD (en-CA formats dates that way). Used by the store below and by tests. */
export function localDateKey(now = new Date()): string {
  return now.toLocaleDateString('en-CA');
}

/** The user's IANA time zone, e.g. "Asia/Jerusalem". Sent with the insight request (useInsight) so the server knows which day it is. */
export const userTimeZone = (): string => Intl.DateTimeFormat().resolvedOptions().timeZone;

/*
 * One app-wide "today" with one midnight timer. Every component that calls useToday reads the same
 * value, so the dashboard's date line and the insight's query key always change together.
 * The timer only runs while something is subscribed.
 */
let today = localDateKey();
const listeners = new Set<() => void>();
let timer: ReturnType<typeof setTimeout> | undefined;

/** Updates `today` and tells every subscriber, if the date has changed. */
function refresh() {
  const fresh = localDateKey();
  if (fresh === today) return;
  today = fresh;
  for (const listener of listeners) listener();
}

/** Sets a timer for just after the next local midnight; when it fires, refreshes and sets the next one. */
function scheduleMidnight() {
  const now = new Date();
  const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  // +1 s so the timer can't fire a hair before midnight and read the old date.
  timer = setTimeout(() => {
    refresh();
    scheduleMidnight();
  }, nextMidnight.getTime() - now.getTime() + 1000);
}

/** useSyncExternalStore's subscribe: the first subscriber starts the timer, the last one stops it. */
function subscribe(listener: () => void) {
  listeners.add(listener);
  if (listeners.size === 1) {
    refresh(); // the app may have been idle across midnight with nothing subscribed
    scheduleMidnight();
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) clearTimeout(timer);
  };
}

/**
 * Today's local date (YYYY-MM-DD), which updates itself at midnight. A tab left open overnight
 * then shows the new date and fetches the new day's insight without a reload.
 * Used by DashboardPage (the date line) and useInsight (the query key).
 */
export function useToday(): string {
  return useSyncExternalStore(subscribe, () => today);
}
