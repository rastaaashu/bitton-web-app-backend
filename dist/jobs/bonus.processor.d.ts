/**
 * Bonus Processor
 *
 * Listens for Staked events on StakingVault and triggers
 * BonusEngine.processDirectBonus() for the 5% referral bonus.
 *
 * Persists lastProcessedBlock in the database (blockchain_state table)
 * so it survives restarts and never rescans the entire chain.
 */
export declare class BonusProcessor {
    private running;
    start(): Promise<void>;
    stop(): void;
    private processNewStakes;
}
export declare const bonusProcessor: BonusProcessor;
//# sourceMappingURL=bonus.processor.d.ts.map