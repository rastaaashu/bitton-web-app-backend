export interface TelegramLoginData {
    id: number;
    first_name?: string;
    last_name?: string;
    username?: string;
    photo_url?: string;
    auth_date: number;
    hash: string;
}
/**
 * Verify Telegram Login Widget data using HMAC-SHA256.
 * See: https://core.telegram.org/widgets/login#checking-authorization
 */
export declare function verifyTelegramAuth(data: TelegramLoginData): boolean;
//# sourceMappingURL=telegram.d.ts.map