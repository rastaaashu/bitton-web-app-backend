import { Request, Response, NextFunction } from "express";
import { timingSafeEqual } from "crypto";
import { env } from "../config/env";

export function adminAuth(req: Request, res: Response, next: NextFunction): void {
  const apiKey = req.headers["x-api-key"];
  const apiKeyBuffer = Buffer.from((apiKey as string) || "");
  const expectedBuffer = Buffer.from(env.adminApiKey);
  if (apiKeyBuffer.length !== expectedBuffer.length || !timingSafeEqual(apiKeyBuffer, expectedBuffer)) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  next();
}

