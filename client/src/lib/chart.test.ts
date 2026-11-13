import { describe, expect, it } from 'vitest';
import { chartStats, pointTime } from './chart';

describe('chartStats', () => {
  it('finds the low, the high and the first-to-last change', () => {
    expect(chartStats([100, 80, 120, 110])).toEqual({ low: 80, high: 120, changePct: 10 });
  });
});

describe('pointTime', () => {
  it('spaces points evenly back from the end over the span', () => {
    const end = new Date('2026-11-13T12:00:00Z');
    const day = 24 * 60 * 60 * 1000;
    expect(pointTime(7, 8, end, 7 * day).toISOString()).toBe('2026-11-13T12:00:00.000Z'); // last point = end
    expect(pointTime(0, 8, end, 7 * day).toISOString()).toBe('2026-11-06T12:00:00.000Z'); // first = 7 days earlier
    expect(pointTime(6, 8, end, 7 * day).toISOString()).toBe('2026-11-12T12:00:00.000Z');
  });
});
