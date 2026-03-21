import { Router, Request, Response } from "express";
import { ethers } from "ethers";
import { prisma } from "../utils/prisma";
import { logger } from "../utils/logger";
import {
  getProvider,
  getStakingVaultContract,
  getBonusEngineContract,
  getVaultManagerContract,
} from "../config/contracts";

const router = Router();

// Product name mapping
const PROGRAM_NAMES: Record<number, string> = {
  0: "FLEX_30",
  1: "BOOST_180",
  2: "MAX_360",
};

const LOCK_DAYS: Record<number, number> = {
  0: 30,
  1: 180,
  2: 360,
};

// Helper: validate Ethereum address
function isValidAddress(address: string): boolean {
  try {
    ethers.getAddress(address);
    return true;
  } catch {
    return false;
  }
}

// ──────────────────────────────────────
// GET /api/stakes/:address
// Returns user's stakes from StakingVault
// ──────────────────────────────────────
router.get("/stakes/:address", async (req: Request, res: Response) => {
  try {
    const address = req.params.address as string;
    if (!isValidAddress(address)) {
      res.status(400).json({ error: "Invalid Ethereum address" });
      return;
    }

    const normalizedAddr = ethers.getAddress(address);
    const stakingVault = getStakingVaultContract();

    const rawStakes = await stakingVault.getStakes(normalizedAddr);

    const stakes = [];
    for (let i = 0; i < rawStakes.length; i++) {
      const s = rawStakes[i];
      const amount = s.amount ?? s[0];
      const btnEquivalent = s.btnEquivalent ?? s[1];
      const startTime = s.startTime ?? s[2];
      const programType = s.programType ?? s[3];
      const lastRewardTime = s.lastRewardTime ?? s[4];
      const active = s.active ?? s[5];
      const isUSDC = s.isUSDC ?? s[6];

      const pt = Number(programType);
      const lockDays = LOCK_DAYS[pt] || 30;
      const endTime = Number(startTime) + lockDays * 86400;

      let pendingReward = BigInt(0);
      if (active) {
        try {
          pendingReward = await stakingVault.getPendingRewards(normalizedAddr, i);
        } catch {
          // May fail if no rewards pending
        }
      }

      stakes.push({
        index: i,
        amount: ethers.formatUnits(amount, 6),
        amountRaw: amount.toString(),
        btnEquivalent: ethers.formatUnits(btnEquivalent, 6),
        btnEquivalentRaw: btnEquivalent.toString(),
        programType: PROGRAM_NAMES[pt] || "UNKNOWN",
        programTypeId: pt,
        isUSDC: Boolean(isUSDC),
        tokenSymbol: Boolean(isUSDC) ? "USDC" : "BTN",
        startTime: Number(startTime),
        endTime,
        active: Boolean(active),
        lastRewardTime: Number(lastRewardTime),
        pendingReward: ethers.formatUnits(pendingReward, 6),
        pendingRewardRaw: pendingReward.toString(),
        lockDays,
        startDate: new Date(Number(startTime) * 1000).toISOString(),
        endDate: new Date(endTime * 1000).toISOString(),
      });
    }

    const activeStakes = stakes.filter((s) => s.active);
    const totalStaked = activeStakes.reduce(
      (sum, s) => sum + parseFloat(s.amount),
      0
    );

    res.json({
      address: normalizedAddr,
      totalStakes: stakes.length,
      activeStakes: activeStakes.length,
      totalStaked: totalStaked.toFixed(6),
      stakes,
    });
  } catch (err: any) {
    logger.error("Stakes fetch error:", err);
    res.status(500).json({ error: "Failed to fetch stakes" });
  }
});

// ──────────────────────────────────────
// GET /api/bonuses/:address
// Returns user's bonus history from BonusEngine events
// ──────────────────────────────────────
router.get("/bonuses/:address", async (req: Request, res: Response) => {
  try {
    const address = req.params.address as string;
    if (!isValidAddress(address)) {
      res.status(400).json({ error: "Invalid Ethereum address" });
      return;
    }

    const normalizedAddr = ethers.getAddress(address);
    const provider = getProvider();
    const bonusEngine = getBonusEngineContract();

    const fromBlock = parseInt(req.query.fromBlock as string) || 0;
    const toBlock = req.query.toBlock === "latest" || !req.query.toBlock
      ? "latest"
      : parseInt(req.query.toBlock as string);

    // Query direct and matching bonus events in parallel
    const [directEvents, matchingEvents] = await Promise.all([
      bonusEngine.queryFilter(
        bonusEngine.filters.DirectBonusProcessed(normalizedAddr),
        fromBlock,
        toBlock
      ).catch(() => []),
      bonusEngine.queryFilter(
        bonusEngine.filters.MatchingBonusProcessed(normalizedAddr),
        fromBlock,
        toBlock
      ).catch(() => []),
    ]);

    const bonuses: any[] = [];
    let totalDirectBonus = 0;
    let totalMatchingBonus = 0;

    for (const ev of directEvents) {
      const log = ev as ethers.EventLog;
      const block = await provider.getBlock(log.blockNumber);
      const amount = ethers.formatUnits(log.args[3], 6); // bonusAmount is 4th arg
      totalDirectBonus += parseFloat(amount);
      bonuses.push({
        type: "DIRECT_BONUS",
        txHash: log.transactionHash,
        blockNumber: log.blockNumber,
        timestamp: block?.timestamp || 0,
        staker: log.args[1],
        amount,
      });
    }

    for (const ev of matchingEvents) {
      const log = ev as ethers.EventLog;
      const block = await provider.getBlock(log.blockNumber);
      const amount = ethers.formatUnits(log.args[2], 6); // bonusAmount is 3rd arg
      totalMatchingBonus += parseFloat(amount);
      bonuses.push({
        type: "MATCHING_BONUS",
        txHash: log.transactionHash,
        blockNumber: log.blockNumber,
        timestamp: block?.timestamp || 0,
        source: log.args[1],
        amount,
        level: Number(log.args[3]),
      });
    }

    // Sort by block number descending
    bonuses.sort((a, b) => b.blockNumber - a.blockNumber);

    res.json({
      address: normalizedAddr,
      totalDirectBonus: totalDirectBonus.toFixed(6),
      totalMatchingBonus: totalMatchingBonus.toFixed(6),
      totalBonus: (totalDirectBonus + totalMatchingBonus).toFixed(6),
      count: bonuses.length,
      bonuses,
    });
  } catch (err: any) {
    logger.error("Bonuses fetch error:", err);
    res.status(500).json({ error: "Failed to fetch bonus history" });
  }
});

// ──────────────────────────────────────
// GET /api/referrals/:address
// Returns referral info: referrer, downline, vault tier
// ──────────────────────────────────────
router.get("/referrals/:address", async (req: Request, res: Response) => {
  try {
    const address = req.params.address as string;
    if (!isValidAddress(address)) {
      res.status(400).json({ error: "Invalid Ethereum address" });
      return;
    }

    const normalizedAddr = ethers.getAddress(address);
    const vaultManager = getVaultManagerContract();
    const stakingVault = getStakingVaultContract();

    // Get referral data from database (includes migrated users)
    const dbUser = await prisma.user.findFirst({
      where: { evmAddress: normalizedAddr.toLowerCase() },
      include: {
        sponsor: { select: { evmAddress: true } },
        sponsored: { select: { evmAddress: true } },
      },
    });
    const referrer = dbUser?.sponsor?.evmAddress || null;
    const downline = dbUser?.sponsored?.map((s: any) => s.evmAddress).filter(Boolean) || [];

    const [vaultActive, userTier] = await Promise.all([
      vaultManager.isVaultActive(normalizedAddr).catch(() => false),
      vaultManager.getUserTier(normalizedAddr).catch(() => 0),
    ]);

    const tierNames = ["NONE", "T1", "T2", "T3"];
    const tierMatchingLevels: Record<number, number> = { 0: 0, 1: 3, 2: 5, 3: 10 };
    const tier = Number(userTier);

    // For each downline member, get basic info
    const downlineInfo = [];
    for (const member of downline) {
      try {
        const [memberActive, memberTier] = await Promise.all([
          vaultManager.isVaultActive(member).catch(() => false),
          vaultManager.getUserTier(member).catch(() => 0),
        ]);

        let memberTotalStaked = BigInt(0);
        try {
          memberTotalStaked = await stakingVault.getUserTotalStaked(member);
        } catch {}

        downlineInfo.push({
          address: member,
          vaultActive: memberActive,
          tier: Number(memberTier),
          tierName: tierNames[Number(memberTier)] || "UNKNOWN",
          totalStaked: ethers.formatUnits(memberTotalStaked, 6),
        });
      } catch {
        downlineInfo.push({
          address: member,
          vaultActive: false,
          tier: 0,
          tierName: "UNKNOWN",
          totalStaked: "0.000000",
        });
      }
    }

    res.json({
      address: normalizedAddr,
      referrer,
      vault: {
        active: vaultActive,
        tier,
        tierName: tierNames[tier] || "UNKNOWN",
        matchingLevels: tierMatchingLevels[tier] || 0,
      },
      downline: {
        count: downline.length,
        members: downlineInfo,
      },
    });
  } catch (err: any) {
    logger.error("Referrals fetch error:", err);
    res.status(500).json({ error: "Failed to fetch referral info" });
  }
});

export default router;
