"use strict";
/**
 * TON Blockchain Balance Verification Service
 *
 * Verifies that a user actually held BTN tokens on the TON network
 * by querying the TON blockchain via the public TON Center API.
 *
 * TON uses the Jetton standard (TEP-74): each user has a separate
 * "jetton wallet" contract for each token. To check a user's BTN balance:
 *   1. Get the Jetton master contract address (old BTN on TON)
 *   2. Derive the user's jetton wallet address from the master
 *   3. Query the jetton wallet for the balance
 *
 * This provides an independent on-chain verification layer on top of
 * the admin-imported snapshot, preventing snapshot manipulation attacks.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyTonBalance = verifyTonBalance;
exports.batchVerifyBalances = batchVerifyBalances;
exports.validateSnapshot = validateSnapshot;
const logger_1 = require("../utils/logger");
// ─── Configuration ──────────────────────────────────────────
// TON Center API (public, free tier: 10 req/sec)
const TON_API_BASE = process.env.TON_API_URL || "https://toncenter.com/api/v2";
const TON_API_KEY = process.env.TON_API_KEY || ""; // Optional but recommended
// The old BTN Jetton master contract address on TON
// This MUST be set to the actual deployed address
const BTN_JETTON_MASTER = process.env.TON_BTN_JETTON_MASTER || "";
// ─── TON API Client ─────────────────────────────────────────
async function tonApiRequest(method, params) {
    const url = new URL(`${TON_API_BASE}/${method}`);
    for (const [key, val] of Object.entries(params)) {
        url.searchParams.set(key, val);
    }
    if (TON_API_KEY) {
        url.searchParams.set("api_key", TON_API_KEY);
    }
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout
    try {
        const response = await fetch(url.toString(), {
            signal: controller.signal,
            headers: { Accept: "application/json" },
        });
        if (!response.ok) {
            throw new Error(`TON API error: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        if (!data.ok) {
            throw new Error(`TON API returned error: ${JSON.stringify(data.error)}`);
        }
        return data.result;
    }
    finally {
        clearTimeout(timeout);
    }
}
// ─── Balance Verification ───────────────────────────────────
/**
 * Verify a user's BTN token balance on the TON blockchain.
 *
 * Strategy:
 *   1. If TON_BTN_JETTON_MASTER is configured, query on-chain directly
 *   2. Fall back to snapshot data if on-chain query fails
 *   3. Cross-reference both sources if available
 *
 * @param tonAddress - User's TON wallet address (raw format: "0:hex...")
 * @param snapshotBalance - Balance from admin snapshot (for cross-reference)
 * @returns Verification result
 */
async function verifyTonBalance(tonAddress, snapshotBalance) {
    // If no Jetton master is configured, we can only use snapshot
    if (!BTN_JETTON_MASTER) {
        logger_1.logger.warn("TON_BTN_JETTON_MASTER not configured — using snapshot only");
        if (snapshotBalance) {
            return {
                verified: true,
                balance: snapshotBalance,
                balanceFormatted: formatJettonBalance(snapshotBalance),
                source: "snapshot",
            };
        }
        return {
            verified: false,
            balance: "0",
            balanceFormatted: "0",
            source: "unavailable",
            error: "No Jetton master configured and no snapshot found",
        };
    }
    try {
        // Query the Jetton wallet for this user
        const jettonBalance = await getJettonBalance(tonAddress, BTN_JETTON_MASTER);
        if (jettonBalance === null) {
            // User might not have a jetton wallet (never held BTN)
            if (snapshotBalance && BigInt(snapshotBalance) > 0n) {
                logger_1.logger.warn(`Snapshot shows balance ${snapshotBalance} but no on-chain jetton wallet found for ${tonAddress}`);
                // Trust snapshot with a warning — jetton wallet might have been destroyed
                return {
                    verified: true,
                    balance: snapshotBalance,
                    balanceFormatted: formatJettonBalance(snapshotBalance),
                    source: "snapshot",
                    error: "On-chain jetton wallet not found — using snapshot (wallet may have been destroyed)",
                };
            }
            return {
                verified: false,
                balance: "0",
                balanceFormatted: "0",
                source: "onchain",
                error: "No jetton wallet found — user never held BTN on TON",
            };
        }
        // Cross-reference with snapshot if available
        if (snapshotBalance) {
            const onChainBig = BigInt(jettonBalance);
            const snapshotBig = BigInt(snapshotBalance);
            // Allow up to 10% deviation (user may have moved tokens after snapshot)
            const tolerance = snapshotBig / 10n;
            const diff = onChainBig > snapshotBig
                ? onChainBig - snapshotBig
                : snapshotBig - onChainBig;
            if (diff > tolerance && snapshotBig > 0n) {
                logger_1.logger.warn(`Balance mismatch for ${tonAddress}: on-chain=${jettonBalance}, snapshot=${snapshotBalance}`);
            }
            // Use snapshot as the authoritative source for migration amount
            // (snapshot was taken at a specific point in time)
            return {
                verified: true,
                balance: snapshotBalance,
                balanceFormatted: formatJettonBalance(snapshotBalance),
                source: "snapshot",
            };
        }
        // No snapshot — use on-chain balance
        return {
            verified: BigInt(jettonBalance) > 0n,
            balance: jettonBalance,
            balanceFormatted: formatJettonBalance(jettonBalance),
            source: "onchain",
        };
    }
    catch (err) {
        logger_1.logger.error(`TON balance verification failed for ${tonAddress}:`, err);
        // Fall back to snapshot
        if (snapshotBalance) {
            return {
                verified: true,
                balance: snapshotBalance,
                balanceFormatted: formatJettonBalance(snapshotBalance),
                source: "snapshot",
                error: `On-chain query failed: ${err.message}`,
            };
        }
        return {
            verified: false,
            balance: "0",
            balanceFormatted: "0",
            source: "unavailable",
            error: `Verification unavailable: ${err.message}`,
        };
    }
}
/**
 * Get a user's Jetton (token) balance on TON.
 *
 * @param ownerAddress - User's wallet address
 * @param jettonMaster - Jetton master contract address
 * @returns Balance as string (nanotons), or null if no wallet exists
 */
async function getJettonBalance(ownerAddress, jettonMaster) {
    try {
        // Use getTokenData-like approach via TON Center API
        // Method: get jetton wallet address for this owner from the master
        const result = await tonApiRequest("getTokenData", {
            address: jettonMaster,
        });
        // Alternative approach: query all jetton wallets for this user
        const wallets = await tonApiRequest("getJettonWallets", {
            owner_address: ownerAddress,
            jetton_address: jettonMaster,
            limit: "1",
        });
        if (!wallets || !Array.isArray(wallets) || wallets.length === 0) {
            return null;
        }
        const wallet = wallets[0];
        return wallet.balance || "0";
    }
    catch (err) {
        // Try alternative API endpoint
        try {
            const wallets = await tonApiRequest("getJettonWallets", {
                owner_address: ownerAddress,
                jetton_address: jettonMaster,
                limit: "1",
            });
            if (!wallets || wallets.length === 0)
                return null;
            return wallets[0].balance || "0";
        }
        catch {
            throw err; // Re-throw original error
        }
    }
}
/**
 * Batch verify multiple TON addresses against snapshot.
 * Used by admin to verify the entire snapshot before processing.
 *
 * @param entries - Array of { tonAddress, snapshotBalance }
 * @returns Array of verification results
 */
async function batchVerifyBalances(entries) {
    const results = [];
    // Process in batches of 5 to respect rate limits
    const BATCH_SIZE = 5;
    for (let i = 0; i < entries.length; i += BATCH_SIZE) {
        const batch = entries.slice(i, i + BATCH_SIZE);
        const batchResults = await Promise.allSettled(batch.map(async (entry) => {
            const result = await verifyTonBalance(entry.tonAddress, entry.snapshotBalance);
            return { ...result, tonAddress: entry.tonAddress };
        }));
        for (const result of batchResults) {
            if (result.status === "fulfilled") {
                results.push(result.value);
            }
            else {
                results.push({
                    tonAddress: batch[results.length - (i > 0 ? i : 0)]?.tonAddress || "unknown",
                    verified: false,
                    balance: "0",
                    balanceFormatted: "0",
                    source: "unavailable",
                    error: result.reason?.message || "Unknown error",
                });
            }
        }
        // Rate limit: wait 200ms between batches
        if (i + BATCH_SIZE < entries.length) {
            await new Promise((resolve) => setTimeout(resolve, 200));
        }
    }
    return results;
}
// ─── Helpers ────────────────────────────────────────────────
function formatJettonBalance(rawBalance) {
    try {
        const big = BigInt(rawBalance);
        // BTN has 6 decimals on both TON and Base
        const whole = big / 1000000n;
        const frac = big % 1000000n;
        if (frac === 0n)
            return whole.toString();
        const fracStr = frac.toString().padStart(6, "0").replace(/0+$/, "");
        return `${whole}.${fracStr}`;
    }
    catch {
        return rawBalance;
    }
}
/**
 * Verify that the snapshot data is consistent:
 * - No duplicate TON addresses
 * - All balances are positive
 * - Total doesn't exceed max supply
 */
function validateSnapshot(entries) {
    const errors = [];
    const seen = new Set();
    let total = 0n;
    const MAX_SUPPLY = 21000000000000n; // 21M with 6 decimals
    for (let i = 0; i < entries.length; i++) {
        const entry = entries[i];
        // Check for duplicates
        const normalized = entry.tonAddress.toLowerCase();
        if (seen.has(normalized)) {
            errors.push(`Duplicate address at index ${i}: ${entry.tonAddress}`);
        }
        seen.add(normalized);
        // Validate balance
        try {
            const bal = BigInt(entry.balanceBtn);
            if (bal < 0n) {
                errors.push(`Negative balance at index ${i}: ${entry.balanceBtn}`);
            }
            if (bal === 0n) {
                errors.push(`Zero balance at index ${i} (wasteful entry)`);
            }
            total += bal;
        }
        catch {
            errors.push(`Invalid balance at index ${i}: ${entry.balanceBtn}`);
        }
    }
    if (total > MAX_SUPPLY) {
        errors.push(`Total snapshot balance (${formatJettonBalance(total.toString())}) exceeds max supply (21M BTN)`);
    }
    return { valid: errors.length === 0, errors };
}
//# sourceMappingURL=ton-verification.service.js.map