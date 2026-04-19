import { describe, expect, it } from "vitest";
import { decodeOAuthState } from "../kimi/auth-helpers";
import { toSessionPayload } from "../kimi/session-helpers";
import { canTransitionOrderStatus } from "./order-status";

describe("auth/session/order helpers", () => {
  it("decodes valid oauth state", () => {
    expect(decodeOAuthState("aHR0cHM6Ly9leGFtcGxlLmNvbS9jYWxsYmFjaw==")).toBe("https://example.com/callback");
  });

  it("returns null for invalid session payload", () => {
    expect(toSessionPayload({ unionId: 42, clientId: "abc" })).toBeNull();
  });

  it("accepts valid order transitions only", () => {
    expect(canTransitionOrderStatus("confirmed", "shipped")).toBe(true);
    expect(canTransitionOrderStatus("delivered", "confirmed")).toBe(false);
  });
});
