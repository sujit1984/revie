import type { NextFunction, Request, Response } from "express";
import { verifySessionToken } from "../lib/auth.js";
import { sendError } from "../lib/errors.js";
import { store } from "../services/store.js";

export interface AuthenticatedRequest extends Request {
  auth?: {
    userId: string;
  };
}

export function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    sendError(res, 401, "UNAUTHORIZED", "Missing Bearer token");
    return;
  }

  try {
    const token = header.replace("Bearer ", "");
    const claims = verifySessionToken(token);
    const user = store.getUserById(claims.sub);
    if (!user || user.isSuspended) {
      sendError(res, 403, "FORBIDDEN", "User not allowed");
      return;
    }
    req.auth = { userId: user.id };
    next();
  } catch {
    sendError(res, 401, "UNAUTHORIZED", "Invalid session token");
  }
}
