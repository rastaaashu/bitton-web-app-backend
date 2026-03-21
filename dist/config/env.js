"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const isTest = process.env.NODE_ENV === "test";
const isProd = process.env.NODE_ENV === "production";
function required(key) {
    const val = process.env[key];
    if (!val) {
        if (isTest)
            return `test-${key}`;
        throw new Error(`Missing required env var: ${key}`);
    }
    return val;
}
function optional(key, fallback) {
    return process.env[key] || fallback;
}
/** Required in production, optional in development */
function prodRequired(key, devFallback) {
    const val = process.env[key];
    if (!val) {
        if (isTest)
            return `test-${key}`;
        if (isProd)
            throw new Error(`Missing required env var in production: ${key}`);
        return devFallback;
    }
    return val;
}
exports.env = {
    port: parseInt(optional("PORT", "3001"), 10),
    nodeEnv: optional("NODE_ENV", "development"),
    databaseUrl: required("DATABASE_URL"),
    // Blockchain
    rpcUrl: required("RPC_URL"),
    chainId: parseInt(optional("CHAIN_ID", "8453"), 10),
    relayerPrivateKey: required("RELAYER_PRIVATE_KEY"),
    // Contract addresses — required in production
    contracts: {
        btnToken: required("BTN_TOKEN_ADDRESS"),
        usdcToken: prodRequired("USDC_TOKEN_ADDRESS", ""),
        custodial: required("CUSTODIAL_ADDRESS"),
        vaultManager: prodRequired("VAULT_MANAGER_ADDRESS", ""),
        stakingVault: prodRequired("STAKING_VAULT_ADDRESS", ""),
        rewardEngine: prodRequired("REWARD_ENGINE_ADDRESS", ""),
        vestingPool: prodRequired("VESTING_POOL_ADDRESS", ""),
        withdrawalWallet: prodRequired("WITHDRAWAL_WALLET_ADDRESS", ""),
        bonusEngine: prodRequired("BONUS_ENGINE_ADDRESS", ""),
        reserveFund: optional("RESERVE_FUND_ADDRESS", ""),
    },
    // Auth
    authSecret: isProd ? required("AUTH_SECRET") : optional("AUTH_SECRET", "dev-secret"),
    jwtAccessExpiry: optional("JWT_ACCESS_EXPIRY", "15m"),
    jwtRefreshExpiry: optional("JWT_REFRESH_EXPIRY", "7d"),
    adminApiKey: isProd ? required("ADMIN_API_KEY") : optional("ADMIN_API_KEY", "dev-admin-key"),
    // Email (SMTP)
    smtpHost: optional("SMTP_HOST", ""),
    smtpPort: parseInt(optional("SMTP_PORT", "587"), 10),
    smtpUser: optional("SMTP_USER", ""),
    smtpPass: optional("SMTP_PASS", ""),
    smtpFrom: optional("SMTP_FROM", "noreply@bitton.ai"),
    // HTTP Email API (for platforms that block SMTP ports like Render)
    emailApiKey: optional("EMAIL_API_KEY", ""),
    emailApiProvider: optional("EMAIL_API_PROVIDER", "resend"),
    // Telegram
    telegramBotToken: optional("TELEGRAM_BOT_TOKEN", ""),
    telegramBotUsername: optional("TELEGRAM_BOT_USERNAME", ""),
    // App
    appUrl: optional("APP_URL", "http://localhost:3000"),
};
//# sourceMappingURL=env.js.map