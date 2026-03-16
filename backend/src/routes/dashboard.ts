import { Router, Request, Response } from "express";
import { ethers } from "ethers";
import { logger } from "../utils/logger";
import { blockCache } from "../utils/cache";
import {
  getProvider,
  getBtnTokenContract,
  getVaultManagerContract,
  getStakingVaultContract,
  getVestingPoolContract,
  getWithdrawalWalletContract,
  getRewardEngineContract,
  getBonusEngineContract,
} from "../config/contracts";

const router = Router();

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
// GET /api/dashboard/:address
// Aggregated dashboard data from on-chain contracts
// ──────────────────────────────────────
router.get("/dashboard/:address", async (req: Request, res: Response) => {
  try {
    const address = req.params.address as string;
    if (!isValidAddress(address)) {
      res.status(400).json({ error: "Invalid Ethereum address" });
      return;
    }

    const normalizedAddr = ethers.getAddress(address);
    const provider = getProvider();
    const btnToken = getBtnTokenContract();
    const vaultManager = getVaultManagerContract();
    const stakingVault = getStakingVaultContract();
    const vestingPool = getVestingPoolContract();
    const withdrawalWallet = getWithdrawalWalletContract();
    const rewardEngine = getRewardEngineContract(provider);
    const bonusEngine = getBonusEngineContract();

    // Fetch all data in parallel for performance
    const [
      btnBalance,
      ethBalance,
      vaultActive,
      userTier,
      stakes,
      vestedBalance,
      pendingRelease,
      withdrawableBalance,
      rewardPoolBalance,
      referrer,
      downline,
    ] = await Promise.all([
      btnToken.balanceOf(normalizedAddr).catch(() => BigInt(0)),
      provider.getBalance(normalizedAddr).catch(() => BigInt(0)),
      vaultManager.isVaultActive(normalizedAddr).catch(() => false),
      vaultManager.getUserTier(normalizedAddr).catch(() => 0),
      stakingVault.getStakes(normalizedAddr).catch(() => []),
      vestingPool.getVestedBalance(normalizedAddr).catch(() => BigInt(0)),
      vestingPool.getPendingRelease(normalizedAddr).catch(() => BigInt(0)),
      withdrawalWallet.getWithdrawableBalance(normalizedAddr).catch(() => BigInt(0)),
      rewardEngine.rewardPoolBalance().catch(() => BigInt(0)),
      bonusEngine.getReferrer(normalizedAddr).catch(() => ethers.ZeroAddress),
      bonusEngine.getDownline(normalizedAddr).catch(() => []),
    ]);

    // Calculate total staked and pending rewards across all stakes
    let totalStaked = BigInt(0);
    let totalPendingRewards = BigInt(0);
    const formattedStakes = [];

    for (let i = 0; i < stakes.length; i++) {
      const stake = stakes[i];
      const amount = stake.amount ?? stake[0];
      const startTime = stake.startTime ?? stake[1];
      const programType = stake.programType ?? stake[2];
      const lastRewardTime = stake.lastRewardTime ?? stake[3];
      const isActive = stake.active ?? stake[4];

      const lockDays = Number(programType) === 0 ? 30 : Number(programType) === 1 ? 180 : 360;
      const endTime = Number(startTime) + lockDays * 86400;

      if (isActive) {
        totalStaked += BigInt(amount);
      }

      let pendingReward = BigInt(0);
      if (isActive) {
        try {
          pendingReward = await stakingVault.getPendingRewards(normalizedAddr, i);
        } catch {
          // Stake may not have pending rewards
        }
        totalPendingRewards += pendingReward;
      }

      formattedStakes.push({
        index: i,
        amount: ethers.formatUnits(amount, 6),
        programType: Number(programType) === 0 ? "EASY_START" : Number(programType) === 1 ? "SHORT" : "LONG",
        startTime: Number(startTime),
        endTime,
        active: Boolean(isActive),
        lastRewardTime: Number(lastRewardTime),
        pendingReward: ethers.formatUnits(pendingReward, 6),
      });
    }

    const tierNames = ["NONE", "T1", "T2", "T3"];

    res.json({
      address: normalizedAddr,
      balances: {
        btn: ethers.formatUnits(btnBalance, 6),
        eth: ethers.formatEther(ethBalance),
        withdrawable: ethers.formatUnits(withdrawableBalance, 6),
        vested: ethers.formatUnits(vestedBalance, 6),
        pendingVestingRelease: ethers.formatUnits(pendingRelease, 6),
      },
      vault: {
        active: vaultActive,
        tier: Number(userTier),
        tierName: tierNames[Number(userTier)] || "UNKNOWN",
      },
      staking: {
        totalStaked: ethers.formatUnits(totalStaked, 6),
        totalPendingRewards: ethers.formatUnits(totalPendingRewards, 6),
        activeStakes: formattedStakes.filter((s) => s.active).length,
        stakes: formattedStakes,
      },
      referral: {
        referrer: referrer === ethers.ZeroAddress ? null : referrer,
        downlineCount: downline.length,
      },
      protocol: {
        rewardPoolBalance: ethers.formatUnits(rewardPoolBalance, 6),
      },
    });
  } catch (err: any) {
    logger.error("Dashboard fetch error:", err);
    res.status(500).json({ error: "Failed to fetch dashboard data" });
  }
});

// ──────────────────────────────────────
// GET /api/history/:address
// Transaction history from contract events
// ──────────────────────────────────────
router.get("/history/:address", async (req: Request, res: Response) => {
  try {
    const address = req.params.address as string;
    if (!isValidAddress(address)) {
      res.status(400).json({ error: "Invalid Ethereum address" });
      return;
    }

    const normalizedAddr = ethers.getAddress(address);
    const provider = getProvider();

    // Parse query params for pagination
    const fromBlock = parseInt(req.query.fromBlock as string) || 0;
    const toBlock = req.query.toBlock === "latest" || !req.query.toBlock
      ? "latest"
      : parseInt(req.query.toBlock as string);

    const stakingVault = getStakingVaultContract();
    const withdrawalWallet = getWithdrawalWalletContract();
    const vestingPool = getVestingPoolContract();
    const rewardEngine = getRewardEngineContract(provider);
    const bonusEngine = getBonusEngineContract();

    // Query events in parallel
    const [
      stakeEvents,
      unstakeEvents,
      unstakePenaltyEvents,
      withdrawEvents,
      vestingAddedEvents,
      vestingReleasedEvents,
      settlementEvents,
      directBonusEvents,
      matchingBonusEvents,
    ] = await Promise.all([
      stakingVault.queryFilter(
        stakingVault.filters.Staked(normalizedAddr),
        fromBlock,
        toBlock
      ).catch(() => []),
      stakingVault.queryFilter(
        stakingVault.filters.Unstaked(normalizedAddr),
        fromBlock,
        toBlock
      ).catch(() => []),
      stakingVault.queryFilter(
        stakingVault.filters.UnstakedWithPenalty(normalizedAddr),
        fromBlock,
        toBlock
      ).catch(() => []),
      withdrawalWallet.queryFilter(
        withdrawalWallet.filters.Withdrawn(normalizedAddr),
        fromBlock,
        toBlock
      ).catch(() => []),
      vestingPool.queryFilter(
        vestingPool.filters.VestingAdded(normalizedAddr),
        fromBlock,
        toBlock
      ).catch(() => []),
      vestingPool.queryFilter(
        vestingPool.filters.VestingReleased(normalizedAddr),
        fromBlock,
        toBlock
      ).catch(() => []),
      rewardEngine.queryFilter(
        rewardEngine.filters.WeeklySettlement(normalizedAddr),
        fromBlock,
        toBlock
      ).catch(() => []),
      bonusEngine.queryFilter(
        bonusEngine.filters.DirectBonusPaid(normalizedAddr),
        fromBlock,
        toBlock
      ).catch(() => []),
      bonusEngine.queryFilter(
        bonusEngine.filters.MatchingBonusPaid(normalizedAddr),
        fromBlock,
        toBlock
      ).catch(() => []),
    ]);

    // Collect all events into a flat list for batch processing
    const allEvents = [
      ...stakeEvents.map((ev) => ({ ev, type: "STAKE" as const })),
      ...unstakeEvents.map((ev) => ({ ev, type: "UNSTAKE" as const })),
      ...unstakePenaltyEvents.map((ev) => ({ ev, type: "UNSTAKE_PENALTY" as const })),
      ...withdrawEvents.map((ev) => ({ ev, type: "WITHDRAWAL" as const })),
      ...vestingAddedEvents.map((ev) => ({ ev, type: "VESTING_ADDED" as const })),
      ...vestingReleasedEvents.map((ev) => ({ ev, type: "VESTING_RELEASED" as const })),
      ...settlementEvents.map((ev) => ({ ev, type: "WEEKLY_SETTLEMENT" as const })),
      ...directBonusEvents.map((ev) => ({ ev, type: "DIRECT_BONUS" as const })),
      ...matchingBonusEvents.map((ev) => ({ ev, type: "MATCHING_BONUS" as const })),
    ];

    // Batch-fetch all unique block timestamps (with cache)
    const BLOCK_CACHE_TTL = 60 * 60 * 1000; // 1 hour — block timestamps never change
    const uniqueBlockNumbers = new Set<number>();
    for (const { ev } of allEvents) {
      const log = ev as ethers.EventLog;
      uniqueBlockNumbers.add(log.blockNumber);
    }

    // Check cache first, fetch only uncached blocks
    const blockTimestampMap = new Map<number, number>();
    const uncachedBlocks: number[] = [];
    for (const bn of uniqueBlockNumbers) {
      const cached = blockCache.get(String(bn));
      if (cached !== undefined) {
        blockTimestampMap.set(bn, cached);
      } else {
        uncachedBlocks.push(bn);
      }
    }

    // Fetch uncached blocks in parallel
    if (uncachedBlocks.length > 0) {
      const blocks = await Promise.all(
        uncachedBlocks.map((bn) => provider.getBlock(bn))
      );
      for (let i = 0; i < uncachedBlocks.length; i++) {
        const ts = Number(blocks[i]?.timestamp ?? 0);
        blockTimestampMap.set(uncachedBlocks[i], ts);
        blockCache.set(String(uncachedBlocks[i]), ts, BLOCK_CACHE_TTL);
      }
    }

    // Format all events using the pre-fetched timestamp map
    const history: any[] = [];

    for (const { ev, type } of allEvents) {
      const log = ev as ethers.EventLog;
      const timestamp = blockTimestampMap.get(log.blockNumber) ?? 0;
      const base = {
        type,
        txHash: log.transactionHash,
        blockNumber: log.blockNumber,
        timestamp,
      };

      switch (type) {
        case "STAKE":
          history.push({
            ...base,
            data: {
              amount: ethers.formatUnits(log.args[1], 6),
              programType: Number(log.args[2]) === 0 ? "EASY_START" : Number(log.args[2]) === 1 ? "SHORT" : "LONG",
              stakeIndex: Number(log.args[3]),
            },
          });
          break;
        case "UNSTAKE":
          history.push({
            ...base,
            data: {
              principal: ethers.formatUnits(log.args[1], 6),
              stakeIndex: Number(log.args[2]),
            },
          });
          break;
        case "UNSTAKE_PENALTY":
          history.push({
            ...base,
            type: "UNSTAKE",
            data: {
              returned: ethers.formatUnits(log.args[1], 6),
              penalty: ethers.formatUnits(log.args[2], 6),
              stakeIndex: Number(log.args[3]),
            },
          });
          break;
        case "WITHDRAWAL":
          history.push({
            ...base,
            data: { amount: ethers.formatUnits(log.args[1], 6) },
          });
          break;
        case "VESTING_ADDED":
          history.push({
            ...base,
            data: { amount: ethers.formatUnits(log.args[1], 6) },
          });
          break;
        case "VESTING_RELEASED":
          history.push({
            ...base,
            data: { amount: ethers.formatUnits(log.args[1], 6) },
          });
          break;
        case "WEEKLY_SETTLEMENT":
          history.push({
            ...base,
            data: {
              totalReward: ethers.formatUnits(log.args[1], 6),
              withdrawable: ethers.formatUnits(log.args[2], 6),
              vested: ethers.formatUnits(log.args[3], 6),
            },
          });
          break;
        case "DIRECT_BONUS":
          history.push({
            ...base,
            data: {
              staker: log.args[1],
              amount: ethers.formatUnits(log.args[2], 6),
            },
          });
          break;
        case "MATCHING_BONUS":
          history.push({
            ...base,
            data: {
              source: log.args[1],
              amount: ethers.formatUnits(log.args[2], 6),
              level: Number(log.args[3]),
            },
          });
          break;
      }
    }

    // Sort by block number descending (most recent first)
    history.sort((a, b) => b.blockNumber - a.blockNumber);

    res.json({
      address: normalizedAddr,
      count: history.length,
      history,
    });
  } catch (err: any) {
    logger.error("History fetch error:", err);
    res.status(500).json({ error: "Failed to fetch transaction history" });
  }
});

export default router;
