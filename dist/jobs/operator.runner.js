"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.operatorRunner = exports.OperatorRunner = void 0;
const prisma_1 = require("../utils/prisma");
const chain_service_1 = require("../services/chain.service");
const logger_1 = require("../utils/logger");
const client_1 = require("@prisma/client");
const POLL_INTERVAL_MS = 10_000; // 10 seconds
/**
 * Operator Job Runner
 *
 * Polls for pending operator jobs and executes them on-chain.
 * Handles retries, idempotency, and status tracking.
 */
class OperatorRunner {
    running = false;
    async start() {
        this.running = true;
        logger_1.logger.info("Operator runner started");
        while (this.running) {
            try {
                await this.processNextJob();
            }
            catch (err) {
                logger_1.logger.error("Operator runner error:", err);
            }
            await this.sleep(POLL_INTERVAL_MS);
        }
    }
    stop() {
        this.running = false;
        logger_1.logger.info("Operator runner stopping");
    }
    async processNextJob() {
        // Pick the oldest pending or retryable failed job
        const job = await prisma_1.prisma.operatorJob.findFirst({
            where: {
                OR: [
                    { status: client_1.JobStatus.PENDING },
                    {
                        status: client_1.JobStatus.FAILED,
                        retryCount: { lt: 3 }, // maxRetries default
                    },
                ],
            },
            orderBy: { createdAt: "asc" },
        });
        if (!job)
            return;
        // Check retry eligibility
        if (job.status === client_1.JobStatus.FAILED && job.retryCount >= job.maxRetries) {
            await prisma_1.prisma.operatorJob.update({
                where: { id: job.id },
                data: { status: client_1.JobStatus.CANCELLED },
            });
            return;
        }
        logger_1.logger.info(`Processing job ${job.id} (${job.jobType})`);
        await prisma_1.prisma.operatorJob.update({
            where: { id: job.id },
            data: { status: client_1.JobStatus.PROCESSING },
        });
        try {
            let result;
            switch (job.jobType) {
                case client_1.JobType.DISTRIBUTE: {
                    const { to, amount } = job.payload;
                    result = await chain_service_1.chainService.distribute(to, amount);
                    break;
                }
                case client_1.JobType.BATCH_MIGRATE: {
                    const { recipients, amounts } = job.payload;
                    result = await chain_service_1.chainService.batchMigrate(recipients, amounts);
                    // Update migration claims
                    await prisma_1.prisma.migrationClaim.updateMany({
                        where: {
                            evmAddress: { in: recipients },
                            status: client_1.ClaimStatus.QUEUED,
                        },
                        data: {
                            status: client_1.ClaimStatus.CONFIRMED,
                            txHash: result.txHash,
                            claimedAt: new Date(),
                        },
                    });
                    break;
                }
                case client_1.JobType.FUND_CONTRACT: {
                    const { target, amount: fundAmt } = job.payload;
                    // Use distribute for funding (same contract function)
                    const custodial = (await Promise.resolve().then(() => __importStar(require("../config/contracts")))).getCustodialContract();
                    const { ethers } = await Promise.resolve().then(() => __importStar(require("ethers")));
                    const tx = await custodial.fundContract(target, ethers.parseUnits(fundAmt, 6));
                    const receipt = await tx.wait();
                    result = { txHash: receipt.hash, gasUsed: receipt.gasUsed.toString() };
                    break;
                }
                default:
                    throw new Error(`Unknown job type: ${job.jobType}`);
            }
            await prisma_1.prisma.operatorJob.update({
                where: { id: job.id },
                data: {
                    status: client_1.JobStatus.CONFIRMED,
                    txHash: result.txHash,
                    gasUsed: result.gasUsed,
                    completedAt: new Date(),
                },
            });
            await prisma_1.prisma.auditLog.create({
                data: {
                    actor: "operator_runner",
                    action: `job.${job.jobType.toLowerCase()}.confirmed`,
                    target: job.id,
                    detail: { txHash: result.txHash, gasUsed: result.gasUsed },
                    txHash: result.txHash,
                },
            });
            logger_1.logger.info(`Job ${job.id} confirmed: ${result.txHash}`);
        }
        catch (err) {
            logger_1.logger.error(`Job ${job.id} failed:`, err);
            await prisma_1.prisma.operatorJob.update({
                where: { id: job.id },
                data: {
                    status: client_1.JobStatus.FAILED,
                    errorMessage: err.message || String(err),
                    retryCount: { increment: 1 },
                },
            });
            // If batch migrate failed, mark claims as failed too
            if (job.jobType === client_1.JobType.BATCH_MIGRATE) {
                const { recipients } = job.payload;
                await prisma_1.prisma.migrationClaim.updateMany({
                    where: {
                        evmAddress: { in: recipients },
                        status: client_1.ClaimStatus.QUEUED,
                    },
                    data: {
                        status: client_1.ClaimStatus.FAILED,
                        errorMessage: err.message || String(err),
                    },
                });
            }
        }
    }
    sleep(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}
exports.OperatorRunner = OperatorRunner;
exports.operatorRunner = new OperatorRunner();
//# sourceMappingURL=operator.runner.js.map