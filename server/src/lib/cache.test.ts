import { afterEach, describe, expect, it, vi } from 'vitest';
import { TtlCache } from './cache.js';

afterEach(() => vi.useRealTimers());

describe('TtlCache', () => {
  it('serves a fresh value without calling the loader again', async () => {
    const cache = new TtlCache<number>(1000);
    const load = vi.fn().mockResolvedValue(42);
    await cache.getOrLoad('k', load);
    expect(await cache.getOrLoad('k', load)).toBe(42);
    expect(load).toHaveBeenCalledTimes(1);
  });

  it('reloads after the TTL, and serves the stale value if the reload fails', async () => {
    vi.useFakeTimers();
    const cache = new TtlCache<number>(1000);
    await cache.getOrLoad('k', async () => 1);

    vi.advanceTimersByTime(1001);
    expect(await cache.getOrLoad('k', async () => 2)).toBe(2);

    vi.advanceTimersByTime(1001);
    expect(await cache.getOrLoad('k', () => Promise.reject(new Error('API down')))).toBe(2);
  });

  it('throws when the loader fails and there is nothing cached', async () => {
    const cache = new TtlCache<number>(1000);
    await expect(cache.getOrLoad('k', () => Promise.reject(new Error('API down')))).rejects.toThrow('API down');
  });
});
