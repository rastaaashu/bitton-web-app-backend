"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const crypto_1 = require("crypto");
const env_1 = require("./config/env");
const logger_1 = require("./utils/logger");
const prisma_1 = require("./utils/prisma");
const operator_runner_1 = require("./jobs/operator.runner");
const bonus_processor_1 = require("./jobs/bonus.processor");
// Routes
const health_1 = __importDefault(require("./routes/health"));
const auth_1 = __importDefault(require("./routes/auth"));
const admin_1 = __importDefault(require("./routes/admin"));
const migration_1 = __importDefault(require("./routes/migration"));
const sponsor_1 = __importDefault(require("./routes/sponsor"));
const dashboard_1 = __importDefault(require("./routes/dashboard"));
const contracts_1 = __importDefault(require("./routes/contracts"));
const app = (0, express_1.default)();
exports.app = app;
app.set("trust proxy", 1);
// Middleware
app.use((0, helmet_1.default)({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'"],
            fontSrc: ["'self'"],
            objectSrc: ["'none'"],
            frameSrc: ["'none'"],
            baseUri: ["'self'"],
            formAction: ["'self'"],
        },
    },
    hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
}));
// CORS: production only allows APP_URL; development also allows localhost
const corsOrigins = [env_1.env.appUrl].filter(Boolean);
if (env_1.env.nodeEnv !== "production") {
    corsOrigins.push("http://localhost:3000", "http://localhost:3001", "http://localhost:3002", "http://localhost:3003");
}
app.use((0, cors_1.default)({ origin: corsOrigins, credentials: true }));
// Limit JSON body size to prevent DoS via large payloads
app.use(express_1.default.json({ limit: "1mb" }));
// Disable X-Powered-By header (already handled by helmet but explicit)
app.disable("x-powered-by");
// Global rate limiter: 100 requests per minute per IP
app.use((0, express_rate_limit_1.default)({
    windowMs: 60 * 1000,
    max: 100,
    message: { error: "Rate limit exceeded. Please slow down." },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => req.path === "/health", // Don't rate limit health checks
}));
// Request ID for tracing
app.use((req, res, next) => {
    req.requestId = req.headers["x-request-id"] || (0, crypto_1.randomUUID)();
    res.setHeader("X-Request-ID", req.requestId);
    next();
});
// Routes
app.use("/", health_1.default);
app.use("/auth", auth_1.default);
app.use("/admin", admin_1.default);
app.use("/migration", migration_1.default);
app.use("/sponsor", sponsor_1.default);
app.use("/api", dashboard_1.default);
app.use("/api", contracts_1.default);
// Error handler
app.use((err, _req, res, _next) => {
    logger_1.logger.error("Unhandled express error:", err);
    res.status(500).json({ error: "Internal server error" });
});
// Global error handlers — prevent silent crashes
process.on("unhandledRejection", (reason, promise) => {
    logger_1.logger.error("Unhandled promise rejection:", { reason, promise: String(promise) });
});
process.on("uncaughtException", (err) => {
    logger_1.logger.error("Uncaught exception — shutting down:", err);
    process.exit(1);
});
// Cleanup expired auth data periodically
async function cleanupExpiredAuthData() {
    try {
        const now = new Date();
        const [sessions, otps, challenges] = await prisma_1.prisma.$transaction([
            prisma_1.prisma.pendingSession.deleteMany({ where: { expiresAt: { lt: now } } }),
            prisma_1.prisma.otpCode.deleteMany({ where: { expiresAt: { lt: now } } }),
            prisma_1.prisma.walletChallenge.deleteMany({ where: { expiresAt: { lt: now } } }),
        ]);
        if (sessions.count + otps.count + challenges.count > 0) {
            logger_1.logger.info(`Cleanup: removed ${sessions.count} sessions, ${otps.count} OTPs, ${challenges.count} challenges`);
        }
    }
    catch (err) {
        logger_1.logger.warn(`Cleanup error: ${err.message}`);
    }
}
// Startup validation
function validateStartupConfig() {
    const critical = [];
    if (!env_1.env.authSecret || env_1.env.authSecret === "dev-secret") {
        if (env_1.env.nodeEnv === "production")
            critical.push("AUTH_SECRET must be set in production");
    }
    if (!env_1.env.appUrl || env_1.env.appUrl === "http://localhost:3000") {
        if (env_1.env.nodeEnv === "production")
            critical.push("APP_URL must be set to frontend URL in production");
    }
    if (critical.length > 0) {
        logger_1.logger.error("STARTUP VALIDATION FAILED:");
        critical.forEach((msg) => logger_1.logger.error(`  - ${msg}`));
        // Log warnings but don't crash — allow deployment to proceed for configuration in dashboard
    }
    // Informational warnings
    if (!env_1.env.emailApiKey && !env_1.env.smtpHost) {
        logger_1.logger.warn("No email provider configured (EMAIL_API_KEY or SMTP_HOST). Email OTPs will only log to console.");
    }
    if (!env_1.env.telegramBotToken || !env_1.env.telegramBotUsername) {
        logger_1.logger.warn("Telegram not configured (TELEGRAM_BOT_TOKEN / TELEGRAM_BOT_USERNAME). Telegram auth disabled.");
    }
}
// Start
async function main() {
    validateStartupConfig();
    // Connect to DB
    await prisma_1.prisma.$connect();
    logger_1.logger.info("Database connected");
    // Initial cleanup + schedule every 30 min
    await cleanupExpiredAuthData();
    setInterval(cleanupExpiredAuthData, 30 * 60 * 1000);
    // Start HTTP server
    const server = app.listen(env_1.env.port, () => {
        logger_1.logger.info(`BitTON.AI backend running on port ${env_1.env.port} (${env_1.env.nodeEnv})`);
        logger_1.logger.info(`CORS origin: ${corsOrigins.join(", ")}`);
        logger_1.logger.info(`Health check: /health`);
    });
    // Start operator job runner (background)
    if (env_1.env.nodeEnv !== "test") {
        operator_runner_1.operatorRunner.start().catch((err) => {
            logger_1.logger.error("Operator runner crashed:", err);
        });
        bonus_processor_1.bonusProcessor.start().catch((err) => {
            logger_1.logger.error("Bonus processor crashed:", err);
        });
    }
    // Graceful shutdown
    const shutdown = async () => {
        logger_1.logger.info("Shutting down...");
        operator_runner_1.operatorRunner.stop();
        bonus_processor_1.bonusProcessor.stop();
        server.close();
        await prisma_1.prisma.$disconnect();
        process.exit(0);
    };
    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
}
main().catch((err) => {
    logger_1.logger.error("Fatal startup error:", err);
    process.exit(1);
});
//# sourceMappingURL=index.js.map