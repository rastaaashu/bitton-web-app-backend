import { ethers } from "ethers";
import { logger } from "../utils/logger";
import {
  getProvider,
  getStakingVaultContract,
  getBonusEngineContract,
  getRelayerSigner,
} from "../config/contracts";

const POLL_INTERVAL_MS = 30_000; // Check every 30 seconds
const MAX_BLOCK_RANGE = 1000; // Max blocks to scan per poll (RPC limit safe)
let lastProcessedBlock = 0;

/**
 * Bonus Processor
 *
 * Listens for Staked events on StakingVault and triggers
 * BonusEngine.processDirectBonus() for the 5% referral bonus.
 *
 * Scans in chunks of MAX_BLOCK_RANGE to avoid RPC query limits.
 */
export class BonusProcessor {
  private running = false;

  async start(): Promise<void> {
    this.running = true;

    // Start from current block (only process new events going forward)
    const provider = getProvider();
    lastProcessedBlock = await provider.getBlockNumber();
    logger.info(`Bonus processor started at block ${lastProcessedBlock}`);

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

    if (currentBlock <= lastProcessedBlock) return;

    // Limit range to MAX_BLOCK_RANGE to avoid RPC errors
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
          if (!args) continue;

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

    // Always advance, even if query failed, to avoid getting stuck
    lastProcessedBlock = toBlock;
  }
}

export const bonusProcessor = new BonusProcessor();
