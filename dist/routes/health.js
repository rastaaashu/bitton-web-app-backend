"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = require("../utils/prisma");
const contracts_1 = require("../config/contracts");
const env_1 = require("../config/env");
const router = (0, express_1.Router)();
router.get("/health", async (_req, res) => {
    try {
        // DB check
        await prisma_1.prisma.$queryRaw `SELECT 1`;
        // RPC check
        const provider = (0, contracts_1.getProvider)();
        const blockNumber = await provider.getBlockNumber();
        // Relayer check
        const signer = (0, contracts_1.getRelayerSigner)();
        const ethBalance = await provider.getBalance(signer.address);
        res.json({
            status: "ok",
            timestamp: new Date().toISOString(),
            env: env_1.env.nodeEnv,
            chain: {
                chainId: env_1.env.chainId,
                blockNumber,
            },
            relayer: {
                address: signer.address,
                ethBalance: parseFloat((Number(ethBalance) / 1e18).toFixed(6)),
            },
            db: "connected",
        });
    }
    catch (err) {
        res.status(503).json({
            status: "error",
            error: err.message,
        });
    }
});
// Readiness probe — checks only DB (faster than /health)
router.get("/ready", async (_req, res) => {
    try {
        await prisma_1.prisma.$queryRaw `SELECT 1`;
        res.json({ status: "ready" });
    }
    catch (err) {
        res.status(503).json({ status: "not_ready", error: err.message });
    }
});
exports.default = router;
//# sourceMappingURL=health.js.map