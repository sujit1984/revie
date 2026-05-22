import { OAuth2Client } from "google-auth-library";
import * as appleSigninAuth from "apple-signin-auth";
import { decodeJwt, jwtVerify, createRemoteJWKSet } from "jose";
import type { Provider } from "../types/domain.js";
import { env } from "../config/env.js";

interface Profile {
  provider: Provider;
  providerUserId: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
}

const googleClient = new OAuth2Client(env.googleClientId || undefined);

function providerConfig(provider: Provider): { authUrl: string; tokenUrl: string; scopes: string[] } {
  if (provider === "google") {
    return {
      authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
      tokenUrl: "https://oauth2.googleapis.com/token",
      scopes: ["openid", "email", "profile"]
    };
  }

  if (provider === "apple") {
    return {
      authUrl: "https://appleid.apple.com/auth/authorize",
      tokenUrl: "https://appleid.apple.com/auth/token",
      scopes: ["name", "email"]
    };
  }

  return {
    authUrl: "https://www.linkedin.com/oauth/v2/authorization",
    tokenUrl: "https://www.linkedin.com/oauth/v2/accessToken",
    scopes: ["openid", "profile", "email"]
  };
}

export function getProviderMetadata(baseUrl: string): Array<{ provider: Provider; authorizeUrl: string }> {
  return (["google", "apple", "linkedin"] as Provider[]).map((provider) => ({
    provider,
    authorizeUrl: `${baseUrl}/auth/${provider}/start`
  }));
}

function buildClientSecretForApple(): string {
  if (!env.appleClientId || !env.appleTeamId || !env.appleKeyId || !env.applePrivateKey) {
    throw new Error("APPLE_CONFIG_MISSING");
  }

  return appleSigninAuth.getClientSecret({
    clientID: env.appleClientId,
    teamID: env.appleTeamId,
    privateKey: env.applePrivateKey.replace(/\\n/g, "\n"),
    keyIdentifier: env.appleKeyId
  });
}

export function buildAuthorizeUrl(params: {
  provider: Provider;
  state: string;
  redirectUri: string;
}): string {
  const cfg = providerConfig(params.provider);
  const url = new URL(cfg.authUrl);

  if (params.provider === "google") {
    url.searchParams.set("client_id", env.googleClientId);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("redirect_uri", params.redirectUri);
    url.searchParams.set("scope", cfg.scopes.join(" "));
    url.searchParams.set("state", params.state);
    url.searchParams.set("access_type", "offline");
    url.searchParams.set("prompt", "consent");
  } else if (params.provider === "apple") {
    url.searchParams.set("client_id", env.appleClientId);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("redirect_uri", params.redirectUri);
    url.searchParams.set("scope", cfg.scopes.join(" "));
    url.searchParams.set("state", params.state);
    url.searchParams.set("response_mode", "query");
  } else {
    url.searchParams.set("client_id", env.linkedinClientId);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("redirect_uri", params.redirectUri);
    url.searchParams.set("scope", cfg.scopes.join(" "));
    url.searchParams.set("state", params.state);
  }

  return url.toString();
}

async function exchangeCodeForTokens(params: {
  provider: Provider;
  code: string;
  redirectUri: string;
}): Promise<Record<string, string>> {
  const cfg = providerConfig(params.provider);
  const body = new URLSearchParams();
  body.set("grant_type", "authorization_code");
  body.set("code", params.code);
  body.set("redirect_uri", params.redirectUri);

  if (params.provider === "google") {
    body.set("client_id", env.googleClientId);
    body.set("client_secret", env.googleClientSecret);
  } else if (params.provider === "apple") {
    body.set("client_id", env.appleClientId);
    body.set("client_secret", buildClientSecretForApple());
  } else {
    body.set("client_id", env.linkedinClientId);
    body.set("client_secret", env.linkedinClientSecret);
  }

  const response = await fetch(cfg.tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: body.toString()
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`TOKEN_EXCHANGE_FAILED:${details}`);
  }

  return (await response.json()) as Record<string, string>;
}

async function verifyGoogleIdToken(idToken: string): Promise<Profile> {
  const ticket = await googleClient.verifyIdToken({
    idToken,
    audience: env.googleClientId
  });
  const payload = ticket.getPayload();
  if (!payload?.sub || !payload.email) {
    throw new Error("GOOGLE_ID_TOKEN_INVALID");
  }

  return {
    provider: "google",
    providerUserId: payload.sub,
    email: payload.email,
    displayName: payload.name ?? payload.email,
    avatarUrl: payload.picture
  };
}

async function verifyAppleIdToken(idToken: string): Promise<Profile> {
  const claims = await appleSigninAuth.verifyIdToken(idToken, {
    audience: env.appleClientId,
    ignoreExpiration: false
  });

  const sub = (claims.sub ?? "") as string;
  const email = (claims.email ?? "") as string;
  if (!sub || !email) {
    throw new Error("APPLE_ID_TOKEN_INVALID");
  }

  return {
    provider: "apple",
    providerUserId: sub,
    email,
    displayName: email.split("@")[0]
  };
}

async function verifyLinkedInIdToken(idToken: string): Promise<Profile> {
  const jwks = createRemoteJWKSet(new URL("https://www.linkedin.com/oauth/openid/jwks"));
  const verified = await jwtVerify(idToken, jwks, {
    audience: env.linkedinClientId,
    issuer: "https://www.linkedin.com"
  });
  const claims = verified.payload;

  const sub = String(claims.sub ?? "");
  const email = String(claims.email ?? "");
  if (!sub || !email) {
    throw new Error("LINKEDIN_ID_TOKEN_INVALID");
  }

  return {
    provider: "linkedin",
    providerUserId: sub,
    email,
    displayName: String(claims.name ?? email)
  };
}

export async function getProfileFromIdToken(provider: Provider, idToken: string): Promise<Profile> {
  if (provider === "google") {
    return verifyGoogleIdToken(idToken);
  }
  if (provider === "apple") {
    return verifyAppleIdToken(idToken);
  }
  return verifyLinkedInIdToken(idToken);
}

export async function getProfileFromCode(params: {
  provider: Provider;
  code: string;
  redirectUri: string;
}): Promise<Profile> {
  const tokens = await exchangeCodeForTokens(params);

  const idToken = tokens.id_token;
  if (idToken) {
    return getProfileFromIdToken(params.provider, idToken);
  }

  if (params.provider === "google") {
    const accessToken = tokens.access_token;
    const resp = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    if (!resp.ok) {
      throw new Error("GOOGLE_USERINFO_FAILED");
    }
    const profile = (await resp.json()) as { sub: string; email: string; name?: string; picture?: string };
    return {
      provider: "google",
      providerUserId: profile.sub,
      email: profile.email,
      displayName: profile.name ?? profile.email,
      avatarUrl: profile.picture
    };
  }

  if (params.provider === "linkedin") {
    const accessToken = tokens.access_token;
    const resp = await fetch("https://api.linkedin.com/v2/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    if (!resp.ok) {
      throw new Error("LINKEDIN_USERINFO_FAILED");
    }
    const profile = (await resp.json()) as { sub: string; email: string; name?: string; picture?: string };
    return {
      provider: "linkedin",
      providerUserId: profile.sub,
      email: profile.email,
      displayName: profile.name ?? profile.email,
      avatarUrl: profile.picture
    };
  }

  throw new Error("APPLE_ID_TOKEN_REQUIRED");
}

export function decodeState(state: string): { callbackUri: string } {
  const raw = Buffer.from(state, "base64url").toString("utf-8");
  return JSON.parse(raw) as { callbackUri: string };
}

export function encodeState(payload: { callbackUri: string }): string {
  return Buffer.from(JSON.stringify(payload), "utf-8").toString("base64url");
}

export function decodeUntrustedIdToken(idToken: string): Record<string, unknown> {
  return decodeJwt(idToken) as Record<string, unknown>;
}
