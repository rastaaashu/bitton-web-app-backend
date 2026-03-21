import { ethers } from "ethers";
import { logger } from "../utils/logger";
import { env } from "../config/env";
import {
  getProvider,
  getStakingVaultContract,
  getBonusEngineContract,
  getRelayerSigner,
} from "../config/contracts";

const POLL_INTERVAL_MS = 30_000; // Check every 30 seconds
let lastProcessedBlock = 0;

/**
 * Bonus Processor
 *
 * Listens for Staked events on StakingVault and triggers
 * BonusEngine.processDirectBonus() for the 5% referral bonus.
 */
export class BonusProcessor {
  private running = false;

  async start(): Promise<void> {
    this.running = true;

    // Start from current block
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

    const stakingVault = getStakingVaultContract(provider);
    const signer = getRelayerSigner();
    const bonusEngine = getBonusEngineContract(signer);

    // Query Staked events from last processed block to current
    const filter = stakingVault.filters.Staked();
    const events = await stakingVault.queryFilter(
      filter,
      lastProcessedBlock + 1,
      currentBlock
    );

    for (const event of events) {
      try {
        const args = event.args;
        if (!args) continue;

        const staker = args[0]; // user address
        const amount = args[1]; // stake amount
        const btnEquivalent = amount; // for BTN stakes, amount = btnEquivalent

        // Check if staker has a referrer on-chain
        const referrer = await bonusEngine.getReferrer(staker);
        if (referrer === ethers.ZeroAddress) {
          // No on-chain referrer — skip
          continue;
        }

        // Call processDirectBonus
        logger.info(`Processing direct bonus for staker ${staker}, amount ${ethers.formatUnits(amount, 6)} BTN`);
        const tx = await bonusEngine.processDirectBonus(staker, btnEquivalent);
        const receipt = await tx.wait();
        logger.info(`Direct bonus processed: tx ${receipt.hash}`);
      } catch (err: any) {
        // Don't crash — log and continue with next event
        logger.warn(`Failed to process bonus for event: ${err.message}`);
      }
    }

    lastProcessedBlock = currentBlock;

    if (events.length > 0) {
      logger.info(`Processed ${events.length} Staked events (blocks ${lastProcessedBlock - (currentBlock - lastProcessedBlock)}-${currentBlock})`);
    }
  }
}

export const bonusProcessor = new BonusProcessor();
