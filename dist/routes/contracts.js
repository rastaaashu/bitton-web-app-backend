"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ethers_1 = require("ethers");
const prisma_1 = require("../utils/prisma");
const logger_1 = require("../utils/logger");
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
// GET /api/stakes/:address
// Returns user's stakes from StakingVault
// ──────────────────────────────────────
router.get("/stakes/:address", async (req, res) => {
    try {
        const address = req.params.address;
        if (!isValidAddress(address)) {
            res.status(400).json({ error: "Invalid Ethereum address" });
            return;
        }
        const normalizedAddr = ethers_1.ethers.getAddress(address);
        const stakingVault = (0, contracts_1.getStakingVaultContract)();
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
                }
                catch {
                    // May fail if no rewards pending
                }
            }
            stakes.push({
                index: i,
                amount: ethers_1.ethers.formatUnits(amount, 6),
                amountRaw: amount.toString(),
                btnEquivalent: ethers_1.ethers.formatUnits(btnEquivalent, 6),
                btnEquivalentRaw: btnEquivalent.toString(),
                programType: PROGRAM_NAMES[pt] || "UNKNOWN",
                programTypeId: pt,
                isUSDC: Boolean(isUSDC),
                tokenSymbol: Boolean(isUSDC) ? "USDC" : "BTN",
                startTime: Number(startTime),
                endTime,
                active: Boolean(active),
                lastRewardTime: Number(lastRewardTime),
                pendingReward: ethers_1.ethers.formatUnits(pendingReward, 6),
                pendingRewardRaw: pendingReward.toString(),
                lockDays,
                startDate: new Date(Number(startTime) * 1000).toISOString(),
                endDate: new Date(endTime * 1000).toISOString(),
            });
        }
        const activeStakes = stakes.filter((s) => s.active);
        const totalStaked = activeStakes.reduce((sum, s) => sum + parseFloat(s.amount), 0);
        res.json({
            address: normalizedAddr,
            totalStakes: stakes.length,
            activeStakes: activeStakes.length,
            totalStaked: totalStaked.toFixed(6),
            stakes,
        });
    }
    catch (err) {
        logger_1.logger.error("Stakes fetch error:", err);
        res.status(500).json({ error: "Failed to fetch stakes" });
    }
});
// ──────────────────────────────────────
// GET /api/bonuses/:address
// Returns user's bonus history from BonusEngine events
// ──────────────────────────────────────
router.get("/bonuses/:address", async (req, res) => {
    try {
        const address = req.params.address;
        if (!isValidAddress(address)) {
            res.status(400).json({ error: "Invalid Ethereum address" });
            return;
        }
        const normalizedAddr = ethers_1.ethers.getAddress(address);
        const provider = (0, contracts_1.getProvider)();
        const bonusEngine = (0, contracts_1.getBonusEngineContract)();
        const fromBlock = parseInt(req.query.fromBlock) || 0;
        const toBlock = req.query.toBlock === "latest" || !req.query.toBlock
            ? "latest"
            : parseInt(req.query.toBlock);
        // Query direct and matching bonus events in parallel
        const [directEvents, matchingEvents] = await Promise.all([
            bonusEngine.queryFilter(bonusEngine.filters.DirectBonusProcessed(normalizedAddr), fromBlock, toBlock).catch(() => []),
            bonusEngine.queryFilter(bonusEngine.filters.MatchingBonusProcessed(normalizedAddr), fromBlock, toBlock).catch(() => []),
        ]);
        const bonuses = [];
        let totalDirectBonus = 0;
        let totalMatchingBonus = 0;
        for (const ev of directEvents) {
            const log = ev;
            const block = await provider.getBlock(log.blockNumber);
            const amount = ethers_1.ethers.formatUnits(log.args[3], 6); // bonusAmount is 4th arg
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
            const log = ev;
            const block = await provider.getBlock(log.blockNumber);
            const amount = ethers_1.ethers.formatUnits(log.args[2], 6); // bonusAmount is 3rd arg
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
    }
    catch (err) {
        logger_1.logger.error("Bonuses fetch error:", err);
        res.status(500).json({ error: "Failed to fetch bonus history" });
    }
});
// ──────────────────────────────────────
// GET /api/referrals/:address
// Returns referral info: referrer, downline, vault tier
// ──────────────────────────────────────
router.get("/referrals/:address", async (req, res) => {
    try {
        const address = req.params.address;
        if (!isValidAddress(address)) {
            res.status(400).json({ error: "Invalid Ethereum address" });
            return;
        }
        const normalizedAddr = ethers_1.ethers.getAddress(address);
        const vaultManager = (0, contracts_1.getVaultManagerContract)();
        const stakingVault = (0, contracts_1.getStakingVaultContract)();
        // Get referral data from database (includes migrated users)
        const dbUser = await prisma_1.prisma.user.findFirst({
            where: { evmAddress: normalizedAddr.toLowerCase() },
            include: {
                sponsor: { select: { evmAddress: true } },
                sponsored: { select: { evmAddress: true } },
            },
        });
        const referrer = dbUser?.sponsor?.evmAddress || null;
        const downline = dbUser?.sponsored?.map((s) => s.evmAddress).filter(Boolean) || [];
        const [vaultActive, userTier] = await Promise.all([
            vaultManager.isVaultActive(normalizedAddr).catch(() => false),
            vaultManager.getUserTier(normalizedAddr).catch(() => 0),
        ]);
        const tierNames = ["NONE", "T1", "T2", "T3"];
        const tierMatchingLevels = { 0: 0, 1: 3, 2: 5, 3: 10 };
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
                }
                catch { }
                downlineInfo.push({
                    address: member,
                    vaultActive: memberActive,
                    tier: Number(memberTier),
                    tierName: tierNames[Number(memberTier)] || "UNKNOWN",
                    totalStaked: ethers_1.ethers.formatUnits(memberTotalStaked, 6),
                });
            }
            catch {
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
    }
    catch (err) {
        logger_1.logger.error("Referrals fetch error:", err);
        res.status(500).json({ error: "Failed to fetch referral info" });
    }
});
exports.default = router;
//# sourceMappingURL=contracts.js.map