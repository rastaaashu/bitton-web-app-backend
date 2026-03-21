"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.linkWalletSchema = exports.linkEmailSchema = exports.sponsorConfirmSchema = exports.loginEmailSchema = exports.verifyEmailSchema = exports.registerEmailSchema = exports.createSponsorCodeSchema = exports.linkTelegramSchema = exports.linkEmailVerifySchema = exports.linkEmailInitSchema = exports.unifiedTelegramCompleteSchema = exports.unifiedEmailCompleteSchema = exports.unifiedEmailInitSchema = exports.unifiedWalletCompleteSchema = exports.loginTelegramInitSchema = exports.loginCompleteSchema = exports.loginEmailInitSchema = exports.walletVerifySchema = exports.challengeSchema = exports.registerTelegramCompleteSchema = exports.registerTelegramInitSchema = exports.registerEmailCompleteSchema = exports.verifyOtpSchema = exports.registerEmailInitSchema = exports.registerWalletSchema = void 0;
const zod_1 = require("zod");
const evmAddress = zod_1.z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid EVM address");
// ── Registration: Wallet ──
exports.registerWalletSchema = zod_1.z.object({
    address: evmAddress,
    signature: zod_1.z.string().min(1, "Signature is required"),
    message: zod_1.z.string().min(1, "Message is required"),
    sponsorCode: zod_1.z.string().min(1, "Sponsor code is required"),
});
// ── Registration: Email init ──
exports.registerEmailInitSchema = zod_1.z.object({
    email: zod_1.z.string().email("Invalid email address"),
});
// ── Verify OTP (shared for email register + login) ──
exports.verifyOtpSchema = zod_1.z.object({
    sessionId: zod_1.z.string().uuid("Invalid session ID"),
    otp: zod_1.z.string().length(6, "OTP must be 6 digits").regex(/^\d{6}$/, "OTP must be numeric"),
});
// ── Registration: Email complete ──
exports.registerEmailCompleteSchema = zod_1.z.object({
    sessionId: zod_1.z.string().uuid("Invalid session ID"),
    sponsorCode: zod_1.z.string().min(1, "Sponsor code is required"),
    address: evmAddress,
    signature: zod_1.z.string().min(1, "Signature is required"),
    message: zod_1.z.string().min(1, "Message is required"),
});
// ── Registration: Telegram init ──
exports.registerTelegramInitSchema = zod_1.z.object({
    id: zod_1.z.number().int(),
    first_name: zod_1.z.string().optional(),
    last_name: zod_1.z.string().optional(),
    username: zod_1.z.string().optional(),
    photo_url: zod_1.z.string().optional(),
    auth_date: zod_1.z.number().int(),
    hash: zod_1.z.string().min(1, "Hash is required"),
});
// ── Registration: Telegram complete ──
exports.registerTelegramCompleteSchema = zod_1.z.object({
    sessionId: zod_1.z.string().uuid("Invalid session ID"),
    sponsorCode: zod_1.z.string().min(1, "Sponsor code is required"),
    address: evmAddress,
    signature: zod_1.z.string().min(1, "Signature is required"),
    message: zod_1.z.string().min(1, "Message is required"),
});
// ── Login: Wallet challenge ──
exports.challengeSchema = zod_1.z.object({
    address: evmAddress,
});
// ── Login: Wallet verify ──
exports.walletVerifySchema = zod_1.z.object({
    address: evmAddress,
    signature: zod_1.z.string().min(1, "Signature is required"),
    message: zod_1.z.string().min(1, "Message is required"),
});
// ── Login: Email init ──
exports.loginEmailInitSchema = zod_1.z.object({
    email: zod_1.z.string().email("Invalid email address"),
});
// ── Login: Email/Telegram complete ──
exports.loginCompleteSchema = zod_1.z.object({
    sessionId: zod_1.z.string().uuid("Invalid session ID"),
    address: evmAddress,
    signature: zod_1.z.string().min(1, "Signature is required"),
    message: zod_1.z.string().min(1, "Message is required"),
});
// ── Login: Telegram init ──
exports.loginTelegramInitSchema = zod_1.z.object({
    id: zod_1.z.number().int(),
    first_name: zod_1.z.string().optional(),
    last_name: zod_1.z.string().optional(),
    username: zod_1.z.string().optional(),
    photo_url: zod_1.z.string().optional(),
    auth_date: zod_1.z.number().int(),
    hash: zod_1.z.string().min(1, "Hash is required"),
});
// ── Unified auth (auto-detect login/register) ──
exports.unifiedWalletCompleteSchema = zod_1.z.object({
    address: evmAddress,
    signature: zod_1.z.string().min(1, "Signature is required"),
    message: zod_1.z.string().min(1, "Message is required"),
    sponsorCode: zod_1.z.string().optional(),
});
exports.unifiedEmailInitSchema = zod_1.z.object({
    email: zod_1.z.string().email("Invalid email address"),
});
exports.unifiedEmailCompleteSchema = zod_1.z.object({
    sessionId: zod_1.z.string().uuid("Invalid session ID"),
    address: evmAddress,
    signature: zod_1.z.string().min(1, "Signature is required"),
    message: zod_1.z.string().min(1, "Message is required"),
    sponsorCode: zod_1.z.string().optional(),
});
exports.unifiedTelegramCompleteSchema = zod_1.z.object({
    sessionId: zod_1.z.string().uuid("Invalid session ID"),
    address: evmAddress,
    signature: zod_1.z.string().min(1, "Signature is required"),
    message: zod_1.z.string().min(1, "Message is required"),
    sponsorCode: zod_1.z.string().optional(),
});
exports.linkEmailInitSchema = zod_1.z.object({
    email: zod_1.z.string().email("Invalid email address"),
});
exports.linkEmailVerifySchema = zod_1.z.object({
    sessionId: zod_1.z.string().uuid("Invalid session ID"),
    otp: zod_1.z.string().length(6, "OTP must be 6 digits").regex(/^\d{6}$/, "OTP must be numeric"),
});
exports.linkTelegramSchema = zod_1.z.object({
    id: zod_1.z.number().int(),
    first_name: zod_1.z.string().optional(),
    last_name: zod_1.z.string().optional(),
    username: zod_1.z.string().optional(),
    photo_url: zod_1.z.string().optional(),
    auth_date: zod_1.z.number().int(),
    hash: zod_1.z.string().min(1, "Hash is required"),
});
// ── Sponsor codes (admin) ──
exports.createSponsorCodeSchema = zod_1.z.object({
    code: zod_1.z.string().min(3).max(32).regex(/^[a-zA-Z0-9_-]+$/, "Code must be alphanumeric with dashes/underscores"),
    maxUses: zod_1.z.number().int().min(0).optional().default(0),
});
// ── Legacy schemas (kept for backwards compat) ──
exports.registerEmailSchema = zod_1.z.object({
    email: zod_1.z.string().email("Invalid email address"),
    password: zod_1.z.string().min(8, "Password must be at least 8 characters"),
    sponsorCode: zod_1.z.string().optional(),
});
exports.verifyEmailSchema = zod_1.z.object({
    token: zod_1.z.string().min(1, "Token is required"),
});
exports.loginEmailSchema = zod_1.z.object({
    email: zod_1.z.string().email("Invalid email address"),
    password: zod_1.z.string().min(1, "Password is required"),
});
exports.sponsorConfirmSchema = zod_1.z.object({
    userId: zod_1.z.string().uuid("Invalid user ID"),
});
exports.linkEmailSchema = zod_1.z.object({
    email: zod_1.z.string().email("Invalid email address"),
    password: zod_1.z.string().min(8, "Password must be at least 8 characters"),
});
exports.linkWalletSchema = zod_1.z.object({
    address: evmAddress,
    signature: zod_1.z.string().min(1, "Signature is required"),
    message: zod_1.z.string().min(1, "Message is required"),
});
//# sourceMappingURL=validation.js.map