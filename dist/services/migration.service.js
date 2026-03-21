"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.migrationService = exports.MigrationService = void 0;
const prisma_1 = require("../utils/prisma");
const chain_service_1 = require("./chain.service");
const logger_1 = require("../utils/logger");
const client_1 = require("@prisma/client");
const BATCH_SIZE = 200;
class MigrationService {
    /**
     * Import a TON snapshot CSV/JSON into the database
     */
    async importSnapshot(rows, snapshotAt, batchId) {
        let imported = 0;
        let skipped = 0;
        for (const row of rows) {
            const existing = await prisma_1.prisma.tonSnapshotRow.findUnique({
                where: { tonAddress: row.tonAddress },
            });
            if (existing) {
                skipped++;
                continue;
            }
            await prisma_1.prisma.tonSnapshotRow.create({
                data: {
                    tonAddress: row.tonAddress,
                    balanceTon: row.balanceTon,
                    balanceBtn: row.balanceBtn,
                    snapshotAt,
                    batchId,
                },
            });
            imported++;
        }
        await prisma_1.prisma.auditLog.create({
            data: {
                actor: "system",
                action: "admin.import_snapshot",
                detail: { imported, skipped, batchId, total: rows.length },
            },
        });
        logger_1.logger.info(`Snapshot import complete: ${imported} imported, ${skipped} skipped`);
        return { imported, skipped };
    }
    /**
     * Build migration claims for users who have linked wallets
     */
    async buildMigrationClaims() {
        // Find wallet links that have verified mappings AND have snapshot data
        const links = await prisma_1.prisma.walletLink.findMany({
            where: { verified: true },
            include: { user: true },
        });
        let created = 0;
        let skipped = 0;
        for (const link of links) {
            // Check if claim already exists
            const existingClaim = await prisma_1.prisma.migrationClaim.findUnique({
                where: { userId: link.userId },
            });
            if (existingClaim) {
                skipped++;
                continue;
            }
            // Find snapshot row
            const snapshot = await prisma_1.prisma.tonSnapshotRow.findUnique({
                where: { tonAddress: link.tonAddress },
            });
            if (!snapshot) {
                skipped++;
                continue;
            }
            // Check if already migrated on-chain
            const migrated = await chain_service_1.chainService.hasMigrated(link.evmAddress);
            if (migrated) {
                skipped++;
                continue;
            }
            await prisma_1.prisma.migrationClaim.create({
                data: {
                    userId: link.userId,
                    tonAddress: link.tonAddress,
                    evmAddress: link.evmAddress,
                    amountBtn: snapshot.balanceBtn,
                    status: client_1.ClaimStatus.PENDING,
                },
            });
            created++;
        }
        await prisma_1.prisma.auditLog.create({
            data: {
                actor: "system",
                action: "admin.build_migration_claims",
                detail: { created, skipped },
            },
        });
        logger_1.logger.info(`Migration claims built: ${created} created, ${skipped} skipped`);
        return { created, skipped };
    }
    /**
     * Process pending migration claims in batches via operator jobs
     */
    async dispatchMigrationBatches() {
        const pendingClaims = await prisma_1.prisma.migrationClaim.findMany({
            where: { status: client_1.ClaimStatus.PENDING },
            orderBy: { createdAt: "asc" },
        });
        let batches = 0;
        for (let i = 0; i < pendingClaims.length; i += BATCH_SIZE) {
            const batch = pendingClaims.slice(i, i + BATCH_SIZE);
            const recipients = batch.map((c) => c.evmAddress);
            const amounts = batch.map((c) => c.amountBtn);
            const idempotencyKey = `migrate_batch_${batch[0].id}_${batch[batch.length - 1].id}`;
            await prisma_1.prisma.operatorJob.create({
                data: {
                    jobType: client_1.JobType.BATCH_MIGRATE,
                    payload: { recipients, amounts },
                    idempotencyKey,
                },
            });
            // Mark claims as QUEUED
            await prisma_1.prisma.migrationClaim.updateMany({
                where: { id: { in: batch.map((c) => c.id) } },
                data: { status: client_1.ClaimStatus.QUEUED },
            });
            batches++;
        }
        logger_1.logger.info(`Dispatched ${batches} migration batches for ${pendingClaims.length} claims`);
        return { batches, total: pendingClaims.length };
    }
}
exports.MigrationService = MigrationService;
exports.migrationService = new MigrationService();
//# sourceMappingURL=migration.service.js.map