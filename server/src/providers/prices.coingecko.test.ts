import { describe, expect, it } from 'vitest';
import { thin } from './prices.coingecko.js';

describe('thin', () => {
  it('keeps the first and last values, evenly spaced in between', () => {
    const hourly = Array.from({ length: 168 }, (_, i) => i); // 7 days of hourly prices
    const thinned = thin(hourly, 42);
    expect(thinned).toHaveLength(42);
    expect(thinned[0]).toBe(0);
    expect(thinned.at(-1)).toBe(167); // the latest price, so the chart ends "now"
    const gaps = thinned.slice(1).map((value, i) => value - thinned[i]);
    expect(Math.max(...gaps) - Math.min(...gaps)).toBeLessThanOrEqual(1);
  });

  it('returns short series unchanged', () => {
    expect(thin([1, 2, 3], 42)).toEqual([1, 2, 3]);
  });
});
