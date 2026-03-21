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
export interface TonBalanceResult {
    verified: boolean;
    balance: string;
    balanceFormatted: string;
    source: "onchain" | "snapshot" | "unavailable";
    error?: string;
}
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
export declare function verifyTonBalance(tonAddress: string, snapshotBalance?: string): Promise<TonBalanceResult>;
/**
 * Batch verify multiple TON addresses against snapshot.
 * Used by admin to verify the entire snapshot before processing.
 *
 * @param entries - Array of { tonAddress, snapshotBalance }
 * @returns Array of verification results
 */
export declare function batchVerifyBalances(entries: Array<{
    tonAddress: string;
    snapshotBalance: string;
}>): Promise<Array<TonBalanceResult & {
    tonAddress: string;
}>>;
/**
 * Verify that the snapshot data is consistent:
 * - No duplicate TON addresses
 * - All balances are positive
 * - Total doesn't exceed max supply
 */
export declare function validateSnapshot(entries: Array<{
    tonAddress: string;
    balanceBtn: string;
}>): {
    valid: boolean;
    errors: string[];
};
//# sourceMappingURL=ton-verification.service.d.ts.map