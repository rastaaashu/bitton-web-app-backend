/**
 * Simple in-memory TTL cache — no external dependencies.
 * Used to avoid redundant RPC calls for immutable data (e.g. block timestamps).
 */
declare class SimpleCache<T> {
    private cache;
    get(key: string): T | undefined;
    set(key: string, value: T, ttlMs: number): void;
    clear(): void;
    get size(): number;
}
/** Block number -> timestamp. Cached for 1 hour (timestamps never change). */
export declare const blockCache: SimpleCache<number>;
/** Address -> balance string. Short TTL for fast-changing data. */
export declare const balanceCache: SimpleCache<string>;
/** Generic contract state cache. */
export declare const contractStateCache: SimpleCache<any>;
export { SimpleCache };
//# sourceMappingURL=cache.d.ts.map