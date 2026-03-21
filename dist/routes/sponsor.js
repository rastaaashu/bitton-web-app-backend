"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = require("../utils/prisma");
const logger_1 = require("../utils/logger");
const jwtAuth_1 = require("../middleware/jwtAuth");
const adminAuth_1 = require("../middleware/adminAuth");
const validation_1 = require("../utils/validation");
const router = (0, express_1.Router)();
// ──────────────────────────────────────
// POST /sponsor/code/create
// ──────────────────────────────────────
router.post("/code/create", jwtAuth_1.jwtAuth, async (req, res) => {
    try {
        const parsed = validation_1.createSponsorCodeSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ error: parsed.error.errors[0].message });
            return;
        }
        const { code, maxUses } = parsed.data;
        // Check user is confirmed
        const user = await prisma_1.prisma.user.findUnique({ where: { id: req.user.userId } });
        if (!user || user.status !== "CONFIRMED") {
            res.status(403).json({ error: "Only confirmed users can create sponsor codes" });
            return;
        }
        // Check code uniqueness
        const existing = await prisma_1.prisma.sponsorCode.findUnique({ where: { code } });
        if (existing) {
            res.status(409).json({ error: "Sponsor code already exists" });
            return;
        }
        const sponsorCode = await prisma_1.prisma.sponsorCode.create({
            data: {
                userId: user.id,
                code,
                maxUses: maxUses || 0,
            },
        });
        await prisma_1.prisma.auditLog.create({
            data: { actor: user.id, action: "sponsor.code_create", target: code },
        });
        res.status(201).json({
            success: true,
            code: sponsorCode.code,
            maxUses: sponsorCode.maxUses,
        });
    }
    catch (err) {
        logger_1.logger.error("Create sponsor code error:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});
// ──────────────────────────────────────
// GET /sponsor/validate/:codeOrAddress
// Accepts either a sponsor code string or an EVM wallet address
// ──────────────────────────────────────
router.get("/validate/:codeOrAddress", async (req, res) => {
    try {
        const codeOrAddress = req.params.codeOrAddress;
        const isEvmAddress = /^0x[a-fA-F0-9]{40}$/.test(codeOrAddress);
        if (isEvmAddress) {
            // Validate as wallet address referral
            const user = await prisma_1.prisma.user.findFirst({
                where: { evmAddress: codeOrAddress.toLowerCase() },
            });
            if (!user || user.status !== "CONFIRMED") {
                res.status(404).json({ error: "Referrer not found", valid: false });
                return;
            }
            res.json({
                valid: true,
                type: "wallet",
                referrer: codeOrAddress.toLowerCase(),
            });
            return;
        }
        // Validate as sponsor code
        const sponsorCode = await prisma_1.prisma.sponsorCode.findUnique({
            where: { code: codeOrAddress },
        });
        if (!sponsorCode || !sponsorCode.active) {
            res.status(404).json({ error: "Sponsor code not found or inactive", valid: false });
            return;
        }
        const available = sponsorCode.maxUses === 0 || sponsorCode.usedCount < sponsorCode.maxUses;
        res.json({
            valid: available,
            type: "code",
            code: sponsorCode.code,
            active: sponsorCode.active,
            maxUses: sponsorCode.maxUses,
            usedCount: sponsorCode.usedCount,
            available,
        });
    }
    catch (err) {
        logger_1.logger.error("Validate sponsor error:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});
// ──────────────────────────────────────
// GET /sponsor/code/:code (legacy, still works)
// ──────────────────────────────────────
router.get("/code/:code", async (req, res) => {
    try {
        const code = req.params.code;
        const sponsorCode = await prisma_1.prisma.sponsorCode.findUnique({
            where: { code },
        });
        if (!sponsorCode) {
            res.status(404).json({ error: "Sponsor code not found" });
            return;
        }
        res.json({
            code: sponsorCode.code,
            active: sponsorCode.active,
            maxUses: sponsorCode.maxUses,
            usedCount: sponsorCode.usedCount,
            available: sponsorCode.maxUses === 0 || sponsorCode.usedCount < sponsorCode.maxUses,
            sponsorId: sponsorCode.userId,
        });
    }
    catch (err) {
        logger_1.logger.error("Get sponsor code error:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});
// ──────────────────────────────────────
// POST /sponsor/bootstrap (admin API key — creates first user + sponsor code)
// ──────────────────────────────────────
router.post("/bootstrap", adminAuth_1.adminAuth, async (req, res) => {
    try {
        const { code, evmAddress } = req.body;
        if (!code || typeof code !== "string" || code.length < 3) {
            res.status(400).json({ error: "code is required (min 3 chars)" });
            return;
        }
        if (!evmAddress || typeof evmAddress !== "string") {
            res.status(400).json({ error: "evmAddress is required" });
            return;
        }
        const normalizedAddr = evmAddress.toLowerCase();
        // Find or create admin user
        let user = await prisma_1.prisma.user.findFirst({ where: { evmAddress: normalizedAddr } });
        if (!user) {
            user = await prisma_1.prisma.user.create({
                data: {
                    evmAddress: normalizedAddr,
                    status: "CONFIRMED",
                },
            });
            logger_1.logger.info(`Bootstrap: created admin user ${user.id} for ${normalizedAddr}`);
        }
        // Create sponsor code if it doesn't exist
        const existing = await prisma_1.prisma.sponsorCode.findUnique({ where: { code } });
        if (existing) {
            res.json({
                success: true,
                message: "Sponsor code already exists",
                code: existing.code,
                userId: user.id,
                referralLink: `/register?ref=${existing.code}`,
            });
            return;
        }
        const sponsorCode = await prisma_1.prisma.sponsorCode.create({
            data: {
                userId: user.id,
                code,
                maxUses: 0, // unlimited
            },
        });
        await prisma_1.prisma.auditLog.create({
            data: { actor: "admin-bootstrap", action: "sponsor.bootstrap", target: code },
        });
        logger_1.logger.info(`Bootstrap: created sponsor code "${code}" for user ${user.id}`);
        res.status(201).json({
            success: true,
            code: sponsorCode.code,
            userId: user.id,
            referralLink: `/register?ref=${sponsorCode.code}`,
        });
    }
    catch (err) {
        logger_1.logger.error("Bootstrap error:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});
exports.default = router;
//# sourceMappingURL=sponsor.js.map