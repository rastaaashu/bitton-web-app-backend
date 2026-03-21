import { Request, Response, NextFunction } from "express";
export interface JwtPayload {
    userId: string;
    email?: string;
    evmAddress?: string;
    telegramId?: string;
}
declare global {
    namespace Express {
        interface Request {
            user?: JwtPayload;
        }
    }
}
export declare function jwtAuth(req: Request, res: Response, next: NextFunction): void;
export declare function signAccessToken(payload: JwtPayload): string;
export declare function signRefreshToken(payload: JwtPayload): string;
//# sourceMappingURL=jwtAuth.d.ts.map