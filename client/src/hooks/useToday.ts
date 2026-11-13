import { useEffect, useState } from 'react';

/** The local calendar date as YYYY-MM-DD (en-CA formats dates that way). */
export function localDateKey(now = new Date()): string {
  return now.toLocaleDateString('en-CA');
}

/** The user's IANA time zone, e.g. "Asia/Jerusalem". The server uses it to decide which day "today" is. */
export const userTimeZone = (): string => Intl.DateTimeFormat().resolvedOptions().timeZone;

/**
 * Today's local date (YYYY-MM-DD), which updates itself at midnight. A tab left open overnight
 * then shows the new date and fetches the new day's insight without a reload.
 * The effect is a timer (an outside system), which is what effects are for: no polling,
 * one timeout per day.
 */
export function useToday(): string {
  const [today, setToday] = useState(localDateKey);

  useEffect(() => {
    const now = new Date();
    const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    // +1 s so the timer can't fire a hair before midnight and read the old date.
    const timer = setTimeout(() => setToday(localDateKey()), nextMidnight.getTime() - now.getTime() + 1000);
    return () => clearTimeout(timer);
  }, [today]);

  return today;
}
