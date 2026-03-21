export declare class ChainService {
    /**
     * Get current on-chain state of CustodialDistribution
     */
    getCustodialState(): Promise<{
        balance: string;
        totalDistributed: string;
        totalReturned: string;
        totalMigrated: string;
        migrationEnabled: boolean;
        finalized: boolean;
        distributionCap: string;
    }>;
    /**
     * Distribute BTN from Custodial to a user
     */
    distribute(to: string, amountBtn: string): Promise<{
        txHash: string;
        gasUsed: string;
    }>;
    /**
     * Batch migrate TON users to Base
     */
    batchMigrate(recipients: string[], amounts: string[]): Promise<{
        txHash: string;
        gasUsed: string;
    }>;
    /**
     * Check if a user has already migrated
     */
    hasMigrated(address: string): Promise<boolean>;
    /**
     * Get BTN balance for an address
     */
    getBtnBalance(address: string): Promise<string>;
    /**
     * Get relayer wallet info
     */
    getRelayerInfo(): Promise<{
        address: string;
        ethBalance: string;
    }>;
}
export declare const chainService: ChainService;
//# sourceMappingURL=chain.service.d.ts.map