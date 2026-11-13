/** Small, pure helpers for the price charts (Sparkline, PriceChart), kept here so they're easy to test. */

/** The sparkline covers the last 7 days, first point to last (the server keeps both ends when thinning). */
export const SPARKLINE_SPAN_MS = 7 * 24 * 60 * 60 * 1000;

export interface ChartStats {
  low: number;
  high: number;
  /** First point to last point, in percent. */
  changePct: number;
}

/** Low, high and overall change of a price series (at least 2 points). Used by PriceChart. */
export function chartStats(values: number[]): ChartStats {
  const first = values[0];
  const last = values[values.length - 1];
  return {
    low: Math.min(...values),
    high: Math.max(...values),
    changePct: first === 0 ? 0 : ((last - first) / first) * 100,
  };
}

/** True when a series ended at or above where it started: picks green vs red. Used by CoinRow's sparkline. */
export function endedUp(values: number[]): boolean {
  return (values.at(-1) ?? 0) >= (values[0] ?? 0);
}

/** `value` limited to the range [min, max]. Used by PriceChart for pointer and keyboard positions. */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * The approximate time of point `index` in an evenly spaced series of `count` points
 * whose last point is at `end`. Used by PriceChart's readout ("~Tue 2 PM").
 */
export function pointTime(index: number, count: number, end: Date, spanMs = SPARKLINE_SPAN_MS): Date {
  const stepMs = spanMs / (count - 1);
  return new Date(end.getTime() - (count - 1 - index) * stepMs);
}
