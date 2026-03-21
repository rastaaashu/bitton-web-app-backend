import { z } from "zod";
export declare const registerWalletSchema: z.ZodObject<{
    address: z.ZodString;
    signature: z.ZodString;
    message: z.ZodString;
    sponsorCode: z.ZodString;
}, "strip", z.ZodTypeAny, {
    address: string;
    signature: string;
    message: string;
    sponsorCode: string;
}, {
    address: string;
    signature: string;
    message: string;
    sponsorCode: string;
}>;
export declare const registerEmailInitSchema: z.ZodObject<{
    email: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
}, {
    email: string;
}>;
export declare const verifyOtpSchema: z.ZodObject<{
    sessionId: z.ZodString;
    otp: z.ZodString;
}, "strip", z.ZodTypeAny, {
    sessionId: string;
    otp: string;
}, {
    sessionId: string;
    otp: string;
}>;
export declare const registerEmailCompleteSchema: z.ZodObject<{
    sessionId: z.ZodString;
    sponsorCode: z.ZodString;
    address: z.ZodString;
    signature: z.ZodString;
    message: z.ZodString;
}, "strip", z.ZodTypeAny, {
    address: string;
    signature: string;
    message: string;
    sponsorCode: string;
    sessionId: string;
}, {
    address: string;
    signature: string;
    message: string;
    sponsorCode: string;
    sessionId: string;
}>;
export declare const registerTelegramInitSchema: z.ZodObject<{
    id: z.ZodNumber;
    first_name: z.ZodOptional<z.ZodString>;
    last_name: z.ZodOptional<z.ZodString>;
    username: z.ZodOptional<z.ZodString>;
    photo_url: z.ZodOptional<z.ZodString>;
    auth_date: z.ZodNumber;
    hash: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: number;
    hash: string;
    auth_date: number;
    first_name?: string | undefined;
    last_name?: string | undefined;
    username?: string | undefined;
    photo_url?: string | undefined;
}, {
    id: number;
    hash: string;
    auth_date: number;
    first_name?: string | undefined;
    last_name?: string | undefined;
    username?: string | undefined;
    photo_url?: string | undefined;
}>;
export declare const registerTelegramCompleteSchema: z.ZodObject<{
    sessionId: z.ZodString;
    sponsorCode: z.ZodString;
    address: z.ZodString;
    signature: z.ZodString;
    message: z.ZodString;
}, "strip", z.ZodTypeAny, {
    address: string;
    signature: string;
    message: string;
    sponsorCode: string;
    sessionId: string;
}, {
    address: string;
    signature: string;
    message: string;
    sponsorCode: string;
    sessionId: string;
}>;
export declare const challengeSchema: z.ZodObject<{
    address: z.ZodString;
}, "strip", z.ZodTypeAny, {
    address: string;
}, {
    address: string;
}>;
export declare const walletVerifySchema: z.ZodObject<{
    address: z.ZodString;
    signature: z.ZodString;
    message: z.ZodString;
}, "strip", z.ZodTypeAny, {
    address: string;
    signature: string;
    message: string;
}, {
    address: string;
    signature: string;
    message: string;
}>;
export declare const loginEmailInitSchema: z.ZodObject<{
    email: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
}, {
    email: string;
}>;
export declare const loginCompleteSchema: z.ZodObject<{
    sessionId: z.ZodString;
    address: z.ZodString;
    signature: z.ZodString;
    message: z.ZodString;
}, "strip", z.ZodTypeAny, {
    address: string;
    signature: string;
    message: string;
    sessionId: string;
}, {
    address: string;
    signature: string;
    message: string;
    sessionId: string;
}>;
export declare const loginTelegramInitSchema: z.ZodObject<{
    id: z.ZodNumber;
    first_name: z.ZodOptional<z.ZodString>;
    last_name: z.ZodOptional<z.ZodString>;
    username: z.ZodOptional<z.ZodString>;
    photo_url: z.ZodOptional<z.ZodString>;
    auth_date: z.ZodNumber;
    hash: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: number;
    hash: string;
    auth_date: number;
    first_name?: string | undefined;
    last_name?: string | undefined;
    username?: string | undefined;
    photo_url?: string | undefined;
}, {
    id: number;
    hash: string;
    auth_date: number;
    first_name?: string | undefined;
    last_name?: string | undefined;
    username?: string | undefined;
    photo_url?: string | undefined;
}>;
export declare const unifiedWalletCompleteSchema: z.ZodObject<{
    address: z.ZodString;
    signature: z.ZodString;
    message: z.ZodString;
    sponsorCode: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    address: string;
    signature: string;
    message: string;
    sponsorCode?: string | undefined;
}, {
    address: string;
    signature: string;
    message: string;
    sponsorCode?: string | undefined;
}>;
export declare const unifiedEmailInitSchema: z.ZodObject<{
    email: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
}, {
    email: string;
}>;
export declare const unifiedEmailCompleteSchema: z.ZodObject<{
    sessionId: z.ZodString;
    address: z.ZodString;
    signature: z.ZodString;
    message: z.ZodString;
    sponsorCode: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    address: string;
    signature: string;
    message: string;
    sessionId: string;
    sponsorCode?: string | undefined;
}, {
    address: string;
    signature: string;
    message: string;
    sessionId: string;
    sponsorCode?: string | undefined;
}>;
export declare const unifiedTelegramCompleteSchema: z.ZodObject<{
    sessionId: z.ZodString;
    address: z.ZodString;
    signature: z.ZodString;
    message: z.ZodString;
    sponsorCode: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    address: string;
    signature: string;
    message: string;
    sessionId: string;
    sponsorCode?: string | undefined;
}, {
    address: string;
    signature: string;
    message: string;
    sessionId: string;
    sponsorCode?: string | undefined;
}>;
export declare const linkEmailInitSchema: z.ZodObject<{
    email: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
}, {
    email: string;
}>;
export declare const linkEmailVerifySchema: z.ZodObject<{
    sessionId: z.ZodString;
    otp: z.ZodString;
}, "strip", z.ZodTypeAny, {
    sessionId: string;
    otp: string;
}, {
    sessionId: string;
    otp: string;
}>;
export declare const linkTelegramSchema: z.ZodObject<{
    id: z.ZodNumber;
    first_name: z.ZodOptional<z.ZodString>;
    last_name: z.ZodOptional<z.ZodString>;
    username: z.ZodOptional<z.ZodString>;
    photo_url: z.ZodOptional<z.ZodString>;
    auth_date: z.ZodNumber;
    hash: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: number;
    hash: string;
    auth_date: number;
    first_name?: string | undefined;
    last_name?: string | undefined;
    username?: string | undefined;
    photo_url?: string | undefined;
}, {
    id: number;
    hash: string;
    auth_date: number;
    first_name?: string | undefined;
    last_name?: string | undefined;
    username?: string | undefined;
    photo_url?: string | undefined;
}>;
export declare const createSponsorCodeSchema: z.ZodObject<{
    code: z.ZodString;
    maxUses: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
}, "strip", z.ZodTypeAny, {
    code: string;
    maxUses: number;
}, {
    code: string;
    maxUses?: number | undefined;
}>;
export declare const registerEmailSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
    sponsorCode: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
    sponsorCode?: string | undefined;
}, {
    email: string;
    password: string;
    sponsorCode?: string | undefined;
}>;
export declare const verifyEmailSchema: z.ZodObject<{
    token: z.ZodString;
}, "strip", z.ZodTypeAny, {
    token: string;
}, {
    token: string;
}>;
export declare const loginEmailSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
}, {
    email: string;
    password: string;
}>;
export declare const sponsorConfirmSchema: z.ZodObject<{
    userId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    userId: string;
}, {
    userId: string;
}>;
export declare const linkEmailSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
}, {
    email: string;
    password: string;
}>;
export declare const linkWalletSchema: z.ZodObject<{
    address: z.ZodString;
    signature: z.ZodString;
    message: z.ZodString;
}, "strip", z.ZodTypeAny, {
    address: string;
    signature: string;
    message: string;
}, {
    address: string;
    signature: string;
    message: string;
}>;
//# sourceMappingURL=validation.d.ts.map