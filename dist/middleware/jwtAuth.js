"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.jwtAuth = jwtAuth;
exports.signAccessToken = signAccessToken;
exports.signRefreshToken = signRefreshToken;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
function jwtAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        res.status(401).json({ error: "Missing or invalid Authorization header" });
        return;
    }
    const token = authHeader.slice(7);
    try {
        const decoded = jsonwebtoken_1.default.verify(token, env_1.env.authSecret, { algorithms: ['HS256'] });
        req.user = decoded;
        next();
    }
    catch {
        res.status(401).json({ error: "Invalid or expired token" });
    }
}
function signAccessToken(payload) {
    const opts = { expiresIn: env_1.env.jwtAccessExpiry, algorithm: 'HS256' };
    return jsonwebtoken_1.default.sign(payload, env_1.env.authSecret, opts);
}
function signRefreshToken(payload) {
    const opts = { expiresIn: env_1.env.jwtRefreshExpiry, algorithm: 'HS256' };
    return jsonwebtoken_1.default.sign(payload, env_1.env.authSecret, opts);
}
//# sourceMappingURL=jwtAuth.js.map