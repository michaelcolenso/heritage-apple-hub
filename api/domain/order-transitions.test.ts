import { describe, expect, it } from "vitest";
import { validateOrderStatusTransition } from "./order-transitions";

describe("validateOrderStatusTransition", () => {
  it("allows seller confirmed -> shipped", () => {
    expect(
      validateOrderStatusTransition({
        actorRole: "seller",
        fromStatus: "confirmed",
        toStatus: "shipped",
      }),
    ).toEqual({ ok: true });
  });

  it("allows buyer shipped -> delivered", () => {
    expect(
      validateOrderStatusTransition({
        actorRole: "buyer",
        fromStatus: "shipped",
        toStatus: "delivered",
      }),
    ).toEqual({ ok: true });
  });

  it("allows seller and buyer cancelling pending/confirmed", () => {
    expect(
      validateOrderStatusTransition({
        actorRole: "seller",
        fromStatus: "pending",
        toStatus: "cancelled",
      }),
    ).toEqual({ ok: true });

    expect(
      validateOrderStatusTransition({
        actorRole: "buyer",
        fromStatus: "confirmed",
        toStatus: "cancelled",
      }),
    ).toEqual({ ok: true });
  });

  it("allows admin disputed resolution", () => {
    expect(
      validateOrderStatusTransition({
        actorRole: "admin",
        fromStatus: "disputed",
        toStatus: "confirmed",
      }),
    ).toEqual({ ok: true });

    expect(
      validateOrderStatusTransition({
        actorRole: "admin",
        fromStatus: "disputed",
        toStatus: "cancelled",
      }),
    ).toEqual({ ok: true });
  });

  it("rejects no-op transitions", () => {
    expect(
      validateOrderStatusTransition({
        actorRole: "seller",
        fromStatus: "confirmed",
        toStatus: "confirmed",
      }),
    ).toMatchObject({ ok: false, code: "BAD_REQUEST" });
  });

  it("rejects disputed resolution by non-admin", () => {
    expect(
      validateOrderStatusTransition({
        actorRole: "seller",
        fromStatus: "disputed",
        toStatus: "cancelled",
      }),
    ).toMatchObject({ ok: false, code: "FORBIDDEN" });
  });

  it("rejects illegal role transitions", () => {
    expect(
      validateOrderStatusTransition({
        actorRole: "buyer",
        fromStatus: "confirmed",
        toStatus: "shipped",
      }),
    ).toMatchObject({ ok: false, code: "BAD_REQUEST" });

    expect(
      validateOrderStatusTransition({
        actorRole: "seller",
        fromStatus: "shipped",
        toStatus: "delivered",
      }),
    ).toMatchObject({ ok: false, code: "BAD_REQUEST" });
  });
});
