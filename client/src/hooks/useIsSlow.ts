import { useEffect, useState } from 'react';

/** How long a request runs before we explain the wait. A warm server answers in well under a second. */
export const SLOW_AFTER_MS = 3000;

/**
 * True once `active` (e.g. a request is pending) has lasted `afterMs`. Used for the
 * "waking up the server" hint: Render's free tier sleeps when idle, and the first request
 * then takes up to about a minute. The effect is a timer, so it's an effect by nature;
 * `active && slow` means a finished request can never show a stale hint.
 */
export function useIsSlow(active: boolean, afterMs = SLOW_AFTER_MS): boolean {
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    if (!active) return;
    const timer = setTimeout(() => setSlow(true), afterMs);
    return () => {
      clearTimeout(timer);
      setSlow(false);
    };
  }, [active, afterMs]);

  return active && slow;
}

/** The wording, in one place for the full-page loader and the login and signup forms. */
export const WAKING_UP_MESSAGE =
  'Waking up the server… It runs on a free plan that sleeps when idle, so the first request can take up to a minute.';
