/**
 * TON Wallet Proof Verification
 *
 * Verifies TonConnect ton_proof to prove a user owns a TON wallet address.
 * Uses the standard TonConnect ton-proof-item-v2 protocol.
 *
 * Flow:
 *   1. Backend generates a random payload (challenge)
 *   2. Frontend sends the payload to the TON wallet via TonConnect
 *   3. Wallet signs and returns a ton_proof
 *   4. Backend verifies the proof using this module
 *
 * Reference: https://docs.ton.org/develop/dapps/ton-connect/sign
 */
export interface TonProofPayload {
    /** TON address in raw format: "workchain:hex_hash" e.g. "0:abc123..." */
    address: string;
    /** Proof data from TonConnect */
    proof: {
        timestamp: number;
        domain: {
            lengthBytes: number;
            value: string;
        };
        payload: string;
        signature: string;
        state_init?: string;
    };
    /** Public key in hex (64 chars = 32 bytes) — extracted from wallet state */
    publicKey: string;
}
export interface VerificationResult {
    valid: boolean;
    error?: string;
    workchain?: number;
    addressHash?: string;
}
/**
 * Verify a TonConnect ton_proof signature.
 *
 * @param proof - The proof data from the frontend
 * @param expectedPayload - The challenge payload we generated
 * @param expectedDomain - Our app domain (e.g., "bitton.ai")
 * @returns VerificationResult with valid=true if proof is authentic
 */
export declare function verifyTonProof(proof: TonProofPayload, expectedPayload: string, expectedDomain: string): VerificationResult;
/**
 * Generate a random challenge payload for TON proof.
 * Should be stored in DB or cache with TTL for verification.
 */
export declare function generateTonChallenge(): string;
/**
 * Convert a user-friendly TON address to raw format "workchain:hash".
 *
 * TON addresses come in two forms:
 *   - Raw: "0:abc123..." (workchain:hash)
 *   - User-friendly: Base64 encoded (EQ..., UQ..., etc.)
 *
 * This function handles raw addresses. For user-friendly addresses,
 * the frontend should convert to raw format before sending.
 */
export declare function normalizeTonAddress(address: string): string;
//# sourceMappingURL=ton-proof.d.ts.map