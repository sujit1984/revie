import { Router } from "express";
import { authSessionSchema } from "@revie/validation";
import { signSessionToken } from "../lib/auth.js";
import { sendError } from "../lib/errors.js";
import { env } from "../config/env.js";
import { getProviderMetadata, buildAuthorizeUrl, encodeState, decodeState, getProfileFromCode, getProfileFromIdToken } from "../services/socialAuth.js";
import { store } from "../services/store.js";
import type { Provider } from "../types/domain.js";

const authRouter = Router();

function inferBaseUrl(requestOrigin?: string): string {
  return requestOrigin || env.apiBaseUrl;
}

function testModeProfile(provider: Provider, idToken?: string): {
  provider: Provider;
  providerUserId: string;
  email: string;
  displayName: string;
} | null {
  if (!env.allowTestAuth || env.nodeEnv === "production" || !idToken?.startsWith("test-token:")) {
    return null;
  }

  const suffix = idToken.replace("test-token:", "").trim() || "ci-user";
  const safeSuffix = suffix.toLowerCase().replace(/[^a-z0-9_-]/g, "-");

  return {
    provider,
    providerUserId: `test-${safeSuffix}`,
    email: `${safeSuffix}@example.test`,
    displayName: `Test ${safeSuffix}`
  };
}

authRouter.get("/providers", (req, res) => {
  const origin = req.headers.origin as string | undefined;
  return res.status(200).json({ providers: getProviderMetadata(inferBaseUrl(origin)) });
});

authRouter.get("/:provider/start", (req, res) => {
  const provider = req.params.provider as Provider;
  if (!["google", "apple", "linkedin"].includes(provider)) {
    return sendError(res, 400, "VALIDATION_ERROR", "Unsupported provider");
  }

  const callbackUri = (req.query.callbackUri as string | undefined) ?? `${env.webBaseUrl}/auth/callback`;
  const apiCallbackUri = `${inferBaseUrl(req.headers.origin as string | undefined)}/auth/${provider}/callback`;
  const state = encodeState({ callbackUri });
  const redirect = buildAuthorizeUrl({
    provider,
    state,
    redirectUri: apiCallbackUri
  });
  return res.redirect(302, redirect);
});

authRouter.get("/:provider/callback", async (req, res) => {
  const provider = req.params.provider as Provider;
  const code = req.query.code as string | undefined;
  const state = req.query.state as string | undefined;

  if (!code || !state) {
    return sendError(res, 400, "VALIDATION_ERROR", "Missing code or state query parameter");
  }

  try {
    const decoded = decodeState(state);
    const apiCallbackUri = `${inferBaseUrl(req.headers.origin as string | undefined)}/auth/${provider}/callback`;
    const profile = await getProfileFromCode({ provider, code, redirectUri: apiCallbackUri });
    const user = store.upsertUser(profile);
    const accessToken = signSessionToken(user);
    const redirectUrl = new URL(decoded.callbackUri);
    redirectUrl.searchParams.set("accessToken", accessToken);
    redirectUrl.searchParams.set("userId", user.id);
    return res.redirect(302, redirectUrl.toString());
  } catch (error) {
    return sendError(res, 401, "AUTH_FAILED", "Unable to authenticate user", {
      reason: (error as Error).message
    });
  }
});

authRouter.post("/session", async (req, res) => {
  const parsed = authSessionSchema.safeParse(req.body);
  if (!parsed.success) {
    return sendError(res, 400, "VALIDATION_ERROR", "Invalid auth payload", parsed.error.flatten());
  }

  const payload = parsed.data;

  try {
    const profile =
      testModeProfile(payload.provider, payload.idToken) ??
      (payload.idToken
        ? await getProfileFromIdToken(payload.provider, payload.idToken)
        : await getProfileFromCode({
            provider: payload.provider,
            code: payload.code!,
            redirectUri: payload.redirectUri ?? `${env.webBaseUrl}/auth/callback`
          }));

    const user = store.upsertUser(profile);
    const accessToken = signSessionToken(user);

    return res.status(200).json({
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl
      }
    });
  } catch (error) {
    return sendError(res, 401, "AUTH_FAILED", "Unable to verify provider token", {
      reason: (error as Error).message
    });
  }
});

export { authRouter };
