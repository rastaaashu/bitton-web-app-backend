"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminAuth = adminAuth;
const crypto_1 = require("crypto");
const env_1 = require("../config/env");
function adminAuth(req, res, next) {
    const apiKey = req.headers["x-api-key"];
    const apiKeyBuffer = Buffer.from(apiKey || "");
    const expectedBuffer = Buffer.from(env_1.env.adminApiKey);
    if (apiKeyBuffer.length !== expectedBuffer.length || !(0, crypto_1.timingSafeEqual)(apiKeyBuffer, expectedBuffer)) {
        res.status(403).json({ error: "Forbidden" });
        return;
    }
    next();
}
//# sourceMappingURL=adminAuth.js.map