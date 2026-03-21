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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ethers_1 = require("ethers");
const crypto_1 = __importDefault(require("crypto"));
const prisma_1 = require("../utils/prisma");
const logger_1 = require("../utils/logger");
const jwtAuth_1 = require("../middleware/jwtAuth");
const email_service_1 = require("../services/email.service");
const telegram_1 = require("../utils/telegram");
const validation_1 = require("../utils/validation");
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const router = (0, express_1.Router)();
const REFRESH_TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7d
const SESSION_EXPIRY_MS = 30 * 60 * 1000; // 30 min
const OTP_EXPIRY_MS = 10 * 60 * 1000; // 10 min
const OTP_MAX_ATTEMPTS = 5;
// Rate limiters (disabled in test env)
const isTest = process.env.NODE_ENV === "test";
const authLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: isTest ? 1000 : 20,
    message: { error: "Too many requests, try again later" },
    standardHeaders: true,
    legacyHeaders: false,
});
const otpLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: isTest ? 1000 : 5,
    message: { error: "Too many OTP requests, try again later" },
    standardHeaders: true,
    legacyHeaders: false,
});
// ── Helpers ──
function generateOtp() {
    return crypto_1.default.randomInt(100000, 999999).toString();
}
function generateSponsorCode() {
    return "BTN-" + crypto_1.default.randomBytes(4).toString("hex").toUpperCase();
}
function isPrismaUniqueError(err) {
    return err?.code === "P2002";
}
/** Auto-create a sponsor code for a newly registered user */
async function autoCreateSponsorCode(userId) {
    try {
        const code = generateSponsorCode();
        await prisma_1.prisma.sponsorCode.create({
            data: { userId, code, maxUses: 0 },
        });
    }
    catch (err) {
        // Non-critical — log and continue
        logger_1.logger.warn(`Failed to auto-create sponsor code for user ${userId}: ${err.message}`);
    }
}
/**
 * Validate a sponsor reference - accepts EITHER a sponsor code string OR an EVM wallet address.
 * If it's an EVM address (0x + 40 hex chars), look up the user by wallet address.
 * Otherwise, look it up as a SponsorCode.code string.
 */
async function validateSponsorCode(codeOrAddress) {
    const isEvmAddress = /^0x[a-fA-F0-9]{40}$/.test(codeOrAddress);
    if (isEvmAddress) {
        // Look up user by wallet address directly
        const user = await prisma_1.prisma.user.findFirst({
            where: { evmAddress: codeOrAddress.toLowerCase() },
        });
        if (!user || user.status !== "CONFIRMED") {
            return { valid: false, error: "Referrer wallet address not found or not active" };
        }
        return { valid: true, sponsorId: user.id };
    }
    // Otherwise treat as sponsor code string
    const sc = await prisma_1.prisma.sponsorCode.findUnique({ where: { code: codeOrAddress } });
    if (!sc || !sc.active) {
        return { valid: false, error: "Invalid or inactive sponsor code" };
    }
    if (sc.maxUses > 0 && sc.usedCount >= sc.maxUses) {
        return { valid: false, error: "Sponsor code usage limit reached" };
    }
    return { valid: true, sponsorId: sc.userId, sponsorCodeRecord: sc.code };
}
async function incrementSponsorCode(code) {
    if (!code)
        return; // No sponsor code to increment (was a wallet address referral)
    // Atomic increment with limit check to prevent race condition
    const result = await prisma_1.prisma.$executeRaw `
    UPDATE sponsor_codes
    SET used_count = used_count + 1
    WHERE code = ${code}
    AND (max_uses = 0 OR used_count < max_uses)
  `;
    if (result === 0) {
        logger_1.logger.warn(`Sponsor code ${code} increment failed (limit reached or not found)`);
    }
}
async function createSession(userId, req) {
    const user = await prisma_1.prisma.user.findUnique({ where: { id: userId } });
    if (!user)
        throw new Error("User not found");
    const payload = {
        userId: user.id,
        email: user.email || undefined,
        evmAddress: user.evmAddress || undefined,
        telegramId: user.telegramId || undefined,
    };
    const accessToken = (0, jwtAuth_1.signAccessToken)(payload);
    const refreshToken = (0, jwtAuth_1.signRefreshToken)(payload);
    await prisma_1.prisma.$transaction([
        prisma_1.prisma.loginSession.create({
            data: {
                userId: user.id,
                refreshToken,
                userAgent: req.headers["user-agent"] || null,
                ipAddress: req.ip || null,
                expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS),
            },
        }),
        prisma_1.prisma.user.update({
            where: { id: userId },
            data: { lastLoginAt: new Date() },
        }),
    ]);
    return { accessToken, refreshToken };
}
function userResponse(user) {
    return {
        id: user.id,
        email: user.email,
        status: user.status,
        evmAddress: user.evmAddress,
        telegramId: user.telegramId,
        authMethod: user.authMethod,
        createdAt: user.createdAt,
    };
}
// ════════════════════════════════════════
// REGISTRATION: EVM WALLET
// ════════════════════════════════════════
router.post("/register/wallet", authLimiter, async (req, res) => {
    try {
        const parsed = validation_1.registerWalletSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ error: parsed.error.errors[0].message });
            return;
        }
        const { address, signature, message, sponsorCode } = parsed.data;
        const normalizedAddr = address.toLowerCase();
        // Verify wallet signature
        const recovered = ethers_1.ethers.verifyMessage(message, signature);
        if (recovered.toLowerCase() !== normalizedAddr) {
            res.status(401).json({ error: "Wallet signature verification failed" });
            return;
        }
        // Check duplicate wallet
        const existingWallet = await prisma_1.prisma.user.findFirst({ where: { evmAddress: normalizedAddr } });
        if (existingWallet) {
            res.status(409).json({ error: "Wallet already registered" });
            return;
        }
        // Validate sponsor (accepts sponsor code OR wallet address)
        const sponsor = await validateSponsorCode(sponsorCode);
        if (!sponsor.valid) {
            res.status(400).json({ error: sponsor.error });
            return;
        }
        // Create user (immediately CONFIRMED)
        let user;
        try {
            user = await prisma_1.prisma.user.create({
                data: {
                    evmAddress: normalizedAddr,
                    authMethod: "WALLET",
                    status: "CONFIRMED",
                    sponsorId: sponsor.sponsorId,
                },
            });
        }
        catch (createErr) {
            if (isPrismaUniqueError(createErr)) {
                res.status(409).json({ error: "Wallet or identity already registered" });
                return;
            }
            throw createErr;
        }
        await incrementSponsorCode(sponsor.sponsorCodeRecord);
        await autoCreateSponsorCode(user.id);
        const tokens = await createSession(user.id, req);
        await prisma_1.prisma.auditLog.create({
            data: { actor: normalizedAddr, action: "auth.register.wallet", target: user.id },
        });
        res.status(201).json({
            ...tokens,
            user: userResponse(user),
        });
    }
    catch (err) {
        logger_1.logger.error("Register wallet error:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});
// ════════════════════════════════════════
// REGISTRATION: EMAIL - Step 1 (send OTP)
// ════════════════════════════════════════
router.post("/register/email/init", otpLimiter, async (req, res) => {
    try {
        const parsed = validation_1.registerEmailInitSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ error: parsed.error.errors[0].message });
            return;
        }
        const email = parsed.data.email.toLowerCase();
        // Check if email already registered
        const existing = await prisma_1.prisma.user.findUnique({ where: { email } });
        if (existing) {
            res.status(409).json({ error: "Email already registered" });
            return;
        }
        // Create pending session
        const session = await prisma_1.prisma.pendingSession.create({
            data: {
                type: "REGISTER_EMAIL",
                email,
                expiresAt: new Date(Date.now() + SESSION_EXPIRY_MS),
            },
        });
        // Generate and store OTP
        const otp = generateOtp();
        await prisma_1.prisma.otpCode.create({
            data: {
                sessionId: session.id,
                code: otp,
                expiresAt: new Date(Date.now() + OTP_EXPIRY_MS),
            },
        });
        // Send OTP email
        try {
            await (0, email_service_1.sendOtpEmail)(email, otp);
        }
        catch (emailErr) {
            logger_1.logger.error("Failed to send OTP email during registration:", emailErr.message);
            // Still return session so user can try resending
            await prisma_1.prisma.auditLog.create({
                data: { actor: email, action: "auth.register.email.init.email_failed", target: session.id },
            });
            res.json({ sessionId: session.id, message: "Verification code sent to your email" });
            return;
        }
        await prisma_1.prisma.auditLog.create({
            data: { actor: email, action: "auth.register.email.init", target: session.id },
        });
        res.json({ sessionId: session.id, message: "Verification code sent to your email" });
    }
    catch (err) {
        logger_1.logger.error("Register email init error:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});
// ════════════════════════════════════════
// REGISTRATION/LOGIN: Verify OTP (shared)
// ════════════════════════════════════════
router.post("/verify-otp", authLimiter, async (req, res) => {
    try {
        const parsed = validation_1.verifyOtpSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ error: parsed.error.errors[0].message });
            return;
        }
        const { sessionId, otp } = parsed.data;
        const session = await prisma_1.prisma.pendingSession.findUnique({
            where: { id: sessionId },
            include: { otpCodes: { orderBy: { createdAt: "desc" }, take: 1 } },
        });
        if (!session || session.expiresAt < new Date()) {
            res.status(400).json({ error: "Session expired or not found. Please start over." });
            return;
        }
        if (session.verified) {
            res.json({ sessionId, verified: true, message: "Already verified" });
            return;
        }
        const latestOtp = session.otpCodes[0];
        if (!latestOtp) {
            res.status(400).json({ error: "No OTP found for this session" });
            return;
        }
        if (latestOtp.usedAt) {
            res.status(400).json({ error: "OTP already used. Request a new one." });
            return;
        }
        if (latestOtp.expiresAt < new Date()) {
            res.status(400).json({ error: "OTP expired. Request a new one." });
            return;
        }
        if (latestOtp.attempts >= OTP_MAX_ATTEMPTS) {
            res.status(429).json({ error: "Too many failed attempts. Request a new OTP." });
            return;
        }
        // Timing-safe OTP comparison to prevent side-channel attacks
        const otpMatch = latestOtp.code.length === otp.length &&
            crypto_1.default.timingSafeEqual(Buffer.from(latestOtp.code), Buffer.from(otp));
        if (!otpMatch) {
            await prisma_1.prisma.otpCode.update({
                where: { id: latestOtp.id },
                data: { attempts: { increment: 1 } },
            });
            logger_1.logger.warn(`Failed OTP attempt for session ${sessionId} (attempt ${latestOtp.attempts + 1}/${OTP_MAX_ATTEMPTS})`);
            await prisma_1.prisma.auditLog.create({
                data: { actor: session.email || `session:${sessionId}`, action: "auth.otp.failed", target: sessionId },
            }).catch(() => { });
            res.status(400).json({ error: "Invalid verification code" });
            return;
        }
        // Mark OTP as used and session as verified
        await prisma_1.prisma.otpCode.update({
            where: { id: latestOtp.id },
            data: { usedAt: new Date() },
        });
        await prisma_1.prisma.pendingSession.update({
            where: { id: sessionId },
            data: { verified: true },
        });
        res.json({ sessionId, verified: true, message: "Email verified successfully" });
    }
    catch (err) {
        logger_1.logger.error("Verify OTP error:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});
// ════════════════════════════════════════
// RESEND OTP (for email flows)
// ════════════════════════════════════════
router.post("/resend-otp", otpLimiter, async (req, res) => {
    try {
        const sessionId = req.body?.sessionId;
        if (!sessionId || typeof sessionId !== "string") {
            res.status(400).json({ error: "Session ID is required" });
            return;
        }
        const session = await prisma_1.prisma.pendingSession.findUnique({ where: { id: sessionId } });
        if (!session || session.expiresAt < new Date()) {
            res.status(400).json({ error: "Session expired or not found. Please start over." });
            return;
        }
        if (session.verified) {
            res.status(400).json({ error: "Session already verified" });
            return;
        }
        if (!session.email) {
            res.status(400).json({ error: "No email associated with this session" });
            return;
        }
        const otp = generateOtp();
        await prisma_1.prisma.otpCode.create({
            data: {
                sessionId: session.id,
                code: otp,
                expiresAt: new Date(Date.now() + OTP_EXPIRY_MS),
            },
        });
        try {
            await (0, email_service_1.sendOtpEmail)(session.email, otp);
        }
        catch (emailErr) {
            logger_1.logger.error("Failed to resend OTP email:", emailErr.message);
        }
        res.json({ message: "New verification code sent" });
    }
    catch (err) {
        logger_1.logger.error("Resend OTP error:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});
// ════════════════════════════════════════
// REGISTRATION: EMAIL - Step 3 (complete with wallet)
// ════════════════════════════════════════
router.post("/register/email/complete", authLimiter, async (req, res) => {
    try {
        const parsed = validation_1.registerEmailCompleteSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ error: parsed.error.errors[0].message });
            return;
        }
        const { sessionId, sponsorCode, address, signature, message } = parsed.data;
        const normalizedAddr = address.toLowerCase();
        // Validate session
        const session = await prisma_1.prisma.pendingSession.findUnique({ where: { id: sessionId } });
        if (!session || session.expiresAt < new Date()) {
            res.status(400).json({ error: "Session expired. Please start over." });
            return;
        }
        if (!session.verified) {
            res.status(400).json({ error: "Email not verified. Please verify your OTP first." });
            return;
        }
        if (session.type !== "REGISTER_EMAIL") {
            res.status(400).json({ error: "Invalid session type" });
            return;
        }
        // Verify wallet signature
        const recovered = ethers_1.ethers.verifyMessage(message, signature);
        if (recovered.toLowerCase() !== normalizedAddr) {
            res.status(401).json({ error: "Wallet signature verification failed" });
            return;
        }
        // Check duplicates
        const existingEmail = await prisma_1.prisma.user.findUnique({ where: { email: session.email } });
        if (existingEmail) {
            res.status(409).json({ error: "Email already registered" });
            return;
        }
        const existingWallet = await prisma_1.prisma.user.findFirst({ where: { evmAddress: normalizedAddr } });
        if (existingWallet) {
            res.status(409).json({ error: "Wallet already registered to another account" });
            return;
        }
        // Validate sponsor (accepts sponsor code OR wallet address)
        const sponsor = await validateSponsorCode(sponsorCode);
        if (!sponsor.valid) {
            res.status(400).json({ error: sponsor.error });
            return;
        }
        // Create user
        let user;
        try {
            user = await prisma_1.prisma.user.create({
                data: {
                    email: session.email,
                    evmAddress: normalizedAddr,
                    authMethod: "EMAIL",
                    status: "CONFIRMED",
                    emailVerifiedAt: new Date(),
                    sponsorId: sponsor.sponsorId,
                },
            });
        }
        catch (createErr) {
            if (isPrismaUniqueError(createErr)) {
                res.status(409).json({ error: "Email or wallet already registered" });
                return;
            }
            throw createErr;
        }
        await incrementSponsorCode(sponsor.sponsorCodeRecord);
        await autoCreateSponsorCode(user.id);
        // Clean up session
        await prisma_1.prisma.pendingSession.delete({ where: { id: sessionId } }).catch(() => { });
        const tokens = await createSession(user.id, req);
        await prisma_1.prisma.auditLog.create({
            data: { actor: session.email, action: "auth.register.email.complete", target: user.id },
        });
        res.status(201).json({
            ...tokens,
            user: userResponse(user),
        });
    }
    catch (err) {
        logger_1.logger.error("Register email complete error:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});
// ════════════════════════════════════════
// REGISTRATION: TELEGRAM - Step 1 (verify widget)
// ════════════════════════════════════════
router.post("/register/telegram/init", authLimiter, async (req, res) => {
    try {
        const parsed = validation_1.registerTelegramInitSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ error: parsed.error.errors[0].message });
            return;
        }
        const telegramData = parsed.data;
        // Verify Telegram auth
        if (!(0, telegram_1.verifyTelegramAuth)(telegramData)) {
            res.status(401).json({ error: "Telegram authentication failed. Ensure TELEGRAM_BOT_TOKEN is configured." });
            return;
        }
        const telegramId = telegramData.id.toString();
        // Check if telegram ID already registered
        const existing = await prisma_1.prisma.user.findFirst({ where: { telegramId } });
        if (existing) {
            res.status(409).json({ error: "Telegram account already registered" });
            return;
        }
        // Create pending session
        const session = await prisma_1.prisma.pendingSession.create({
            data: {
                type: "REGISTER_TELEGRAM",
                telegramId,
                telegramData: JSON.stringify(telegramData),
                verified: true, // Telegram widget already verified
                expiresAt: new Date(Date.now() + SESSION_EXPIRY_MS),
            },
        });
        await prisma_1.prisma.auditLog.create({
            data: { actor: `tg:${telegramId}`, action: "auth.register.telegram.init", target: session.id },
        });
        res.json({
            sessionId: session.id,
            telegramUser: {
                id: telegramData.id,
                firstName: telegramData.first_name,
                username: telegramData.username,
            },
            message: "Telegram verified. Please connect your wallet to complete registration.",
        });
    }
    catch (err) {
        logger_1.logger.error("Register telegram init error:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});
// ════════════════════════════════════════
// REGISTRATION: TELEGRAM - Step 2 (complete with wallet)
// ════════════════════════════════════════
router.post("/register/telegram/complete", authLimiter, async (req, res) => {
    try {
        const parsed = validation_1.registerTelegramCompleteSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ error: parsed.error.errors[0].message });
            return;
        }
        const { sessionId, sponsorCode, address, signature, message } = parsed.data;
        const normalizedAddr = address.toLowerCase();
        // Validate session
        const session = await prisma_1.prisma.pendingSession.findUnique({ where: { id: sessionId } });
        if (!session || session.expiresAt < new Date()) {
            res.status(400).json({ error: "Session expired. Please start over." });
            return;
        }
        if (!session.verified || session.type !== "REGISTER_TELEGRAM") {
            res.status(400).json({ error: "Invalid session" });
            return;
        }
        // Verify wallet signature
        const recovered = ethers_1.ethers.verifyMessage(message, signature);
        if (recovered.toLowerCase() !== normalizedAddr) {
            res.status(401).json({ error: "Wallet signature verification failed" });
            return;
        }
        // Check duplicates
        const existingTelegram = await prisma_1.prisma.user.findFirst({ where: { telegramId: session.telegramId } });
        if (existingTelegram) {
            res.status(409).json({ error: "Telegram account already registered" });
            return;
        }
        const existingWallet = await prisma_1.prisma.user.findFirst({ where: { evmAddress: normalizedAddr } });
        if (existingWallet) {
            res.status(409).json({ error: "Wallet already registered to another account" });
            return;
        }
        // Validate sponsor (accepts sponsor code OR wallet address)
        const sponsor = await validateSponsorCode(sponsorCode);
        if (!sponsor.valid) {
            res.status(400).json({ error: sponsor.error });
            return;
        }
        // Create user
        let user;
        try {
            user = await prisma_1.prisma.user.create({
                data: {
                    telegramId: session.telegramId,
                    evmAddress: normalizedAddr,
                    authMethod: "TELEGRAM",
                    status: "CONFIRMED",
                    sponsorId: sponsor.sponsorId,
                },
            });
        }
        catch (createErr) {
            if (isPrismaUniqueError(createErr)) {
                res.status(409).json({ error: "Telegram account or wallet already registered" });
                return;
            }
            throw createErr;
        }
        await incrementSponsorCode(sponsor.sponsorCodeRecord);
        await autoCreateSponsorCode(user.id);
        await prisma_1.prisma.pendingSession.delete({ where: { id: sessionId } }).catch(() => { });
        const tokens = await createSession(user.id, req);
        await prisma_1.prisma.auditLog.create({
            data: { actor: `tg:${session.telegramId}`, action: "auth.register.telegram.complete", target: user.id },
        });
        res.status(201).json({
            ...tokens,
            user: userResponse(user),
        });
    }
    catch (err) {
        logger_1.logger.error("Register telegram complete error:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});
// ════════════════════════════════════════
// LOGIN: WALLET - Step 1 (challenge)
// ════════════════════════════════════════
router.post("/login/wallet/challenge", authLimiter, async (req, res) => {
    try {
        const parsed = validation_1.challengeSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ error: parsed.error.errors[0].message });
            return;
        }
        const { address } = parsed.data;
        const nonce = crypto_1.default.randomBytes(32).toString("hex");
        const message = `Sign this message to authenticate with BitTON.AI\n\nNonce: ${nonce}\nAddress: ${address}\nTimestamp: ${new Date().toISOString()}`;
        const normalizedAddr = address.toLowerCase();
        // Upsert challenge to DB (production-safe, survives restarts)
        await prisma_1.prisma.walletChallenge.upsert({
            where: { address: normalizedAddr },
            update: {
                nonce,
                message,
                expiresAt: new Date(Date.now() + 5 * 60 * 1000),
            },
            create: {
                address: normalizedAddr,
                nonce,
                message,
                expiresAt: new Date(Date.now() + 5 * 60 * 1000),
            },
        });
        res.json({ message, nonce });
    }
    catch (err) {
        logger_1.logger.error("Wallet challenge error:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});
// ════════════════════════════════════════
// LOGIN: WALLET - Step 2 (verify signature)
// ════════════════════════════════════════
router.post("/login/wallet/verify", authLimiter, async (req, res) => {
    try {
        const parsed = validation_1.walletVerifySchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ error: parsed.error.errors[0].message });
            return;
        }
        const { address, signature, message } = parsed.data;
        const normalizedAddr = address.toLowerCase();
        // Retrieve challenge from DB
        const challenge = await prisma_1.prisma.walletChallenge.findUnique({
            where: { address: normalizedAddr },
        });
        if (!challenge || challenge.expiresAt < new Date()) {
            res.status(401).json({ error: "Challenge expired or not found. Please try again." });
            return;
        }
        // Verify the signed message matches the issued challenge
        if (message !== challenge.message) {
            res.status(401).json({ error: "Message does not match the issued challenge" });
            return;
        }
        const recovered = ethers_1.ethers.verifyMessage(message, signature);
        if (recovered.toLowerCase() !== normalizedAddr) {
            res.status(401).json({ error: "Signature verification failed" });
            return;
        }
        // Clean up used challenge
        await prisma_1.prisma.walletChallenge.delete({ where: { address: normalizedAddr } }).catch(() => { });
        const user = await prisma_1.prisma.user.findFirst({ where: { evmAddress: normalizedAddr } });
        if (!user) {
            res.status(404).json({ error: "No account found for this wallet. Please register first." });
            return;
        }
        if (user.status !== "CONFIRMED") {
            res.status(403).json({ error: `Account not confirmed. Current status: ${user.status}` });
            return;
        }
        const tokens = await createSession(user.id, req);
        await prisma_1.prisma.auditLog.create({
            data: { actor: normalizedAddr, action: "auth.login.wallet", target: user.id },
        });
        res.json({
            ...tokens,
            user: userResponse(user),
        });
    }
    catch (err) {
        logger_1.logger.error("Wallet login error:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});
// ════════════════════════════════════════
// LOGIN: EMAIL - Step 1 (send OTP)
// ════════════════════════════════════════
router.post("/login/email/init", otpLimiter, async (req, res) => {
    try {
        const parsed = validation_1.loginEmailInitSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ error: parsed.error.errors[0].message });
            return;
        }
        const email = parsed.data.email.toLowerCase();
        // Check if user exists with this email
        const user = await prisma_1.prisma.user.findUnique({ where: { email } });
        if (!user) {
            // Don't reveal whether email exists - still send a generic response
            // but don't actually send an OTP
            res.json({ sessionId: crypto_1.default.randomUUID(), message: "If this email is registered, a verification code has been sent." });
            return;
        }
        // Create pending session
        const session = await prisma_1.prisma.pendingSession.create({
            data: {
                type: "LOGIN_EMAIL",
                email,
                expiresAt: new Date(Date.now() + SESSION_EXPIRY_MS),
            },
        });
        const otp = generateOtp();
        await prisma_1.prisma.otpCode.create({
            data: {
                sessionId: session.id,
                code: otp,
                expiresAt: new Date(Date.now() + OTP_EXPIRY_MS),
            },
        });
        try {
            await (0, email_service_1.sendOtpEmail)(email, otp);
        }
        catch (emailErr) {
            logger_1.logger.error("Failed to send OTP email during login:", emailErr.message);
        }
        res.json({ sessionId: session.id, message: "If this email is registered, a verification code has been sent." });
    }
    catch (err) {
        logger_1.logger.error("Login email init error:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});
// ════════════════════════════════════════
// LOGIN: EMAIL - Step 3 (complete with wallet)
// ════════════════════════════════════════
router.post("/login/email/complete", authLimiter, async (req, res) => {
    try {
        const parsed = validation_1.loginCompleteSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ error: parsed.error.errors[0].message });
            return;
        }
        const { sessionId, address, signature, message } = parsed.data;
        const normalizedAddr = address.toLowerCase();
        // Validate session
        const session = await prisma_1.prisma.pendingSession.findUnique({ where: { id: sessionId } });
        if (!session || session.expiresAt < new Date()) {
            res.status(400).json({ error: "Session expired. Please start over." });
            return;
        }
        if (!session.verified || session.type !== "LOGIN_EMAIL") {
            res.status(400).json({ error: "Email not verified. Please verify your OTP first." });
            return;
        }
        // Verify wallet signature
        const recovered = ethers_1.ethers.verifyMessage(message, signature);
        if (recovered.toLowerCase() !== normalizedAddr) {
            res.status(401).json({ error: "Wallet signature verification failed" });
            return;
        }
        // Find user by email
        const user = await prisma_1.prisma.user.findUnique({ where: { email: session.email } });
        if (!user) {
            res.status(404).json({ error: "Account not found" });
            return;
        }
        // Verify wallet matches the user's registered wallet
        if (user.evmAddress && user.evmAddress !== normalizedAddr) {
            res.status(403).json({ error: "Wallet does not match the registered wallet for this account" });
            return;
        }
        if (user.status !== "CONFIRMED") {
            res.status(403).json({ error: `Account not confirmed. Current status: ${user.status}` });
            return;
        }
        await prisma_1.prisma.pendingSession.delete({ where: { id: sessionId } });
        const tokens = await createSession(user.id, req);
        await prisma_1.prisma.auditLog.create({
            data: { actor: session.email, action: "auth.login.email", target: user.id },
        });
        res.json({
            ...tokens,
            user: userResponse(user),
        });
    }
    catch (err) {
        logger_1.logger.error("Login email complete error:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});
// ════════════════════════════════════════
// LOGIN: TELEGRAM - Step 1 (verify widget)
// ════════════════════════════════════════
router.post("/login/telegram/init", authLimiter, async (req, res) => {
    try {
        const parsed = validation_1.loginTelegramInitSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ error: parsed.error.errors[0].message });
            return;
        }
        const telegramData = parsed.data;
        if (!(0, telegram_1.verifyTelegramAuth)(telegramData)) {
            res.status(401).json({ error: "Telegram authentication failed" });
            return;
        }
        const telegramId = telegramData.id.toString();
        // Check user exists
        const user = await prisma_1.prisma.user.findFirst({ where: { telegramId } });
        if (!user) {
            res.status(404).json({ error: "No account found for this Telegram user. Please register first." });
            return;
        }
        // Create pending session
        const session = await prisma_1.prisma.pendingSession.create({
            data: {
                type: "LOGIN_TELEGRAM",
                telegramId,
                telegramData: JSON.stringify(telegramData),
                verified: true,
                expiresAt: new Date(Date.now() + SESSION_EXPIRY_MS),
            },
        });
        res.json({
            sessionId: session.id,
            message: "Telegram verified. Please connect your wallet to complete login.",
        });
    }
    catch (err) {
        logger_1.logger.error("Login telegram init error:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});
// ════════════════════════════════════════
// LOGIN: TELEGRAM - Step 2 (complete with wallet)
// ════════════════════════════════════════
router.post("/login/telegram/complete", authLimiter, async (req, res) => {
    try {
        const parsed = validation_1.loginCompleteSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ error: parsed.error.errors[0].message });
            return;
        }
        const { sessionId, address, signature, message } = parsed.data;
        const normalizedAddr = address.toLowerCase();
        const session = await prisma_1.prisma.pendingSession.findUnique({ where: { id: sessionId } });
        if (!session || session.expiresAt < new Date()) {
            res.status(400).json({ error: "Session expired. Please start over." });
            return;
        }
        if (!session.verified || session.type !== "LOGIN_TELEGRAM") {
            res.status(400).json({ error: "Invalid session" });
            return;
        }
        // Verify wallet signature
        const recovered = ethers_1.ethers.verifyMessage(message, signature);
        if (recovered.toLowerCase() !== normalizedAddr) {
            res.status(401).json({ error: "Wallet signature verification failed" });
            return;
        }
        // Find user by telegram ID
        const user = await prisma_1.prisma.user.findFirst({ where: { telegramId: session.telegramId } });
        if (!user) {
            res.status(404).json({ error: "Account not found" });
            return;
        }
        // Verify wallet matches
        if (user.evmAddress && user.evmAddress !== normalizedAddr) {
            res.status(403).json({ error: "Wallet does not match the registered wallet for this account" });
            return;
        }
        if (user.status !== "CONFIRMED") {
            res.status(403).json({ error: `Account not confirmed. Current status: ${user.status}` });
            return;
        }
        await prisma_1.prisma.pendingSession.delete({ where: { id: sessionId } });
        const tokens = await createSession(user.id, req);
        await prisma_1.prisma.auditLog.create({
            data: { actor: `tg:${session.telegramId}`, action: "auth.login.telegram", target: user.id },
        });
        res.json({
            ...tokens,
            user: userResponse(user),
        });
    }
    catch (err) {
        logger_1.logger.error("Login telegram complete error:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});
// ════════════════════════════════════════
// LOGIN: EMAIL - Direct (no wallet needed)
// After OTP verification, log in immediately without wallet signature
// ════════════════════════════════════════
router.post("/login/email/direct", authLimiter, async (req, res) => {
    try {
        const { sessionId } = req.body;
        if (!sessionId) {
            res.status(400).json({ error: "sessionId is required" });
            return;
        }
        const session = await prisma_1.prisma.pendingSession.findUnique({ where: { id: sessionId } });
        if (!session || session.expiresAt < new Date()) {
            res.status(400).json({ error: "Session expired. Please start over." });
            return;
        }
        if (!session.verified || session.type !== "LOGIN_EMAIL") {
            res.status(400).json({ error: "Email not verified. Please verify your OTP first." });
            return;
        }
        const user = await prisma_1.prisma.user.findUnique({ where: { email: session.email } });
        if (!user) {
            res.status(404).json({ error: "Account not found" });
            return;
        }
        if (user.status !== "CONFIRMED") {
            res.status(403).json({ error: `Account not confirmed. Current status: ${user.status}` });
            return;
        }
        await prisma_1.prisma.pendingSession.delete({ where: { id: sessionId } });
        const tokens = await createSession(user.id, req);
        await prisma_1.prisma.auditLog.create({
            data: { actor: session.email, action: "auth.login.email.direct", target: user.id },
        });
        res.json({ ...tokens, user: userResponse(user) });
    }
    catch (err) {
        logger_1.logger.error("Login email direct error:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});
// ════════════════════════════════════════
// LOGIN: TELEGRAM - Direct (no wallet needed)
// After Telegram widget verification, log in immediately
// ════════════════════════════════════════
router.post("/login/telegram/direct", authLimiter, async (req, res) => {
    try {
        const parsed = validation_1.loginTelegramInitSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ error: parsed.error.errors[0].message });
            return;
        }
        const telegramData = parsed.data;
        if (!(0, telegram_1.verifyTelegramAuth)(telegramData)) {
            res.status(401).json({ error: "Telegram authentication failed" });
            return;
        }
        const telegramId = telegramData.id.toString();
        const user = await prisma_1.prisma.user.findFirst({ where: { telegramId } });
        if (!user) {
            res.status(404).json({ error: "No account found for this Telegram user. Please register first." });
            return;
        }
        if (user.status !== "CONFIRMED") {
            res.status(403).json({ error: `Account not confirmed. Current status: ${user.status}` });
            return;
        }
        const tokens = await createSession(user.id, req);
        await prisma_1.prisma.auditLog.create({
            data: { actor: `tg:${telegramId}`, action: "auth.login.telegram.direct", target: user.id },
        });
        res.json({ ...tokens, user: userResponse(user) });
    }
    catch (err) {
        logger_1.logger.error("Login telegram direct error:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});
// ════════════════════════════════════════
// UNIFIED: WALLET (auto-detect login/register)
// Uses the existing /login/wallet/challenge for step 1
// ════════════════════════════════════════
router.post("/wallet/complete", authLimiter, async (req, res) => {
    try {
        const parsed = validation_1.unifiedWalletCompleteSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ error: parsed.error.errors[0].message });
            return;
        }
        const { address, signature, message, sponsorCode } = parsed.data;
        const normalizedAddr = address.toLowerCase();
        // Verify the challenge exists and matches
        const challenge = await prisma_1.prisma.walletChallenge.findUnique({
            where: { address: normalizedAddr },
        });
        if (!challenge || challenge.expiresAt < new Date()) {
            res.status(401).json({ error: "Challenge expired or not found. Please try again." });
            return;
        }
        if (message !== challenge.message) {
            res.status(401).json({ error: "Message does not match the issued challenge" });
            return;
        }
        // Verify signature
        const recovered = ethers_1.ethers.verifyMessage(message, signature);
        if (recovered.toLowerCase() !== normalizedAddr) {
            res.status(401).json({ error: "Signature verification failed" });
            return;
        }
        // Clean up challenge
        await prisma_1.prisma.walletChallenge.delete({ where: { address: normalizedAddr } }).catch(() => { });
        // Check if user exists
        const existingUser = await prisma_1.prisma.user.findFirst({ where: { evmAddress: normalizedAddr } });
        if (existingUser) {
            // ── LOGIN ──
            if (existingUser.status !== "CONFIRMED") {
                res.status(403).json({ error: `Account not confirmed. Current status: ${existingUser.status}` });
                return;
            }
            const tokens = await createSession(existingUser.id, req);
            await prisma_1.prisma.auditLog.create({
                data: { actor: normalizedAddr, action: "auth.unified.wallet.login", target: existingUser.id },
            });
            res.json({ ...tokens, user: userResponse(existingUser), authenticated: true });
        }
        else {
            // ── REGISTER ──
            if (!sponsorCode) {
                res.status(400).json({ error: "NEEDS_SPONSOR", message: "Referral code is required for new accounts" });
                return;
            }
            const sponsor = await validateSponsorCode(sponsorCode);
            if (!sponsor.valid) {
                res.status(400).json({ error: sponsor.error });
                return;
            }
            let user;
            try {
                user = await prisma_1.prisma.user.create({
                    data: {
                        evmAddress: normalizedAddr,
                        authMethod: "WALLET",
                        status: "CONFIRMED",
                        sponsorId: sponsor.sponsorId,
                    },
                });
            }
            catch (createErr) {
                if (isPrismaUniqueError(createErr)) {
                    res.status(409).json({ error: "Wallet or identity already registered" });
                    return;
                }
                throw createErr;
            }
            await incrementSponsorCode(sponsor.sponsorCodeRecord);
            await autoCreateSponsorCode(user.id);
            const tokens = await createSession(user.id, req);
            await prisma_1.prisma.auditLog.create({
                data: { actor: normalizedAddr, action: "auth.unified.wallet.register", target: user.id },
            });
            res.status(201).json({ ...tokens, user: userResponse(user), authenticated: true });
        }
    }
    catch (err) {
        logger_1.logger.error("Unified wallet complete error:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});
// ════════════════════════════════════════
// UNIFIED: EMAIL - init (auto-detect login/register)
// ════════════════════════════════════════
router.post("/email/init", otpLimiter, async (req, res) => {
    try {
        const parsed = validation_1.unifiedEmailInitSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ error: parsed.error.errors[0].message });
            return;
        }
        const email = parsed.data.email.toLowerCase();
        // Auto-detect: does user exist?
        const existingUser = await prisma_1.prisma.user.findUnique({ where: { email } });
        const sessionType = existingUser ? "LOGIN_EMAIL" : "REGISTER_EMAIL";
        const session = await prisma_1.prisma.pendingSession.create({
            data: {
                type: sessionType,
                email,
                expiresAt: new Date(Date.now() + SESSION_EXPIRY_MS),
            },
        });
        const otp = generateOtp();
        await prisma_1.prisma.otpCode.create({
            data: {
                sessionId: session.id,
                code: otp,
                expiresAt: new Date(Date.now() + OTP_EXPIRY_MS),
            },
        });
        try {
            await (0, email_service_1.sendOtpEmail)(email, otp);
        }
        catch (emailErr) {
            logger_1.logger.error("Failed to send OTP email:", emailErr.message);
        }
        await prisma_1.prisma.auditLog.create({
            data: { actor: email, action: `auth.unified.email.init.${sessionType}`, target: session.id },
        });
        res.json({
            sessionId: session.id,
            authenticated: true,
            message: "Verification code sent to your email",
        });
    }
    catch (err) {
        logger_1.logger.error("Unified email init error:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});
// ════════════════════════════════════════
// UNIFIED: EMAIL - complete (auto-detect login/register)
// ════════════════════════════════════════
router.post("/email/complete", authLimiter, async (req, res) => {
    try {
        const parsed = validation_1.unifiedEmailCompleteSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ error: parsed.error.errors[0].message });
            return;
        }
        const { sessionId, address, signature, message, sponsorCode } = parsed.data;
        const normalizedAddr = address.toLowerCase();
        const session = await prisma_1.prisma.pendingSession.findUnique({ where: { id: sessionId } });
        if (!session || session.expiresAt < new Date()) {
            res.status(400).json({ error: "Session expired. Please start over." });
            return;
        }
        if (!session.verified) {
            res.status(400).json({ error: "Email not verified. Please verify your OTP first." });
            return;
        }
        if (session.type !== "LOGIN_EMAIL" && session.type !== "REGISTER_EMAIL") {
            res.status(400).json({ error: "Invalid session type" });
            return;
        }
        // Verify wallet signature
        const recovered = ethers_1.ethers.verifyMessage(message, signature);
        if (recovered.toLowerCase() !== normalizedAddr) {
            res.status(401).json({ error: "Wallet signature verification failed" });
            return;
        }
        if (session.type === "LOGIN_EMAIL") {
            // ── LOGIN ──
            const user = await prisma_1.prisma.user.findUnique({ where: { email: session.email } });
            if (!user) {
                res.status(404).json({ error: "Account not found" });
                return;
            }
            if (user.evmAddress && user.evmAddress !== normalizedAddr) {
                res.status(403).json({ error: "Wallet does not match the registered wallet for this account" });
                return;
            }
            if (user.status !== "CONFIRMED") {
                res.status(403).json({ error: `Account not confirmed. Current status: ${user.status}` });
                return;
            }
            await prisma_1.prisma.pendingSession.delete({ where: { id: sessionId } }).catch(() => { });
            const tokens = await createSession(user.id, req);
            await prisma_1.prisma.auditLog.create({
                data: { actor: session.email, action: "auth.unified.email.login", target: user.id },
            });
            res.json({ ...tokens, user: userResponse(user), authenticated: true });
        }
        else {
            // ── REGISTER ──
            if (!sponsorCode) {
                res.status(400).json({ error: "NEEDS_SPONSOR", message: "Referral code is required for new accounts" });
                return;
            }
            // Check duplicates
            const existingEmail = await prisma_1.prisma.user.findUnique({ where: { email: session.email } });
            if (existingEmail) {
                res.status(409).json({ error: "Email already registered" });
                return;
            }
            const existingWallet = await prisma_1.prisma.user.findFirst({ where: { evmAddress: normalizedAddr } });
            if (existingWallet) {
                res.status(409).json({ error: "Wallet already registered to another account" });
                return;
            }
            const sponsor = await validateSponsorCode(sponsorCode);
            if (!sponsor.valid) {
                res.status(400).json({ error: sponsor.error });
                return;
            }
            let user;
            try {
                user = await prisma_1.prisma.user.create({
                    data: {
                        email: session.email,
                        evmAddress: normalizedAddr,
                        authMethod: "EMAIL",
                        status: "CONFIRMED",
                        emailVerifiedAt: new Date(),
                        sponsorId: sponsor.sponsorId,
                    },
                });
            }
            catch (createErr) {
                if (isPrismaUniqueError(createErr)) {
                    res.status(409).json({ error: "Email or wallet already registered" });
                    return;
                }
                throw createErr;
            }
            await incrementSponsorCode(sponsor.sponsorCodeRecord);
            await autoCreateSponsorCode(user.id);
            await prisma_1.prisma.pendingSession.delete({ where: { id: sessionId } }).catch(() => { });
            const tokens = await createSession(user.id, req);
            await prisma_1.prisma.auditLog.create({
                data: { actor: session.email, action: "auth.unified.email.register", target: user.id },
            });
            res.status(201).json({ ...tokens, user: userResponse(user), authenticated: true });
        }
    }
    catch (err) {
        logger_1.logger.error("Unified email complete error:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});
// ════════════════════════════════════════
// UNIFIED: TELEGRAM - init (auto-detect login/register)
// ════════════════════════════════════════
router.post("/telegram/init", authLimiter, async (req, res) => {
    try {
        const parsed = validation_1.loginTelegramInitSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ error: parsed.error.errors[0].message });
            return;
        }
        const telegramData = parsed.data;
        if (!(0, telegram_1.verifyTelegramAuth)(telegramData)) {
            res.status(401).json({ error: "Telegram authentication failed. Ensure TELEGRAM_BOT_TOKEN is configured correctly." });
            return;
        }
        const telegramId = telegramData.id.toString();
        const existingUser = await prisma_1.prisma.user.findFirst({ where: { telegramId } });
        const sessionType = existingUser ? "LOGIN_TELEGRAM" : "REGISTER_TELEGRAM";
        const session = await prisma_1.prisma.pendingSession.create({
            data: {
                type: sessionType,
                telegramId,
                telegramData: JSON.stringify(telegramData),
                verified: true,
                expiresAt: new Date(Date.now() + SESSION_EXPIRY_MS),
            },
        });
        await prisma_1.prisma.auditLog.create({
            data: { actor: `tg:${telegramId}`, action: `auth.unified.telegram.init.${sessionType}`, target: session.id },
        });
        res.json({
            sessionId: session.id,
            authenticated: true,
            telegramUser: {
                id: telegramData.id,
                firstName: telegramData.first_name,
                username: telegramData.username,
            },
            message: "Telegram verified. Please connect your wallet to continue.",
        });
    }
    catch (err) {
        logger_1.logger.error("Unified telegram init error:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});
// ════════════════════════════════════════
// UNIFIED: TELEGRAM - complete (auto-detect login/register)
// ════════════════════════════════════════
router.post("/telegram/complete", authLimiter, async (req, res) => {
    try {
        const parsed = validation_1.unifiedTelegramCompleteSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ error: parsed.error.errors[0].message });
            return;
        }
        const { sessionId, address, signature, message, sponsorCode } = parsed.data;
        const normalizedAddr = address.toLowerCase();
        const session = await prisma_1.prisma.pendingSession.findUnique({ where: { id: sessionId } });
        if (!session || session.expiresAt < new Date()) {
            res.status(400).json({ error: "Session expired. Please start over." });
            return;
        }
        if (!session.verified) {
            res.status(400).json({ error: "Invalid session" });
            return;
        }
        if (session.type !== "LOGIN_TELEGRAM" && session.type !== "REGISTER_TELEGRAM") {
            res.status(400).json({ error: "Invalid session type" });
            return;
        }
        // Verify wallet signature
        const recovered = ethers_1.ethers.verifyMessage(message, signature);
        if (recovered.toLowerCase() !== normalizedAddr) {
            res.status(401).json({ error: "Wallet signature verification failed" });
            return;
        }
        if (session.type === "LOGIN_TELEGRAM") {
            // ── LOGIN ──
            const user = await prisma_1.prisma.user.findFirst({ where: { telegramId: session.telegramId } });
            if (!user) {
                res.status(404).json({ error: "Account not found" });
                return;
            }
            if (user.evmAddress && user.evmAddress !== normalizedAddr) {
                res.status(403).json({ error: "Wallet does not match the registered wallet for this account" });
                return;
            }
            if (user.status !== "CONFIRMED") {
                res.status(403).json({ error: `Account not confirmed. Current status: ${user.status}` });
                return;
            }
            await prisma_1.prisma.pendingSession.delete({ where: { id: sessionId } }).catch(() => { });
            const tokens = await createSession(user.id, req);
            await prisma_1.prisma.auditLog.create({
                data: { actor: `tg:${session.telegramId}`, action: "auth.unified.telegram.login", target: user.id },
            });
            res.json({ ...tokens, user: userResponse(user), authenticated: true });
        }
        else {
            // ── REGISTER ──
            if (!sponsorCode) {
                res.status(400).json({ error: "NEEDS_SPONSOR", message: "Referral code is required for new accounts" });
                return;
            }
            // Check duplicates
            const existingTelegram = await prisma_1.prisma.user.findFirst({ where: { telegramId: session.telegramId } });
            if (existingTelegram) {
                res.status(409).json({ error: "Telegram account already registered" });
                return;
            }
            const existingWallet = await prisma_1.prisma.user.findFirst({ where: { evmAddress: normalizedAddr } });
            if (existingWallet) {
                res.status(409).json({ error: "Wallet already registered to another account" });
                return;
            }
            const sponsor = await validateSponsorCode(sponsorCode);
            if (!sponsor.valid) {
                res.status(400).json({ error: sponsor.error });
                return;
            }
            let user;
            try {
                user = await prisma_1.prisma.user.create({
                    data: {
                        telegramId: session.telegramId,
                        evmAddress: normalizedAddr,
                        authMethod: "TELEGRAM",
                        status: "CONFIRMED",
                        sponsorId: sponsor.sponsorId,
                    },
                });
            }
            catch (createErr) {
                if (isPrismaUniqueError(createErr)) {
                    res.status(409).json({ error: "Telegram account or wallet already registered" });
                    return;
                }
                throw createErr;
            }
            await incrementSponsorCode(sponsor.sponsorCodeRecord);
            await autoCreateSponsorCode(user.id);
            await prisma_1.prisma.pendingSession.delete({ where: { id: sessionId } }).catch(() => { });
            const tokens = await createSession(user.id, req);
            await prisma_1.prisma.auditLog.create({
                data: { actor: `tg:${session.telegramId}`, action: "auth.unified.telegram.register", target: user.id },
            });
            res.status(201).json({ ...tokens, user: userResponse(user), authenticated: true });
        }
    }
    catch (err) {
        logger_1.logger.error("Unified telegram complete error:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});
// ════════════════════════════════════════
// PROFILE: Get user profile
// ════════════════════════════════════════
router.get("/profile", jwtAuth_1.jwtAuth, async (req, res) => {
    try {
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: req.user.userId },
            include: {
                sponsorCodes: { where: { active: true }, select: { code: true, usedCount: true, maxUses: true } },
                sponsor: { select: { id: true, evmAddress: true, email: true } },
            },
        });
        if (!user) {
            res.status(404).json({ error: "User not found" });
            return;
        }
        res.json({
            id: user.id,
            email: user.email,
            evmAddress: user.evmAddress,
            telegramId: user.telegramId,
            authMethod: user.authMethod,
            status: user.status,
            emailVerifiedAt: user.emailVerifiedAt,
            createdAt: user.createdAt,
            lastLoginAt: user.lastLoginAt,
            sponsorCodes: user.sponsorCodes,
            sponsor: user.sponsor ? {
                evmAddress: user.sponsor.evmAddress,
                email: user.sponsor.email,
            } : null,
        });
    }
    catch (err) {
        logger_1.logger.error("Get profile error:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});
// ════════════════════════════════════════
// PROFILE: Link email to existing account
// ════════════════════════════════════════
router.post("/profile/link-email/init", jwtAuth_1.jwtAuth, otpLimiter, async (req, res) => {
    try {
        const parsed = validation_1.linkEmailInitSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ error: parsed.error.errors[0].message });
            return;
        }
        const email = parsed.data.email.toLowerCase();
        const user = await prisma_1.prisma.user.findUnique({ where: { id: req.user.userId } });
        if (!user) {
            res.status(404).json({ error: "User not found" });
            return;
        }
        if (user.email) {
            res.status(409).json({ error: "Account already has an email linked" });
            return;
        }
        // Check if email is taken
        const emailTaken = await prisma_1.prisma.user.findUnique({ where: { email } });
        if (emailTaken) {
            res.status(409).json({ error: "Email already used by another account" });
            return;
        }
        const session = await prisma_1.prisma.pendingSession.create({
            data: {
                type: "LINK_EMAIL",
                email,
                expiresAt: new Date(Date.now() + SESSION_EXPIRY_MS),
            },
        });
        const otp = generateOtp();
        await prisma_1.prisma.otpCode.create({
            data: {
                sessionId: session.id,
                code: otp,
                expiresAt: new Date(Date.now() + OTP_EXPIRY_MS),
            },
        });
        try {
            await (0, email_service_1.sendOtpEmail)(email, otp);
        }
        catch (emailErr) {
            logger_1.logger.error("Failed to send link-email OTP:", emailErr.message);
        }
        res.json({ sessionId: session.id, message: "Verification code sent to your email" });
    }
    catch (err) {
        logger_1.logger.error("Link email init error:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});
router.post("/profile/link-email/verify", jwtAuth_1.jwtAuth, authLimiter, async (req, res) => {
    try {
        const parsed = validation_1.linkEmailVerifySchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ error: parsed.error.errors[0].message });
            return;
        }
        const { sessionId, otp } = parsed.data;
        const session = await prisma_1.prisma.pendingSession.findUnique({
            where: { id: sessionId },
            include: { otpCodes: { orderBy: { createdAt: "desc" }, take: 1 } },
        });
        if (!session || session.expiresAt < new Date() || session.type !== "LINK_EMAIL") {
            res.status(400).json({ error: "Session expired or invalid. Please start over." });
            return;
        }
        const latestOtp = session.otpCodes[0];
        if (!latestOtp || latestOtp.usedAt || latestOtp.expiresAt < new Date()) {
            res.status(400).json({ error: "OTP expired. Request a new one." });
            return;
        }
        if (latestOtp.attempts >= OTP_MAX_ATTEMPTS) {
            res.status(429).json({ error: "Too many failed attempts. Request a new OTP." });
            return;
        }
        // Timing-safe OTP comparison to prevent side-channel attacks
        const otpMatch2 = latestOtp.code.length === otp.length &&
            crypto_1.default.timingSafeEqual(Buffer.from(latestOtp.code), Buffer.from(otp));
        if (!otpMatch2) {
            await prisma_1.prisma.otpCode.update({ where: { id: latestOtp.id }, data: { attempts: { increment: 1 } } });
            res.status(400).json({ error: "Invalid verification code" });
            return;
        }
        // OTP correct — link email
        await prisma_1.prisma.otpCode.update({ where: { id: latestOtp.id }, data: { usedAt: new Date() } });
        const user = await prisma_1.prisma.user.findUnique({ where: { id: req.user.userId } });
        if (!user) {
            res.status(404).json({ error: "User not found" });
            return;
        }
        if (user.email) {
            res.status(409).json({ error: "Account already has an email linked" });
            return;
        }
        // Double check email not taken
        const emailTaken = await prisma_1.prisma.user.findUnique({ where: { email: session.email } });
        if (emailTaken) {
            res.status(409).json({ error: "Email already used by another account" });
            return;
        }
        await prisma_1.prisma.user.update({
            where: { id: user.id },
            data: { email: session.email, emailVerifiedAt: new Date() },
        });
        await prisma_1.prisma.pendingSession.delete({ where: { id: sessionId } }).catch(() => { });
        await prisma_1.prisma.auditLog.create({
            data: { actor: user.id, action: "auth.profile.link_email", target: session.email },
        });
        res.json({ success: true, email: session.email, message: "Email linked successfully" });
    }
    catch (err) {
        logger_1.logger.error("Link email verify error:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});
// ════════════════════════════════════════
// PROFILE: Link Telegram to existing account
// ════════════════════════════════════════
router.post("/profile/link-telegram", jwtAuth_1.jwtAuth, authLimiter, async (req, res) => {
    try {
        const parsed = validation_1.linkTelegramSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ error: parsed.error.errors[0].message });
            return;
        }
        const telegramData = parsed.data;
        if (!(0, telegram_1.verifyTelegramAuth)(telegramData)) {
            res.status(401).json({ error: "Telegram authentication failed" });
            return;
        }
        const telegramId = telegramData.id.toString();
        const user = await prisma_1.prisma.user.findUnique({ where: { id: req.user.userId } });
        if (!user) {
            res.status(404).json({ error: "User not found" });
            return;
        }
        if (user.telegramId) {
            res.status(409).json({ error: "Account already has Telegram linked" });
            return;
        }
        // Check if telegram ID is taken
        const tgTaken = await prisma_1.prisma.user.findFirst({ where: { telegramId } });
        if (tgTaken) {
            res.status(409).json({ error: "Telegram account already used by another user" });
            return;
        }
        await prisma_1.prisma.user.update({
            where: { id: user.id },
            data: { telegramId },
        });
        await prisma_1.prisma.auditLog.create({
            data: { actor: user.id, action: "auth.profile.link_telegram", target: `tg:${telegramId}` },
        });
        res.json({ success: true, telegramId, message: "Telegram linked successfully" });
    }
    catch (err) {
        logger_1.logger.error("Link telegram error:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});
// ════════════════════════════════════════
// TOKEN: Refresh
// ════════════════════════════════════════
router.post("/refresh", async (req, res) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            res.status(400).json({ error: "Refresh token is required" });
            return;
        }
        const session = await prisma_1.prisma.loginSession.findUnique({ where: { refreshToken } });
        if (!session || session.revokedAt || session.expiresAt < new Date()) {
            res.status(401).json({ error: "Invalid or expired refresh token" });
            return;
        }
        const user = await prisma_1.prisma.user.findUnique({ where: { id: session.userId } });
        if (!user) {
            res.status(401).json({ error: "User not found" });
            return;
        }
        const payload = {
            userId: user.id,
            email: user.email || undefined,
            evmAddress: user.evmAddress || undefined,
            telegramId: user.telegramId || undefined,
        };
        const accessToken = (0, jwtAuth_1.signAccessToken)(payload);
        // Rotate refresh token: revoke old, issue new
        const newRefreshToken = (0, jwtAuth_1.signRefreshToken)(payload);
        await prisma_1.prisma.$transaction([
            prisma_1.prisma.loginSession.update({
                where: { id: session.id },
                data: { revokedAt: new Date() },
            }),
            prisma_1.prisma.loginSession.create({
                data: {
                    userId: user.id,
                    refreshToken: newRefreshToken,
                    userAgent: req.headers["user-agent"] || null,
                    ipAddress: req.ip || null,
                    expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS),
                },
            }),
        ]);
        res.json({
            accessToken,
            refreshToken: newRefreshToken,
            user: userResponse(user),
        });
    }
    catch (err) {
        logger_1.logger.error("Refresh token error:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});
// ════════════════════════════════════════
// TOKEN: Logout
// ════════════════════════════════════════
router.post("/logout", async (req, res) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            res.status(400).json({ error: "Refresh token is required" });
            return;
        }
        await prisma_1.prisma.loginSession.updateMany({
            where: { refreshToken, revokedAt: null },
            data: { revokedAt: new Date() },
        });
        res.json({ success: true });
    }
    catch (err) {
        logger_1.logger.error("Logout error:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});
// ════════════════════════════════════════
// INFO: Get Telegram bot config (for frontend widget)
// ════════════════════════════════════════
// Diagnostic: test SMTP connection (admin only, blocked in production)
router.post("/test-smtp", async (req, res) => {
    if (process.env.NODE_ENV === "production") {
        res.status(404).json({ error: "Not found" });
        return;
    }
    const apiKey = req.headers["x-admin-key"];
    if (apiKey !== process.env.ADMIN_API_KEY) {
        res.status(401).json({ error: "Unauthorized" });
        return;
    }
    try {
        const nodemailer = await Promise.resolve().then(() => __importStar(require("nodemailer")));
        const t = nodemailer.default.createTransport({
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT || "587"),
            secure: process.env.SMTP_PORT === "465",
            auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
            connectionTimeout: 10000,
            greetingTimeout: 10000,
        });
        await t.verify();
        // Optionally send a test email
        const { to } = req.body || {};
        if (to) {
            const result = await t.sendMail({
                from: process.env.SMTP_FROM,
                to,
                subject: "BitTON.AI - SMTP Test",
                text: "If you see this, SMTP is working!",
            });
            res.json({ status: "ok", sent: true, messageId: result.messageId });
        }
        else {
            res.json({ status: "ok", verified: true, host: process.env.SMTP_HOST, user: process.env.SMTP_USER });
        }
    }
    catch (err) {
        res.json({ status: "error", message: err.message, code: err.code });
    }
});
router.get("/telegram/config", (_req, res) => {
    res.json({
        botUsername: process.env.TELEGRAM_BOT_USERNAME || "",
        configured: !!(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_BOT_USERNAME),
    });
});
exports.default = router;
//# sourceMappingURL=auth.js.map