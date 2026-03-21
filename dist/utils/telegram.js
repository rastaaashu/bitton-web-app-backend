"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyTelegramAuth = verifyTelegramAuth;
const crypto_1 = __importDefault(require("crypto"));
const env_1 = require("../config/env");
/**
 * Verify Telegram Login Widget data using HMAC-SHA256.
 * See: https://core.telegram.org/widgets/login#checking-authorization
 */
function verifyTelegramAuth(data) {
    if (!env_1.env.telegramBotToken) {
        return false;
    }
    const { hash, ...rest } = data;
    // Build data-check-string: sort keys alphabetically, join with \n
    const checkString = Object.keys(rest)
        .sort()
        .map((key) => `${key}=${rest[key]}`)
        .join("\n");
    // Secret key = SHA256(bot_token)
    const secretKey = crypto_1.default
        .createHash("sha256")
        .update(env_1.env.telegramBotToken)
        .digest();
    // HMAC-SHA256 of the data-check-string
    const hmac = crypto_1.default
        .createHmac("sha256", secretKey)
        .update(checkString)
        .digest("hex");
    // Timing-safe comparison to prevent side-channel attacks
    const hmacBuf = Buffer.from(hmac, "hex");
    const hashBuf = Buffer.from(hash, "hex");
    if (hmacBuf.length !== hashBuf.length || !crypto_1.default.timingSafeEqual(hmacBuf, hashBuf)) {
        return false;
    }
    // Check auth_date is not too old (allow 1 hour)
    const now = Math.floor(Date.now() / 1000);
    if (now - data.auth_date > 3600) {
        return false;
    }
    return true;
}
//# sourceMappingURL=telegram.js.map