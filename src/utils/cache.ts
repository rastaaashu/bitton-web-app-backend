/**
 * Simple in-memory TTL cache — no external dependencies.
 * Used to avoid redundant RPC calls for immutable data (e.g. block timestamps).
 */
class SimpleCache<T> {
  private cache = new Map<string, { value: T; expires: number }>();

  get(key: string): T | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expires) {
      this.cache.delete(key);
      return undefined;
    }
    return entry.value;
  }

  set(key: string, value: T, ttlMs: number): void {
    this.cache.set(key, { value, expires: Date.now() + ttlMs });
    // Cleanup old entries when the map grows too large
    if (this.cache.size > 1000) {
      for (const [k, v] of this.cache) {
        if (Date.now() > v.expires) this.cache.delete(k);
      }
    }
  }

  clear(): void {
    this.cache.clear();
  }

  get size(): number {
    return this.cache.size;
  }
}

/** Block number -> timestamp. Cached for 1 hour (timestamps never change). */
export const blockCache = new SimpleCache<number>();

/** Address -> balance string. Short TTL for fast-changing data. */
export const balanceCache = new SimpleCache<string>();

/** Generic contract state cache. */
export const contractStateCache = new SimpleCache<any>();

export { SimpleCache };
