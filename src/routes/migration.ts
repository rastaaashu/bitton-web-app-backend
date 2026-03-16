import { Router, Request, Response } from "express";
import rateLimit from "express-rate-limit";
import { prisma } from "../utils/prisma";
import { chainService } from "../services/chain.service";
import { logger } from "../utils/logger";
import {
  verifyTonProof,
  generateTonChallenge,
  normalizeTonAddress,
  type TonProofPayload,
} from "../utils/ton-proof";
import {
  verifyTonBalance,
  validateSnapshot,
} from "../services/ton-verification.service";
import { env } from "../config/env";

const router = Router();

// Rate limit: 10 requests per 5 minutes per IP on sensitive endpoints
const migrationLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 10,
  message: { error: "Too many requests. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

// ─── Challenge store (in-memory with TTL) ─────────────────────
// In production, use Redis. For now, a simple Map with cleanup.
const challengeStore = new Map<string, { payload: string; createdAt: number }>();
const CHALLENGE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// Cleanup expired challenges every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of challengeStore) {
    if (now - val.createdAt > CHALLENGE_TTL_MS) {
      challengeStore.delete(key);
    }
  }
}, 10 * 60 * 1000);

// ─── Domain for proof verification ─────────────────────────────
function getAppDomain(): string {
  try {
    const url = new URL(env.appUrl);
    return url.hostname;
  } catch {
    return "localhost";
  }
}

/**
 * GET /migration/status/:evmAddress
 * Check migration status for a user
 */
router.get("/status/:evmAddress", async (req: Request, res: Response) => {
  try {
    const evmAddress = req.params.evmAddress as string;

    // Check on-chain first
    const onChainMigrated = await chainService.hasMigrated(evmAddress);

    // Check DB
    const claim = await prisma.migrationClaim.findFirst({
      where: { evmAddress: evmAddress.toLowerCase() },
    });

    const user = await prisma.user.findFirst({
      where: { evmAddress: evmAddress.toLowerCase() },
    });

    const walletLink = await prisma.walletLink.findFirst({
      where: { evmAddress: evmAddress.toLowerCase() },
    });

    // Check if there's a snapshot for the linked TON address
    let snapshotBalance: string | null = null;
    if (walletLink?.tonAddress) {
      const snapshot = await prisma.tonSnapshotRow.findFirst({
        where: { tonAddress: walletLink.tonAddress },
      });
      snapshotBalance = snapshot?.balanceBtn ?? null;
    }

    res.json({
      evmAddress,
      onChainMigrated,
      claim: claim
        ? {
            status: claim.status,
            amount: claim.amountBtn,
            txHash: claim.txHash,
            claimedAt: claim.claimedAt,
          }
        : null,
      walletLinked: !!walletLink,
      walletVerified: walletLink?.verified ?? false,
      tonAddress: walletLink?.tonAddress ?? null,
      snapshotBalance,
      userExists: !!user,
    });
  } catch (err: any) {
    logger.error("Migration status error:", err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /migration/verify-balance/:tonAddress
 * Verify if a TON address actually held BTN tokens on the TON network.
 * Cross-references on-chain data with admin snapshot.
 */
router.get("/verify-balance/:tonAddress", migrationLimiter, async (req: Request, res: Response) => {
  try {
    const tonAddress = req.params.tonAddress as string;
    const normalizedTon = normalizeTonAddress(tonAddress);

    // Look up snapshot
    const snapshot = await prisma.tonSnapshotRow.findFirst({
      where: { tonAddress: normalizedTon },
    });

    // Verify on-chain balance
    const result = await verifyTonBalance(
      normalizedTon,
      snapshot?.balanceBtn ?? undefined
    );

    res.json({
      tonAddress: normalizedTon,
      ...result,
      snapshotExists: !!snapshot,
      snapshotBalance: snapshot?.balanceBtn ?? null,
    });
  } catch (err: any) {
    logger.error("Balance verification error:", err);
    res.status(500).json({ error: "Verification service unavailable" });
  }
});

/**
 * POST /migration/challenge
 * Generate a challenge payload for TON proof verification.
 * The frontend should pass this to TonConnect as the proof payload.
 */
router.post("/challenge", migrationLimiter, async (req: Request, res: Response) => {
  try {
    const { evmAddress } = req.body;
    if (!evmAddress) {
      res.status(400).json({ error: "evmAddress is required" });
      return;
    }

    const payload = generateTonChallenge();
    const key = evmAddress.toLowerCase();

    challengeStore.set(key, {
      payload,
      createdAt: Date.now(),
    });

    res.json({
      payload,
      domain: getAppDomain(),
      expiresIn: CHALLENGE_TTL_MS / 1000,
    });
  } catch (err: any) {
    logger.error("Challenge generation error:", err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /migration/link-wallet
 * Link a TON wallet to an EVM wallet with cryptographic proof of ownership.
 *
 * Body:
 *   - evmAddress: string (EVM wallet address)
 *   - tonProof: TonProofPayload (from TonConnect)
 *
 * The proof is verified using the TonConnect ton_proof protocol.
 * A challenge must be generated first via POST /migration/challenge.
 */
router.post("/link-wallet", migrationLimiter, async (req: Request, res: Response) => {
  try {
    const { evmAddress, tonProof } = req.body;

    if (!evmAddress || !tonProof) {
      res.status(400).json({
        error: "evmAddress and tonProof are required",
      });
      return;
    }

    const normalizedEvm = evmAddress.toLowerCase();
    const proof = tonProof as TonProofPayload;

    if (!proof.address || !proof.proof || !proof.publicKey) {
      res.status(400).json({
        error: "tonProof must include address, proof, and publicKey",
      });
      return;
    }

    // Normalize the TON address
    const normalizedTon = normalizeTonAddress(proof.address);

    // Look up the challenge we generated
    const challenge = challengeStore.get(normalizedEvm);
    if (!challenge) {
      res.status(400).json({
        error: "No challenge found. Call POST /migration/challenge first.",
      });
      return;
    }

    // Check challenge expiry
    if (Date.now() - challenge.createdAt > CHALLENGE_TTL_MS) {
      challengeStore.delete(normalizedEvm);
      res.status(400).json({ error: "Challenge expired. Generate a new one." });
      return;
    }

    // Verify the TON proof
    const verification = verifyTonProof(proof, challenge.payload, getAppDomain());

    // Consume the challenge (one-time use)
    challengeStore.delete(normalizedEvm);

    if (!verification.valid) {
      logger.warn(
        `TON proof verification failed for ${normalizedEvm}: ${verification.error}`
      );
      res.status(401).json({
        error: "TON wallet verification failed",
        detail: verification.error,
      });
      return;
    }

    // Check if link already exists
    const existingLink = await prisma.walletLink.findFirst({
      where: {
        tonAddress: normalizedTon,
        evmAddress: normalizedEvm,
      },
    });
    if (existingLink) {
      res.json({ success: true, linkId: existingLink.id, existing: true });
      return;
    }

    // Check if this TON address is already linked to a different EVM address
    const otherLink = await prisma.walletLink.findFirst({
      where: {
        tonAddress: normalizedTon,
        NOT: { evmAddress: normalizedEvm },
      },
    });
    if (otherLink) {
      res.status(409).json({
        error: "This TON address is already linked to a different EVM wallet",
      });
      return;
    }

    // Check if this EVM address already has a TON link
    const evmLink = await prisma.walletLink.findFirst({
      where: { evmAddress: normalizedEvm },
    });
    if (evmLink) {
      res.status(409).json({
        error: "This EVM address is already linked to a TON wallet",
      });
      return;
    }

    // Find or create user
    let user = await prisma.user.findFirst({
      where: { evmAddress: normalizedEvm },
    });
    if (!user) {
      user = await prisma.user.create({
        data: { evmAddress: normalizedEvm },
      });
    }

    // Create verified link
    const link = await prisma.walletLink.create({
      data: {
        userId: user.id,
        tonAddress: normalizedTon,
        evmAddress: normalizedEvm,
        signature: proof.proof.signature,
        verified: true, // Cryptographically verified
      },
    });

    // Update user's TON address
    await prisma.user.update({
      where: { id: user.id },
      data: { tonAddress: normalizedTon },
    });

    // Check if there's a snapshot balance for this TON address
    const snapshot = await prisma.tonSnapshotRow.findFirst({
      where: { tonAddress: normalizedTon },
    });

    await prisma.auditLog.create({
      data: {
        actor: evmAddress,
        action: "migration.link_wallet_verified",
        target: normalizedTon,
        detail: {
          linkId: link.id,
          snapshotFound: !!snapshot,
          snapshotBalance: snapshot?.balanceBtn ?? null,
        },
      },
    });

    logger.info(
      `TON wallet linked: ${normalizedTon} → ${normalizedEvm} (verified, snapshot: ${snapshot ? snapshot.balanceBtn : "none"})`
    );

    res.json({
      success: true,
      linkId: link.id,
      snapshotFound: !!snapshot,
      snapshotBalance: snapshot?.balanceBtn ?? null,
    });
  } catch (err: any) {
    logger.error("Link wallet error:", err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /migration/link-wallet-dev
 * Development-only endpoint: link without verification.
 * DISABLED in production.
 */
router.post("/link-wallet-dev", async (req: Request, res: Response) => {
  if (env.nodeEnv === "production") {
    res.status(403).json({ error: "Not available in production" });
    return;
  }

  try {
    const { tonAddress, evmAddress } = req.body;
    if (!tonAddress || !evmAddress) {
      res.status(400).json({
        error: "tonAddress and evmAddress are required",
      });
      return;
    }

    const normalizedTon = normalizeTonAddress(tonAddress);
    const normalizedEvm = evmAddress.toLowerCase();

    let user = await prisma.user.findFirst({
      where: { evmAddress: normalizedEvm },
    });
    if (!user) {
      user = await prisma.user.create({
        data: { evmAddress: normalizedEvm },
      });
    }

    const existingLink = await prisma.walletLink.findFirst({
      where: {
        tonAddress: normalizedTon,
        evmAddress: normalizedEvm,
      },
    });
    if (existingLink) {
      res.json({ success: true, linkId: existingLink.id, existing: true });
      return;
    }

    const link = await prisma.walletLink.create({
      data: {
        userId: user.id,
        tonAddress: normalizedTon,
        evmAddress: normalizedEvm,
        signature: "dev-bypass",
        verified: true,
      },
    });

    await prisma.user.update({
      where: { id: user.id },
      data: { tonAddress: normalizedTon },
    });

    res.json({ success: true, linkId: link.id, devMode: true });
  } catch (err: any) {
    logger.error("Dev link wallet error:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;

