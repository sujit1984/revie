import type { NextFunction, Response } from "express";
import { sendError } from "../lib/errors.js";
import type { AuthenticatedRequest } from "./authenticate.js";

export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const adminIds = (process.env.ADMIN_USER_IDS ?? "").split(",").map((value) => value.trim()).filter(Boolean);
  if (!req.auth?.userId || !adminIds.includes(req.auth.userId)) {
    sendError(res, 403, "FORBIDDEN", "Admin privileges required");
    return;
  }
  next();
}
