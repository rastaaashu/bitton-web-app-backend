"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ethers_1 = require("ethers");
const prisma_1 = require("../utils/prisma");
const logger_1 = require("../utils/logger");
const cache_1 = require("../utils/cache");
const contracts_1 = require("../config/contracts");
const router = (0, express_1.Router)();
// Product name mapping
const PROGRAM_NAMES = {
    0: "FLEX_30",
    1: "BOOST_180",
    2: "MAX_360",
};
const LOCK_DAYS = {
    0: 30,
    1: 180,
    2: 360,
};
// Helper: validate Ethereum address
function isValidAddress(address) {
    try {
        ethers_1.ethers.getAddress(address);
        return true;
    }
    catch {
        return false;
    }
}
// ──────────────────────────────────────
// GET /api/dashboard/:address
// Aggregated dashboard data from on-chain contracts
// ──────────────────────────────────────
router.get("/dashboard/:address", async (req, res) => {
    try {
        const address = req.params.address;
        if (!isValidAddress(address)) {
            res.status(400).json({ error: "Invalid Ethereum address" });
            return;
        }
        const normalizedAddr = ethers_1.ethers.getAddress(address);
        const provider = (0, contracts_1.getProvider)();
        const btnToken = (0, contracts_1.getBtnTokenContract)();
        const usdcToken = (0, contracts_1.getUsdcTokenContract)();
        const vaultManager = (0, contracts_1.getVaultManagerContract)();
        const stakingVault = (0, contracts_1.getStakingVaultContract)();
        const vestingPool = (0, contracts_1.getVestingPoolContract)();
        const withdrawalWallet = (0, contracts_1.getWithdrawalWalletContract)();
        const rewardEngine = (0, contracts_1.getRewardEngineContract)(provider);
        const bonusEngine = (0, contracts_1.getBonusEngineContract)();
        // Fetch all data in parallel for performance
        const [btnBalance, usdcBalance, ethBalance, vaultActive, userTier, stakes, vestedBalance, pendingRelease, withdrawableBalance, withdrawableUSDC, rewardPoolBalance,] = await Promise.all([
            btnToken.balanceOf(normalizedAddr).catch(() => BigInt(0)),
            usdcToken.balanceOf(normalizedAddr).catch(() => BigInt(0)),
            provider.getBalance(normalizedAddr).catch(() => BigInt(0)),
            vaultManager.isVaultActive(normalizedAddr).catch(() => false),
            vaultManager.getUserTier(normalizedAddr).catch(() => 0),
            stakingVault.getStakes(normalizedAddr).catch(() => []),
            vestingPool.getVestedBalance(normalizedAddr).catch(() => BigInt(0)),
            vestingPool.getPendingRelease(normalizedAddr).catch(() => BigInt(0)),
            withdrawalWallet.getWithdrawableBalance(normalizedAddr).catch(() => BigInt(0)),
            withdrawalWallet.getWithdrawableInUSDC(normalizedAddr).catch(() => BigInt(0)),
            rewardEngine.rewardPoolBalance().catch(() => BigInt(0)),
        ]);
        // Get referral data from DATABASE (includes migrated users)
        const dbUser = await prisma_1.prisma.user.findFirst({
            where: { evmAddress: normalizedAddr.toLowerCase() },
            include: {
                sponsorCodes: { where: { active: true }, take: 1 },
                sponsor: { select: { evmAddress: true } },
                sponsored: { select: { id: true, evmAddress: true, createdAt: true } },
            },
        });
        const sponsorCode = dbUser?.sponsorCodes?.[0]?.code || null;
        const referrer = dbUser?.sponsor?.evmAddress || null;
        const downline = dbUser?.sponsored?.map((s) => s.evmAddress).filter(Boolean) || [];
        const downlineCount = dbUser?.sponsored?.length || 0;
        // Calculate total staked and pending rewards across all stakes
        let totalStakedBTNEquiv = BigInt(0);
        let totalPendingRewards = BigInt(0);
        const formattedStakes = [];
        // Fetch all pending rewards in parallel (not sequential N+1)
        const pendingRewards = await Promise.all(stakes.map((_, i) => stakingVault.getPendingRewards(normalizedAddr, i).catch(() => BigInt(0))));
        for (let i = 0; i < stakes.length; i++) {
            const stake = stakes[i];
            const amount = stake.amount ?? stake[0];
            const btnEquivalent = stake.btnEquivalent ?? stake[1];
            const startTime = stake.startTime ?? stake[2];
            const programType = stake.programType ?? stake[3];
            const lastRewardTime = stake.lastRewardTime ?? stake[4];
            const isActive = stake.active ?? stake[5];
            const isUSDC = stake.isUSDC ?? stake[6];
            const pt = Number(programType);
            const lockDays = LOCK_DAYS[pt] || 30;
            const endTime = Number(startTime) + lockDays * 86400;
            if (isActive) {
                totalStakedBTNEquiv += BigInt(btnEquivalent);
            }
            const pendingReward = isActive ? pendingRewards[i] : BigInt(0);
            if (isActive) {
                totalPendingRewards += pendingReward;
            }
            formattedStakes.push({
                index: i,
                amount: ethers_1.ethers.formatUnits(amount, 6),
                btnEquivalent: ethers_1.ethers.formatUnits(btnEquivalent, 6),
                programType: PROGRAM_NAMES[pt] || "UNKNOWN",
                programTypeId: pt,
                isUSDC: Boolean(isUSDC),
                tokenSymbol: Boolean(isUSDC) ? "USDC" : "BTN",
                startTime: Number(startTime),
                endTime,
                active: Boolean(isActive),
                lastRewardTime: Number(lastRewardTime),
                pendingReward: ethers_1.ethers.formatUnits(pendingReward, 6),
            });
        }
        const tierNames = ["NONE", "T1", "T2", "T3"];
        res.json({
            address: normalizedAddr,
            balances: {
                btn: ethers_1.ethers.formatUnits(btnBalance, 6),
                usdc: ethers_1.ethers.formatUnits(usdcBalance, 6),
                eth: ethers_1.ethers.formatEther(ethBalance),
                withdrawable: ethers_1.ethers.formatUnits(withdrawableBalance, 6),
                withdrawableUSDC: ethers_1.ethers.formatUnits(withdrawableUSDC, 6),
                vested: ethers_1.ethers.formatUnits(vestedBalance, 6),
                pendingVestingRelease: ethers_1.ethers.formatUnits(pendingRelease, 6),
            },
            vault: {
                active: vaultActive,
                tier: Number(userTier),
                tierName: tierNames[Number(userTier)] || "UNKNOWN",
            },
            staking: {
                totalStakedBTNEquiv: ethers_1.ethers.formatUnits(totalStakedBTNEquiv, 6),
                totalPendingRewards: ethers_1.ethers.formatUnits(totalPendingRewards, 6),
                activeStakes: formattedStakes.filter((s) => s.active).length,
                stakes: formattedStakes,
            },
            referral: {
                referrer,
                downline,
                downlineCount,
                sponsorCode,
            },
            protocol: {
                rewardPoolBalance: ethers_1.ethers.formatUnits(rewardPoolBalance, 6),
            },
        });
    }
    catch (err) {
        logger_1.logger.error("Dashboard fetch error:", err);
        res.status(500).json({ error: "Failed to fetch dashboard data" });
    }
});
// ──────────────────────────────────────
// GET /api/history/:address
// Transaction history from contract events
// ──────────────────────────────────────
router.get("/history/:address", async (req, res) => {
    try {
        const address = req.params.address;
        if (!isValidAddress(address)) {
            res.status(400).json({ error: "Invalid Ethereum address" });
            return;
        }
        const normalizedAddr = ethers_1.ethers.getAddress(address);
        const provider = (0, contracts_1.getProvider)();
        // Parse query params for pagination
        const fromBlock = parseInt(req.query.fromBlock) || 0;
        const toBlock = req.query.toBlock === "latest" || !req.query.toBlock
            ? "latest"
            : parseInt(req.query.toBlock);
        const stakingVault = (0, contracts_1.getStakingVaultContract)();
        const withdrawalWallet = (0, contracts_1.getWithdrawalWalletContract)();
        const vestingPool = (0, contracts_1.getVestingPoolContract)();
        const rewardEngine = (0, contracts_1.getRewardEngineContract)(provider);
        const bonusEngine = (0, contracts_1.getBonusEngineContract)();
        // Query events in parallel
        const [stakeEvents, unstakeEvents, withdrawBTNEvents, withdrawUSDCEvents, vestingAddedEvents, vestingReleasedEvents, settlementEvents, directBonusEvents, matchingBonusEvents,] = await Promise.all([
            stakingVault.queryFilter(stakingVault.filters.Staked(normalizedAddr), fromBlock, toBlock).catch(() => []),
            stakingVault.queryFilter(stakingVault.filters.Unstaked(normalizedAddr), fromBlock, toBlock).catch(() => []),
            withdrawalWallet.queryFilter(withdrawalWallet.filters.WithdrawnAsBTN(normalizedAddr), fromBlock, toBlock).catch(() => []),
            withdrawalWallet.queryFilter(withdrawalWallet.filters.WithdrawnAsUSDC(normalizedAddr), fromBlock, toBlock).catch(() => []),
            vestingPool.queryFilter(vestingPool.filters.VestingAdded(normalizedAddr), fromBlock, toBlock).catch(() => []),
            vestingPool.queryFilter(vestingPool.filters.VestedReleased(normalizedAddr), fromBlock, toBlock).catch(() => []),
            rewardEngine.queryFilter(rewardEngine.filters.RewardSettled(normalizedAddr), fromBlock, toBlock).catch(() => []),
            bonusEngine.queryFilter(bonusEngine.filters.DirectBonusProcessed(normalizedAddr), fromBlock, toBlock).catch(() => []),
            bonusEngine.queryFilter(bonusEngine.filters.MatchingBonusProcessed(normalizedAddr), fromBlock, toBlock).catch(() => []),
        ]);
        // Collect all events
        const allEvents = [
            ...stakeEvents.map((ev) => ({ ev, type: "STAKE" })),
            ...unstakeEvents.map((ev) => ({ ev, type: "UNSTAKE" })),
            ...withdrawBTNEvents.map((ev) => ({ ev, type: "WITHDRAWAL_BTN" })),
            ...withdrawUSDCEvents.map((ev) => ({ ev, type: "WITHDRAWAL_USDC" })),
            ...vestingAddedEvents.map((ev) => ({ ev, type: "VESTING_ADDED" })),
            ...vestingReleasedEvents.map((ev) => ({ ev, type: "VESTING_RELEASED" })),
            ...settlementEvents.map((ev) => ({ ev, type: "REWARD_SETTLED" })),
            ...directBonusEvents.map((ev) => ({ ev, type: "DIRECT_BONUS" })),
            ...matchingBonusEvents.map((ev) => ({ ev, type: "MATCHING_BONUS" })),
        ];
        // Batch-fetch block timestamps
        const BLOCK_CACHE_TTL = 60 * 60 * 1000;
        const uniqueBlockNumbers = new Set();
        for (const { ev } of allEvents) {
            const log = ev;
            uniqueBlockNumbers.add(log.blockNumber);
        }
        const blockTimestampMap = new Map();
        const uncachedBlocks = [];
        for (const bn of uniqueBlockNumbers) {
            const cached = cache_1.blockCache.get(String(bn));
            if (cached !== undefined) {
                blockTimestampMap.set(bn, cached);
            }
            else {
                uncachedBlocks.push(bn);
            }
        }
        if (uncachedBlocks.length > 0) {
            const blocks = await Promise.all(uncachedBlocks.map((bn) => provider.getBlock(bn)));
            for (let i = 0; i < uncachedBlocks.length; i++) {
                const ts = Number(blocks[i]?.timestamp ?? 0);
                blockTimestampMap.set(uncachedBlocks[i], ts);
                cache_1.blockCache.set(String(uncachedBlocks[i]), ts, BLOCK_CACHE_TTL);
            }
        }
        // Format events
        const history = [];
        for (const { ev, type } of allEvents) {
            const log = ev;
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
                            amount: ethers_1.ethers.formatUnits(log.args[1], 6),
                            programType: PROGRAM_NAMES[Number(log.args[2])] || "UNKNOWN",
                            stakeIndex: Number(log.args[3]),
                            isUSDC: Boolean(log.args[4]),
                        },
                    });
                    break;
                case "UNSTAKE":
                    history.push({
                        ...base,
                        data: {
                            principal: ethers_1.ethers.formatUnits(log.args[1], 6),
                            stakeIndex: Number(log.args[2]),
                            isUSDC: Boolean(log.args[3]),
                        },
                    });
                    break;
                case "WITHDRAWAL_BTN":
                    history.push({
                        ...base,
                        data: { amount: ethers_1.ethers.formatUnits(log.args[1], 6), token: "BTN" },
                    });
                    break;
                case "WITHDRAWAL_USDC":
                    history.push({
                        ...base,
                        data: {
                            btnAmount: ethers_1.ethers.formatUnits(log.args[1], 6),
                            usdcAmount: ethers_1.ethers.formatUnits(log.args[2], 6),
                            token: "USDC",
                        },
                    });
                    break;
                case "VESTING_ADDED":
                    history.push({
                        ...base,
                        data: {
                            amount: ethers_1.ethers.formatUnits(log.args[1], 6),
                            vestingType: Number(log.args[2]) === 0 ? "SHORT" : "LONG",
                        },
                    });
                    break;
                case "VESTING_RELEASED":
                    history.push({
                        ...base,
                        data: {
                            amount: ethers_1.ethers.formatUnits(log.args[1], 6),
                            depositsProcessed: Number(log.args[2]),
                        },
                    });
                    break;
                case "REWARD_SETTLED":
                    history.push({
                        ...base,
                        data: {
                            totalReward: ethers_1.ethers.formatUnits(log.args[1], 6),
                            liquidAmount: ethers_1.ethers.formatUnits(log.args[2], 6),
                            shortVestedAmount: ethers_1.ethers.formatUnits(log.args[3], 6),
                            longVestedAmount: ethers_1.ethers.formatUnits(log.args[4], 6),
                        },
                    });
                    break;
                case "DIRECT_BONUS":
                    history.push({
                        ...base,
                        data: {
                            staker: log.args[1],
                            stakeAmount: ethers_1.ethers.formatUnits(log.args[2], 6),
                            bonusAmount: ethers_1.ethers.formatUnits(log.args[3], 6),
                        },
                    });
                    break;
                case "MATCHING_BONUS":
                    history.push({
                        ...base,
                        data: {
                            source: log.args[1],
                            amount: ethers_1.ethers.formatUnits(log.args[2], 6),
                            level: Number(log.args[3]),
                        },
                    });
                    break;
            }
        }
        // Sort by block number descending
        history.sort((a, b) => b.blockNumber - a.blockNumber);
        res.json({
            address: normalizedAddr,
            count: history.length,
            history,
        });
    }
    catch (err) {
        logger_1.logger.error("History fetch error:", err);
        res.status(500).json({ error: "Failed to fetch transaction history" });
    }
});
exports.default = router;
//# sourceMappingURL=dashboard.js.map