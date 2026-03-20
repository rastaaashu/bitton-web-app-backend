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

import { createHash, createPublicKey, verify } from "crypto";
import { logger } from "./logger";

// ─── Types ───────────────────────────────────────────────────

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
    payload: string; // The challenge we generated
    signature: string; // Base64 encoded Ed25519 signature
    state_init?: string; // Base64 encoded StateInit (contains public key)
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

// ─── Constants ───────────────────────────────────────────────

const TON_PROOF_PREFIX = "ton-proof-item-v2/";
const TON_CONNECT_PREFIX = "ton-connect";
const PROOF_MAX_AGE_SECONDS = 300; // 5 minutes

// ─── Core Verification ──────────────────────────────────────

/**
 * Verify a TonConnect ton_proof signature.
 *
 * @param proof - The proof data from the frontend
 * @param expectedPayload - The challenge payload we generated
 * @param expectedDomain - Our app domain (e.g., "bitton.ai")
 * @returns VerificationResult with valid=true if proof is authentic
 */
export function verifyTonProof(
  proof: TonProofPayload,
  expectedPayload: string,
  expectedDomain: string
): VerificationResult {
  try {
    // 1. Parse TON address
    const addressParts = proof.address.split(":");
    if (addressParts.length !== 2) {
      return { valid: false, error: "Invalid TON address format. Expected 'workchain:hash'" };
    }

    const workchain = parseInt(addressParts[0], 10);
    const addressHash = addressParts[1];

    if (isNaN(workchain)) {
      return { valid: false, error: "Invalid workchain number" };
    }

    if (!/^[0-9a-fA-F]{64}$/.test(addressHash)) {
      return { valid: false, error: "Invalid address hash (must be 64 hex characters)" };
    }

    // 2. Verify timestamp is recent
    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - proof.proof.timestamp) > PROOF_MAX_AGE_SECONDS) {
      return { valid: false, error: `Proof expired (timestamp ${proof.proof.timestamp}, now ${now})` };
    }

    // 3. Verify domain matches
    if (proof.proof.domain.value !== expectedDomain) {
      return {
        valid: false,
        error: `Domain mismatch: expected '${expectedDomain}', got '${proof.proof.domain.value}'`,
      };
    }

    // 4. Verify payload matches the challenge we generated
    if (proof.proof.payload !== expectedPayload) {
      return { valid: false, error: "Payload mismatch — possible replay attack" };
    }

    // 5. Validate public key format
    if (!/^[0-9a-fA-F]{64}$/.test(proof.publicKey)) {
      return { valid: false, error: "Invalid public key format (must be 64 hex characters)" };
    }

    // 6. Reconstruct the signed message per TonConnect spec
    //    message = "ton-proof-item-v2/" ++ workchain(i32 LE) ++ address_hash(32 bytes)
    //              ++ domain_len(u32 LE) ++ domain(utf8) ++ timestamp(u64 LE) ++ payload(utf8)
    const wcBuf = Buffer.alloc(4);
    wcBuf.writeInt32LE(workchain);

    const addressHashBuf = Buffer.from(addressHash, "hex");

    const domainBuf = Buffer.from(proof.proof.domain.value, "utf8");
    const domainLenBuf = Buffer.alloc(4);
    domainLenBuf.writeUInt32LE(domainBuf.length);

    const tsBuf = Buffer.alloc(8);
    // Write uint64 LE (using BigInt for precision)
    tsBuf.writeBigUInt64LE(BigInt(proof.proof.timestamp));

    const payloadBuf = Buffer.from(proof.proof.payload, "utf8");

    const message = Buffer.concat([
      Buffer.from(TON_PROOF_PREFIX, "utf8"),
      wcBuf,
      addressHashBuf,
      domainLenBuf,
      domainBuf,
      tsBuf,
      payloadBuf,
    ]);

    // 7. Hash the message
    const msgHash = sha256(message);

    // 8. Construct the final signed data:
    //    0xffff ++ "ton-connect" ++ sha256(message)
    const fullMsg = Buffer.concat([
      Buffer.from([0xff, 0xff]),
      Buffer.from(TON_CONNECT_PREFIX, "utf8"),
      msgHash,
    ]);

    const signedHash = sha256(fullMsg);

    // 9. Verify Ed25519 signature
    const signatureBytes = Buffer.from(proof.proof.signature, "base64");
    const publicKeyBytes = Buffer.from(proof.publicKey, "hex");

    if (signatureBytes.length !== 64) {
      return { valid: false, error: `Invalid signature length: ${signatureBytes.length} (expected 64)` };
    }

    if (publicKeyBytes.length !== 32) {
      return { valid: false, error: `Invalid public key length: ${publicKeyBytes.length} (expected 32)` };
    }

    const isValid = verifyEd25519(signedHash, signatureBytes, publicKeyBytes);

    if (!isValid) {
      return { valid: false, error: "Ed25519 signature verification failed" };
    }

    return { valid: true, workchain, addressHash };
  } catch (err: any) {
    logger.error("TON proof verification error:", err);
    return { valid: false, error: `Verification error: ${err.message}` };
  }
}

// ─── Helpers ─────────────────────────────────────────────────

function sha256(data: Buffer): Buffer {
  return createHash("sha256").update(data).digest();
}

/**
 * Verify Ed25519 signature using Node.js crypto module.
 * Node 15+ supports Ed25519 natively.
 */
function verifyEd25519(
  message: Buffer,
  signature: Buffer,
  publicKeyRaw: Buffer
): boolean {
  try {
    // Import the raw 32-byte public key in Ed25519 format
    const publicKey = createPublicKey({
      key: Buffer.concat([
        // Ed25519 public key DER prefix (from RFC 8032 / PKCS#8)
        Buffer.from("302a300506032b6570032100", "hex"),
        publicKeyRaw,
      ]),
      format: "der",
      type: "spki",
    });

    return verify(null, message, publicKey, signature);
  } catch (err: any) {
    logger.error("Ed25519 verification error:", err);
    return false;
  }
}

// ─── Challenge Generation ────────────────────────────────────

/**
 * Generate a random challenge payload for TON proof.
 * Should be stored in DB or cache with TTL for verification.
 */
export function generateTonChallenge(): string {
  const bytes = Buffer.alloc(32);
  require("crypto").randomFillSync(bytes);
  return bytes.toString("hex");
}

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
export function normalizeTonAddress(address: string): string {
  // Already in raw format
  if (/^-?\d+:[0-9a-fA-F]{64}$/.test(address)) {
    const parts = address.split(":");
    return `${parts[0]}:${parts[1].toLowerCase()}`;
  }

  // If it's a user-friendly address, we can't decode it without TON libraries.
  // The frontend should send raw format.
  return address.toLowerCase();
}
