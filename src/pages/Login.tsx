import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const OAUTH_STATE_COOKIE = "oauth_state_nonce";
const OAUTH_REDIRECT_COOKIE = "oauth_redirect_target";
const OAUTH_COOKIE_MAX_AGE_SECONDS = 10 * 60;

function isAllowedLocalPath(path: string): boolean {
  if (!path) {
    return false;
  }
  if (!path.startsWith("/")) {
    return false;
  }
  if (path.startsWith("//")) {
    return false;
  }
  try {
    const parsed = new URL(path, window.location.origin);
    return parsed.origin === window.location.origin;
  } catch {
    return false;
  }
}

function createNonce() {
  const bytes = new Uint8Array(32);
  window.crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join(
    "",
  );
}

function setShortLivedCookie(name: string, value: string) {
  const secureFlag = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = [
    `${name}=${encodeURIComponent(value)}`,
    "Path=/",
    "SameSite=Lax",
    `Max-Age=${OAUTH_COOKIE_MAX_AGE_SECONDS}`,
    secureFlag,
  ].join("; ");
}

function getIntendedRedirectPath() {
  const searchParams = new URLSearchParams(window.location.search);
  const requestedPath = searchParams.get("redirect");
  if (requestedPath && isAllowedLocalPath(requestedPath)) {
    return requestedPath;
  }
  return "/";
}

function getOAuthUrl() {
  const kimiAuthUrl = import.meta.env.VITE_KIMI_AUTH_URL;
  const appID = import.meta.env.VITE_APP_ID;
  const redirectUri = `${window.location.origin}/api/oauth/callback`;
  const state = createNonce();

  setShortLivedCookie(OAUTH_STATE_COOKIE, state);
  setShortLivedCookie(OAUTH_REDIRECT_COOKIE, getIntendedRedirectPath());

  const url = new URL(`${kimiAuthUrl}/api/oauth/authorize`);
  url.searchParams.set("client_id", appID);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "profile");
  url.searchParams.set("state", state);

  return url.toString();
}

export default function Login() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle>Welcome</CardTitle>
        </CardHeader>
        <CardContent>
          <Button
            className="w-full"
            size="lg"
            onClick={() => {
              window.location.href = getOAuthUrl();
            }}
          >
            Sign in with Kimi
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
