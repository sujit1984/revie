import jwt from "jsonwebtoken";
import type { Provider, UserRecord } from "../types/domain.js";
import { env } from "../config/env.js";

export interface SessionClaims {
  sub: string;
  provider: Provider;
  email: string;
  name: string;
}

export function signSessionToken(user: UserRecord): string {
  const payload: SessionClaims = {
    sub: user.id,
    provider: user.provider,
    email: user.email,
    name: user.displayName
  };

  return jwt.sign(payload, env.jwtSecret, { expiresIn: "7d" });
}

export function verifySessionToken(token: string): SessionClaims {
  return jwt.verify(token, env.jwtSecret) as SessionClaims;
}
