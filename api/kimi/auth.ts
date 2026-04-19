import type { Context } from "hono";
import { deleteCookie, setCookie } from "hono/cookie";
import * as jose from "jose";
import * as cookie from "cookie";
import { env } from "../lib/env";
import { getSessionCookieOptions } from "../lib/cookies";
import { Session } from "@contracts/constants";
import { Errors } from "@contracts/errors";
import { signSessionToken, verifySessionToken } from "./session";
import { users as kimiUsers } from "./platform";
import { findUserByUnionId, upsertUser } from "../queries/users";
import type { TokenResponse } from "./types";

const OAUTH_STATE_COOKIE = "oauth_state_nonce";
const OAUTH_REDIRECT_COOKIE = "oauth_redirect_target";

function createCorrelationId() {
  return crypto.randomUUID();
}

function isAllowedLocalRedirectTarget(value: string | undefined): value is string {
  if (!value) {
    return false;
  }
  if (!value.startsWith("/") || value.startsWith("//")) {
    return false;
  }
  try {
    const parsed = new URL(value, "http://localhost");
    return (
      parsed.origin === "http://localhost" &&
      (parsed.protocol === "http:" || parsed.protocol === "https:")
    );
  } catch {
    return false;
  }
}

async function exchangeAuthCode(
  code: string,
  redirectUri: string,
): Promise<TokenResponse> {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    client_id: env.appId,
    redirect_uri: redirectUri,
    client_secret: env.appSecret,
  });

  const resp = await fetch(`${env.kimiAuthUrl}/api/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Token exchange failed (${resp.status}): ${text}`);
  }

  return resp.json() as Promise<TokenResponse>;
}

const jwks = jose.createRemoteJWKSet(
  new URL(`${env.kimiAuthUrl}/api/.well-known/jwks.json`),
);

async function verifyAccessToken(
  accessToken: string,
): Promise<{ userId: string; clientId: string }> {
  const { payload } = await jose.jwtVerify(accessToken, jwks);
  const userId = payload.user_id as string;
  const clientId = payload.client_id as string;
  if (!userId) {
    throw new Error("user_id missing from access token");
  }
  return { userId, clientId };
}

export async function authenticateRequest(headers: Headers) {
  const cookies = cookie.parse(headers.get("cookie") || "");
  const token = cookies[Session.cookieName];
  if (!token) {
    console.warn("[auth] No session cookie found in request.");
    throw Errors.forbidden("Invalid authentication token.");
  }
  const claim = await verifySessionToken(token);
  if (!claim) {
    throw Errors.forbidden("Invalid authentication token.");
  }
  const user = await findUserByUnionId(claim.unionId);
  if (!user) {
    throw Errors.forbidden("User not found. Please re-login.");
  }
  return user;
}

export function createOAuthCallbackHandler() {
  return async (c: Context) => {
    const correlationId = createCorrelationId();
    const code = c.req.query("code");
    const state = c.req.query("state");
    const error = c.req.query("error");
    const errorDescription = c.req.query("error_description");
    const reqCookies = cookie.parse(c.req.header("cookie") || "");
    const storedState = reqCookies[OAUTH_STATE_COOKIE];
    const redirectTarget = reqCookies[OAUTH_REDIRECT_COOKIE];

    if (error) {
      if (error === "access_denied") {
        return c.redirect("/", 302);
      }
      return c.json(
        { error, error_description: errorDescription, correlationId },
        400,
      );
    }

    if (!state) {
      console.warn("[OAuth] Missing state", { correlationId });
      return c.json(
        {
          error: "invalid_state",
          message: "Missing OAuth state parameter.",
          correlationId,
        },
        400,
      );
    }

    if (!storedState) {
      console.warn("[OAuth] Missing stored state nonce", { correlationId });
      return c.json(
        {
          error: "expired_state",
          message: "OAuth state is expired or unavailable.",
          correlationId,
        },
        400,
      );
    }

    if (state !== storedState) {
      deleteCookie(c, OAUTH_STATE_COOKIE, { path: "/" });
      deleteCookie(c, OAUTH_REDIRECT_COOKIE, { path: "/" });
      console.warn("[OAuth] State mismatch", { correlationId });
      return c.json(
        {
          error: "invalid_state",
          message: "OAuth state does not match session nonce.",
          correlationId,
        },
        400,
      );
    }

    deleteCookie(c, OAUTH_STATE_COOKIE, { path: "/" });

    if (!code) {
      console.warn("[OAuth] Missing code", { correlationId });
      return c.json(
        {
          error: "invalid_request",
          message: "Missing OAuth authorization code.",
          correlationId,
        },
        400,
      );
    }

    if (redirectTarget && !isAllowedLocalRedirectTarget(redirectTarget)) {
      deleteCookie(c, OAUTH_REDIRECT_COOKIE, { path: "/" });
      console.warn("[OAuth] Invalid redirect target", {
        correlationId,
        redirectTarget,
      });
      return c.json(
        {
          error: "invalid_redirect_target",
          message: "Redirect target must be a local path.",
          correlationId,
        },
        400,
      );
    }

    try {
      const redirectUri = `${new URL(c.req.url).origin}/api/oauth/callback`;
      const tokenResp = await exchangeAuthCode(code, redirectUri);
      const { userId } = await verifyAccessToken(tokenResp.access_token);
      const userProfile = await kimiUsers.getProfile(tokenResp.access_token);
      if (!userProfile) {
        throw new Error("Failed to fetch user profile from Kimi Open");
      }

      await upsertUser({
        unionId: userId,
        name: userProfile.name,
        avatar: userProfile.avatar_url,
        lastSignInAt: new Date(),
      });

      const token = await signSessionToken({
        unionId: userId,
        clientId: env.appId,
      });

      const cookieOpts = getSessionCookieOptions(c.req.raw.headers);
      setCookie(c, Session.cookieName, token, {
        ...cookieOpts,
        maxAge: Session.maxAgeMs / 1000,
      });

      const safeRedirectTarget = isAllowedLocalRedirectTarget(redirectTarget)
        ? redirectTarget
        : "/";
      deleteCookie(c, OAUTH_REDIRECT_COOKIE, { path: "/" });

      return c.redirect(safeRedirectTarget, 302);
    } catch (error) {
      console.error("[OAuth] Callback failed", { correlationId, error });
      return c.json(
        {
          error: "oauth_callback_failed",
          message: "OAuth callback failed.",
          correlationId,
        },
        500,
      );
    }
  };
}

export { exchangeAuthCode, verifyAccessToken };
