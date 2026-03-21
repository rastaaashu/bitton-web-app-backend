"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const adminAuth_1 = require("../middleware/adminAuth");
const migration_service_1 = require("../services/migration.service");
const chain_service_1 = require("../services/chain.service");
const ton_verification_service_1 = require("../services/ton-verification.service");
const prisma_1 = require("../utils/prisma");
const logger_1 = require("../utils/logger");
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
// All admin routes require API key
router.use(adminAuth_1.adminAuth);
/**
 * POST /admin/ton/import-snapshot
 * Import TON snapshot data into the database
 */
router.post("/ton/import-snapshot", async (req, res) => {
    try {
        const { rows, snapshotAt, batchId } = req.body;
        if (!rows || !Array.isArray(rows)) {
            res.status(400).json({ error: "rows must be an array" });
            return;
        }
        if (!snapshotAt || !batchId) {
            res.status(400).json({ error: "snapshotAt and batchId are required" });
            return;
        }
        // Validate snapshot data before import
        const validation = (0, ton_verification_service_1.validateSnapshot)(rows);
        if (!validation.valid) {
            res.status(400).json({
                error: "Snapshot validation failed",
                errors: validation.errors,
            });
            return;
        }
        const result = await migration_service_1.migrationService.importSnapshot(rows, new Date(snapshotAt), batchId);
        res.json({ success: true, ...result });
    }
    catch (err) {
        logger_1.logger.error("Import snapshot error:", err);
        res.status(500).json({ error: err.message });
    }
});
/**
 * POST /admin/migration/build
 * Build migration claims from verified wallet links + snapshot data
 */
router.post("/migration/build", async (_req, res) => {
    try {
        const result = await migration_service_1.migrationService.buildMigrationClaims();
        res.json({ success: true, ...result });
    }
    catch (err) {
        logger_1.logger.error("Build migration error:", err);
        res.status(500).json({ error: err.message });
    }
});
/**
 * POST /admin/jobs/dispatch
 * Dispatch pending migration claims as operator jobs
 */
router.post("/jobs/dispatch", async (_req, res) => {
    try {
        const result = await migration_service_1.migrationService.dispatchMigrationBatches();
        res.json({ success: true, ...result });
    }
    catch (err) {
        logger_1.logger.error("Dispatch jobs error:", err);
        res.status(500).json({ error: err.message });
    }
});
/**
 * POST /admin/jobs/distribute
 * Create a distribute job (send BTN from Custodial to a user)
 */
router.post("/jobs/distribute", async (req, res) => {
    try {
        const { to, amount, idempotencyKey } = req.body;
        if (!to || !amount) {
            res.status(400).json({ error: "to and amount are required" });
            return;
        }
        // Idempotency check
        if (idempotencyKey) {
            const existing = await prisma_1.prisma.operatorJob.findUnique({
                where: { idempotencyKey },
            });
            if (existing) {
                res.json({ success: true, jobId: existing.id, status: existing.status, duplicate: true });
                return;
            }
        }
        const job = await prisma_1.prisma.operatorJob.create({
            data: {
                jobType: client_1.JobType.DISTRIBUTE,
                payload: { to, amount },
                idempotencyKey: idempotencyKey || undefined,
            },
        });
        await prisma_1.prisma.auditLog.create({
            data: {
                actor: "admin",
                action: "admin.create_distribute_job",
                target: to,
                detail: { amount, jobId: job.id },
            },
        });
        res.json({ success: true, jobId: job.id });
    }
    catch (err) {
        logger_1.logger.error("Create distribute job error:", err);
        res.status(500).json({ error: err.message });
    }
});
/**
 * GET /admin/status
 * Overall system status: on-chain state, job queue, migration stats
 */
router.get("/status", async (_req, res) => {
    try {
        const [custodialState, relayerInfo, jobCounts, migrationStats] = await Promise.all([
            chain_service_1.chainService.getCustodialState(),
            chain_service_1.chainService.getRelayerInfo(),
            prisma_1.prisma.operatorJob.groupBy({
                by: ["status"],
                _count: true,
            }),
            prisma_1.prisma.migrationClaim.groupBy({
                by: ["status"],
                _count: true,
            }),
        ]);
        const jobsByStatus = {};
        for (const g of jobCounts) {
            jobsByStatus[g.status] = g._count;
        }
        const migByStatus = {};
        for (const g of migrationStats) {
            migByStatus[g.status] = g._count;
        }
        const totalUsers = await prisma_1.prisma.user.count();
        const totalSnapshots = await prisma_1.prisma.tonSnapshotRow.count();
        res.json({
            custodial: custodialState,
            relayer: relayerInfo,
            jobs: jobsByStatus,
            migration: migByStatus,
            users: totalUsers,
            snapshots: totalSnapshots,
        });
    }
    catch (err) {
        logger_1.logger.error("Status error:", err);
        res.status(500).json({ error: err.message });
    }
});
/**
 * GET /admin/jobs
 * List operator jobs with pagination
 */
router.get("/jobs", async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 20, 100);
        const status = req.query.status;
        const where = status ? { status } : {};
        const [jobs, total] = await Promise.all([
            prisma_1.prisma.operatorJob.findMany({
                where,
                orderBy: { createdAt: "desc" },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma_1.prisma.operatorJob.count({ where }),
        ]);
        res.json({ jobs, total, page, limit });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
/**
 * GET /admin/audit
 * View audit log
 */
router.get("/audit", async (req, res) => {
    try {
        const limit = Math.min(parseInt(req.query.limit) || 50, 200);
        const logs = await prisma_1.prisma.auditLog.findMany({
            orderBy: { createdAt: "desc" },
            take: limit,
        });
        res.json({ logs });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
/**
 * GET /admin/users
 * List users with pagination
 */
router.get("/users", async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 20, 100);
        const search = req.query.search;
        const where = search
            ? {
                OR: [
                    { email: { contains: search, mode: "insensitive" } },
                    { evmAddress: { contains: search.toLowerCase() } },
                    { telegramId: search },
                ],
            }
            : {};
        const [users, total] = await Promise.all([
            prisma_1.prisma.user.findMany({
                where,
                orderBy: { createdAt: "desc" },
                skip: (page - 1) * limit,
                take: limit,
                select: {
                    id: true,
                    email: true,
                    evmAddress: true,
                    telegramId: true,
                    authMethod: true,
                    status: true,
                    sponsorId: true,
                    lastLoginAt: true,
                    createdAt: true,
                    sponsorCodes: { select: { code: true, usedCount: true } },
                    _count: { select: { sponsored: true } },
                },
            }),
            prisma_1.prisma.user.count({ where }),
        ]);
        res.json({ users, total, page, limit });
    }
    catch (err) {
        logger_1.logger.error("List users error:", err);
        res.status(500).json({ error: err.message });
    }
});
/**
 * GET /admin/users/:id
 * Get single user detail
 */
router.get("/users/:id", async (req, res) => {
    try {
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: req.params.id },
            include: {
                sponsorCodes: true,
                sponsored: { select: { id: true, evmAddress: true, email: true, createdAt: true } },
                loginSessions: {
                    orderBy: { createdAt: "desc" },
                    take: 5,
                    select: { createdAt: true, ipAddress: true, userAgent: true, revokedAt: true },
                },
            },
        });
        if (!user) {
            res.status(404).json({ error: "User not found" });
            return;
        }
        res.json(user);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
/**
 * POST /admin/create-sponsor-code
 * Create a custom sponsor code for a user.
 */
router.post("/create-sponsor-code", async (req, res) => {
    try {
        const { userId, code } = req.body;
        if (!userId || !code) {
            res.status(400).json({ error: "userId and code required" });
            return;
        }
        const sc = await prisma_1.prisma.sponsorCode.create({
            data: { userId, code, maxUses: 0 },
        });
        res.status(201).json({ sponsorCode: sc.code, id: sc.id });
    }
    catch (err) {
        if (err?.code === "P2002") {
            res.status(409).json({ error: "Code already exists" });
            return;
        }
        res.status(500).json({ error: err.message });
    }
});
/**
 * POST /admin/seed-bootstrap
 * Create a bootstrap admin user + sponsor code for initial registration.
 * Only works when no users exist in the database.
 */
router.post("/seed-bootstrap", async (req, res) => {
    try {
        const { address, sponsorCode } = req.body;
        if (!address || !sponsorCode) {
            res.status(400).json({ error: "address and sponsorCode required" });
            return;
        }
        const existingUsers = await prisma_1.prisma.user.count();
        if (existingUsers > 0) {
            res.status(409).json({ error: "Bootstrap already done — users exist" });
            return;
        }
        const user = await prisma_1.prisma.user.create({
            data: {
                evmAddress: address.toLowerCase(),
                authMethod: "WALLET",
                status: "CONFIRMED",
            },
        });
        const sc = await prisma_1.prisma.sponsorCode.create({
            data: {
                userId: user.id,
                code: sponsorCode,
                maxUses: 0, // unlimited
            },
        });
        logger_1.logger.info(`Bootstrap user created: ${user.id}, sponsor code: ${sc.code}`);
        res.status(201).json({ userId: user.id, sponsorCode: sc.code });
    }
    catch (err) {
        logger_1.logger.error("Seed bootstrap error:", err);
        res.status(500).json({ error: err.message });
    }
});
exports.default = router;
//# sourceMappingURL=admin.js.map