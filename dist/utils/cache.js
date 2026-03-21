"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SimpleCache = exports.contractStateCache = exports.balanceCache = exports.blockCache = void 0;
/**
 * Simple in-memory TTL cache — no external dependencies.
 * Used to avoid redundant RPC calls for immutable data (e.g. block timestamps).
 */
class SimpleCache {
    cache = new Map();
    get(key) {
        const entry = this.cache.get(key);
        if (!entry)
            return undefined;
        if (Date.now() > entry.expires) {
            this.cache.delete(key);
            return undefined;
        }
        return entry.value;
    }
    set(key, value, ttlMs) {
        this.cache.set(key, { value, expires: Date.now() + ttlMs });
        // Cleanup old entries when the map grows too large
        if (this.cache.size > 1000) {
            for (const [k, v] of this.cache) {
                if (Date.now() > v.expires)
                    this.cache.delete(k);
            }
        }
    }
    clear() {
        this.cache.clear();
    }
    get size() {
        return this.cache.size;
    }
}
exports.SimpleCache = SimpleCache;
/** Block number -> timestamp. Cached for 1 hour (timestamps never change). */
exports.blockCache = new SimpleCache();
/** Address -> balance string. Short TTL for fast-changing data. */
exports.balanceCache = new SimpleCache();
/** Generic contract state cache. */
exports.contractStateCache = new SimpleCache();
//# sourceMappingURL=cache.js.map