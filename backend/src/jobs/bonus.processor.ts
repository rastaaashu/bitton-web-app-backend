import { ethers } from "ethers";
import { prisma } from "../utils/prisma";
import { logger } from "../utils/logger";
import {
  getProvider,
  getStakingVaultContract,
  getBonusEngineContract,
  getRelayerSigner,
} from "../config/contracts";

const POLL_INTERVAL_MS = 30_000;
const MAX_BLOCK_RANGE = 1000;

/**
 * Bonus Processor
 *
 * Listens for Staked events on StakingVault and triggers
 * BonusEngine.processDirectBonus() for the 5% referral bonus.
 *
 * Persists lastProcessedBlock in the database (blockchain_state table)
 * so it survives restarts and never rescans the entire chain.
 */
export class BonusProcessor {
  private running = false;

  async start(): Promise<void> {
    this.running = true;

    // Get or initialize last processed block from database
    const state = await prisma.blockchainState.upsert({
      where: { id: "bonus_processor" },
      create: { id: "bonus_processor", lastBlock: 0 },
      update: {},
    });

    let lastBlock = state.lastBlock;

    // If no block stored yet, start from current block (don't scan history)
    if (lastBlock === 0) {
      const provider = getProvider();
      const current = await provider.getBlockNumber();
      if (current > 0) {
        lastBlock = current;
        await prisma.blockchainState.update({
          where: { id: "bonus_processor" },
          data: { lastBlock: current },
        });
      }
      logger.info(`Bonus processor initialized at block ${lastBlock}`);
    } else {
      logger.info(`Bonus processor resuming from block ${lastBlock}`);
    }

    while (this.running) {
      try {
        await this.processNewStakes();
      } catch (err: any) {
        logger.error("Bonus processor error:", err.message);
      }
      await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
    }
  }

  stop(): void {
    this.running = false;
    logger.info("Bonus processor stopping");
  }

  private async processNewStakes(): Promise<void> {
    const provider = getProvider();
    const currentBlock = await provider.getBlockNumber();

    // Safety: if RPC returns 0 or invalid, skip this cycle
    if (currentBlock <= 0) {
      logger.warn("RPC returned invalid block number, skipping cycle");
      return;
    }

    // Get last processed block from database
    const state = await prisma.blockchainState.findUnique({
      where: { id: "bonus_processor" },
    });
    const lastProcessedBlock = state?.lastBlock || currentBlock;

    if (currentBlock <= lastProcessedBlock) return;

    // Limit range to MAX_BLOCK_RANGE
    const fromBlock = lastProcessedBlock + 1;
    const toBlock = Math.min(fromBlock + MAX_BLOCK_RANGE - 1, currentBlock);

    const stakingVault = getStakingVaultContract(provider);
    const signer = getRelayerSigner();
    const bonusEngine = getBonusEngineContract(signer);

    try {
      const filter = stakingVault.filters.Staked();
      const events = await stakingVault.queryFilter(filter, fromBlock, toBlock);

      for (const event of events) {
        try {
          if (!("args" in event)) continue;
          const args = (event as ethers.EventLog).args;
          if (!args || args.length < 2) continue;

          const staker = args[0] as string;
          const amount = args[1] as bigint;

          // Check if staker has a referrer on-chain
          const referrer = await bonusEngine.getReferrer(staker);
          if (referrer === ethers.ZeroAddress) continue;

          logger.info(`Processing direct bonus: staker=${staker}, amount=${ethers.formatUnits(amount, 6)} BTN`);
          const tx = await bonusEngine.processDirectBonus(staker, amount);
          const receipt = await tx.wait();
          logger.info(`Direct bonus processed: tx=${receipt.hash}`);
        } catch (err: any) {
          logger.warn(`Failed to process bonus for event: ${err.message}`);
        }
      }

      if (events.length > 0) {
        logger.info(`Processed ${events.length} Staked events (blocks ${fromBlock}-${toBlock})`);
      }
    } catch (err: any) {
      logger.warn(`Event query failed (blocks ${fromBlock}-${toBlock}): ${err.message}`);
    }

    // Persist progress to database
    await prisma.blockchainState.update({
      where: { id: "bonus_processor" },
      data: { lastBlock: toBlock },
    });
  }
}

export const bonusProcessor = new BonusProcessor();
