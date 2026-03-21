"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendOtpEmail = sendOtpEmail;
exports.sendVerificationEmail = sendVerificationEmail;
exports.sendSponsorNotification = sendSponsorNotification;
const nodemailer_1 = __importDefault(require("nodemailer"));
const env_1 = require("../config/env");
const logger_1 = require("../utils/logger");
let cachedTransporter = null;
function getSmtpTransporter() {
    if (!env_1.env.smtpHost)
        return null;
    if (!cachedTransporter) {
        cachedTransporter = nodemailer_1.default.createTransport({
            host: env_1.env.smtpHost,
            port: env_1.env.smtpPort,
            secure: env_1.env.smtpPort === 465,
            auth: { user: env_1.env.smtpUser, pass: env_1.env.smtpPass },
            connectionTimeout: 10000,
            greetingTimeout: 10000,
            socketTimeout: 15000,
        });
    }
    return cachedTransporter;
}
/**
 * Send email via HTTP API (Resend or SendGrid).
 * Works on platforms that block outbound SMTP (e.g. Render free tier).
 */
async function sendViaHttpApi(to, subject, text, html) {
    const provider = env_1.env.emailApiProvider;
    const apiKey = env_1.env.emailApiKey;
    // Use Resend's free onboarding domain unless SMTP_FROM looks like a verified domain
    // On Resend free plan, you MUST use onboarding@resend.dev as the from address
    let from = env_1.env.smtpFrom;
    if (provider === "resend") {
        // Only use custom from if it's explicitly set to a non-default value that doesn't contain bitton.ai
        // (bitton.ai domain needs to be verified on Resend first)
        const isDefaultOrUnverified = !from || from === "noreply@bitton.ai" || from.includes("@bitton.ai");
        if (isDefaultOrUnverified) {
            from = "BitTON.AI <onboarding@resend.dev>";
        }
    }
    if (provider === "resend") {
        const res = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${apiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ from, to, subject, text, html }),
        });
        if (!res.ok) {
            const err = await res.text();
            throw new Error(`Resend API error: ${res.status} ${err}`);
        }
        const data = (await res.json());
        return data.id;
    }
    if (provider === "sendgrid") {
        const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${apiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                personalizations: [{ to: [{ email: to }] }],
                from: { email: env_1.env.smtpUser, name: "BitTON.AI" },
                subject,
                content: [
                    { type: "text/plain", value: text },
                    { type: "text/html", value: html },
                ],
            }),
        });
        if (!res.ok) {
            const err = await res.text();
            throw new Error(`SendGrid API error: ${res.status} ${err}`);
        }
        return res.headers.get("x-message-id") || "sendgrid-" + Date.now();
    }
    throw new Error(`Unknown email provider: ${provider}`);
}
async function sendEmail(to, subject, text, html) {
    // Priority 1: HTTP email API (works on all platforms)
    if (env_1.env.emailApiKey) {
        try {
            const id = await sendViaHttpApi(to, subject, text, html);
            logger_1.logger.info(`Email sent to ${to} via ${env_1.env.emailApiProvider} API, id=${id}`);
            return;
        }
        catch (apiErr) {
            logger_1.logger.error(`Email API (${env_1.env.emailApiProvider}) failed for ${to}: ${apiErr.message}`);
            // Fall through to SMTP if available
            if (!getSmtpTransporter())
                throw apiErr;
            logger_1.logger.info("Falling back to SMTP...");
        }
    }
    // Priority 2: SMTP (works locally, blocked on some hosts)
    const transporter = getSmtpTransporter();
    if (transporter) {
        const result = await transporter.sendMail({
            from: env_1.env.smtpFrom, to, subject, text, html,
        });
        logger_1.logger.info(`Email sent to ${to} via SMTP, messageId=${result.messageId}`);
        return;
    }
    // Priority 3: Dev console fallback
    logger_1.logger.warn(`[DEV EMAIL] No email provider configured! Email NOT actually sent.`);
    logger_1.logger.info(`[DEV EMAIL] To: ${to} | Subject: ${subject}`);
    logger_1.logger.info(`[DEV EMAIL] Body: ${text}`);
}
async function sendOtpEmail(email, otp) {
    try {
        await sendEmail(email, "BitTON.AI - Your verification code", `Your verification code is: ${otp}\n\nThis code expires in 10 minutes.\n\nIf you did not request this code, please ignore this email.`, `<div style="font-family: Arial, sans-serif; max-width: 400px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #333;">BitTON.AI Verification</h2>
        <p>Your verification code is:</p>
        <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; text-align: center; padding: 20px; background: #f5f5f5; border-radius: 8px; margin: 16px 0;">
          ${otp}
        </div>
        <p style="color: #666; font-size: 14px;">This code expires in 10 minutes.</p>
        <p style="color: #999; font-size: 12px;">If you did not request this code, please ignore this email.</p>
      </div>`);
    }
    catch (err) {
        logger_1.logger.error(`Failed to send OTP email to ${email}: ${err.message}`);
        cachedTransporter = null;
        throw err;
    }
}
// Legacy functions kept for backwards compatibility
async function sendVerificationEmail(email, token) {
    const verifyUrl = `${env_1.env.appUrl}/verify-email?token=${token}`;
    await sendEmail(email, "BitTON.AI - Verify your email", `Verify your email by visiting: ${verifyUrl}\n\nThis link expires in 24 hours.`, `<p>Click to verify your email:</p><p><a href="${verifyUrl}">${verifyUrl}</a></p><p>This link expires in 24 hours.</p>`);
}
async function sendSponsorNotification(sponsorEmail, newUserEmail, userId) {
    const confirmUrl = `${env_1.env.appUrl}/sponsor/confirm?userId=${userId}`;
    await sendEmail(sponsorEmail, "BitTON.AI - New referral pending your confirmation", `${newUserEmail} registered with your sponsor code.\n\nConfirm: ${confirmUrl}`, `<p><strong>${newUserEmail}</strong> registered with your sponsor code.</p><p><a href="${confirmUrl}">Confirm referral</a></p>`);
}
//# sourceMappingURL=email.service.js.map