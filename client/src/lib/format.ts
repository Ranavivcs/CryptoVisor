const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 });
const smallUsd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumSignificantDigits: 4 });

/** $73,349.00, or $0.1823 for coins under a dollar. Used by CoinRow and PriceChart. */
export function formatUsd(value: number): string {
  return value >= 1 ? usd.format(value) : smallUsd.format(value);
}

/** +2.4% / -0.4%. Used by CoinRow and PriceChart. */
export function formatPct(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
}

/** "2026-11-12" → "Thursday, November 12". Built from parts, so it's read as a local date (not UTC midnight). Used by DashboardPage. */
export function formatDay(dateKey: string): string {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

const clock = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' });

/** "2:32 PM", in the user's local time. Used for CoinRow's "as of" line. */
export function formatTime(iso: string): string {
  return clock.format(new Date(iso));
}

const relative = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

/** "3 hours ago", "yesterday". Used by NewsRow. */
export function timeAgo(iso: string, now = Date.now()): string {
  const minutes = Math.round((new Date(iso).getTime() - now) / 60_000);
  if (Math.abs(minutes) < 60) return relative.format(minutes, 'minute');
  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 24) return relative.format(hours, 'hour');
  return relative.format(Math.round(hours / 24), 'day');
}
