export declare class MigrationService {
    /**
     * Import a TON snapshot CSV/JSON into the database
     */
    importSnapshot(rows: Array<{
        tonAddress: string;
        balanceTon: string;
        balanceBtn: string;
    }>, snapshotAt: Date, batchId: string): Promise<{
        imported: number;
        skipped: number;
    }>;
    /**
     * Build migration claims for users who have linked wallets
     */
    buildMigrationClaims(): Promise<{
        created: number;
        skipped: number;
    }>;
    /**
     * Process pending migration claims in batches via operator jobs
     */
    dispatchMigrationBatches(): Promise<{
        batches: number;
        total: number;
    }>;
}
export declare const migrationService: MigrationService;
//# sourceMappingURL=migration.service.d.ts.map