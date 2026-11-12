interface Entry<V> {
  value: V;
  expiresAt: number;
}

/**
 * A small in-memory cache-aside helper for external API calls.
 * - Fresh value in the cache: return it without calling the API.
 * - Expired or missing: call `load`, store the result.
 * - Several callers ask for the same missing key at once: they share one `load` call
 *   (no "cache stampede" that would multiply API calls and hit rate limits).
 * - `load` fails but an old value exists: serve the stale value instead of an error,
 *   because a price from 5 minutes ago beats an empty card.
 *
 * In-memory is enough for one server instance. Several instances would share Redis instead.
 */
export class TtlCache<V> {
  private readonly entries = new Map<string, Entry<V>>();
  private readonly inFlight = new Map<string, Promise<V>>();
  private readonly ttlMs: number;

  constructor(ttlMs: number) {
    this.ttlMs = ttlMs;
  }

  async getOrLoad(key: string, load: () => Promise<V>): Promise<V> {
    const entry = this.entries.get(key);
    if (entry && entry.expiresAt > Date.now()) return entry.value;

    let pending = this.inFlight.get(key);
    if (!pending) {
      pending = load()
        .then((value) => {
          this.entries.set(key, { value, expiresAt: Date.now() + this.ttlMs });
          return value;
        })
        .finally(() => this.inFlight.delete(key));
      this.inFlight.set(key, pending);
    }

    try {
      return await pending;
    } catch (err) {
      if (entry) return entry.value;
      throw err;
    }
  }

  clear() {
    this.entries.clear();
    this.inFlight.clear();
  }
}
