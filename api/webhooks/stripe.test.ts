import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetDb = vi.fn();
const mockConstructEvent = vi.fn();
const mockTransferCreate = vi.fn();

vi.mock("../queries/connection", () => ({
  getDb: () => mockGetDb(),
}));

vi.mock("../lib/stripe", () => ({
  isStripeConfigured: () => true,
  getStripe: () => ({
    webhooks: { constructEvent: mockConstructEvent },
    transfers: { create: mockTransferCreate },
  }),
}));

vi.mock("../lib/env", () => ({
  env: {
    appUrl: "http://test.local",
    stripe: { secretKey: "sk_test_x", webhookSecret: "whsec_x" },
    s3: { accessKeyId: "", secretAccessKey: "", bucket: "" },
  },
}));

import { handleStripeWebhook } from "./stripe";

type DbConfig = {
  ordersForUpdate?: unknown[];
  ordersForCancel?: unknown[];
  user?: unknown;
};

function buildDb(config: DbConfig) {
  const updates: { table: string; data: unknown }[] = [];
  let selectCallCount = 0;
  return {
    updates,
    db: {
      update: () => ({
        set: (data: unknown) => {
          updates.push({ table: "set", data });
          return { where: () => Promise.resolve() };
        },
      }),
      select: () => ({
        from: () => ({
          where: () => {
            selectCallCount += 1;
            if (config.ordersForUpdate && selectCallCount === 1) {
              return Promise.resolve(config.ordersForUpdate);
            }
            if (config.user) {
              return { limit: () => Promise.resolve([config.user]) };
            }
            return Promise.resolve([]);
          },
        }),
      }),
      delete: () => ({ where: () => Promise.resolve() }),
    },
  };
}

function buildContext(rawBody: string, signature: string | null = "sig_x") {
  return {
    req: {
      header: (name: string) => (name.toLowerCase() === "stripe-signature" ? signature ?? undefined : undefined),
      text: () => Promise.resolve(rawBody),
    },
    json: (body: unknown, status?: number) => new Response(JSON.stringify(body), { status: status ?? 200 }),
  } as unknown as Parameters<typeof handleStripeWebhook>[0];
}

describe("handleStripeWebhook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 when signature header is missing", async () => {
    const res = await handleStripeWebhook(buildContext("{}", null));
    expect(res.status).toBe(400);
  });

  it("returns 400 when signature verification fails", async () => {
    mockConstructEvent.mockImplementation(() => {
      throw new Error("bad sig");
    });
    const res = await handleStripeWebhook(buildContext("{}"));
    expect(res.status).toBe(400);
  });

  it("marks orders confirmed and creates transfers on payment_intent.succeeded", async () => {
    const { db } = buildDb({
      ordersForUpdate: [
        {
          id: 1,
          buyerId: 7,
          sellerId: 9,
          listingId: 100,
          quantity: 2,
          sellerPayout: "20.00",
          status: "confirmed",
        },
      ],
      user: { stripeConnectId: "acct_seller" },
    });
    mockGetDb.mockReturnValue(db);
    mockConstructEvent.mockReturnValue({
      type: "payment_intent.succeeded",
      data: {
        object: {
          id: "pi_x",
          metadata: { orderIds: "1" },
        },
      },
    });

    const res = await handleStripeWebhook(buildContext("{}"));
    expect(res.status).toBe(200);
    expect(mockTransferCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 2000,
        currency: "usd",
        destination: "acct_seller",
      }),
      expect.objectContaining({
        idempotencyKey: "transfer_order_1_pi_x",
      }),
    );
  });

  it("propagates transfer failures so Stripe retries", async () => {
    const { db } = buildDb({
      ordersForUpdate: [
        {
          id: 1,
          buyerId: 7,
          sellerId: 9,
          listingId: 100,
          quantity: 2,
          sellerPayout: "20.00",
          status: "confirmed",
        },
      ],
      user: { stripeConnectId: "acct_seller" },
    });
    mockGetDb.mockReturnValue(db);
    mockConstructEvent.mockReturnValue({
      type: "payment_intent.succeeded",
      data: { object: { id: "pi_x", metadata: { orderIds: "1" } } },
    });
    mockTransferCreate.mockRejectedValueOnce(new Error("stripe transient"));

    await expect(handleStripeWebhook(buildContext("{}"))).rejects.toThrow("stripe transient");
  });

  it("throws when seller has no Connect destination so Stripe retries", async () => {
    const { db } = buildDb({
      ordersForUpdate: [
        {
          id: 1,
          buyerId: 7,
          sellerId: 9,
          listingId: 100,
          quantity: 2,
          sellerPayout: "20.00",
          status: "confirmed",
        },
      ],
      user: { stripeConnectId: null },
    });
    mockGetDb.mockReturnValue(db);
    mockConstructEvent.mockReturnValue({
      type: "payment_intent.succeeded",
      data: { object: { id: "pi_x", metadata: { orderIds: "1" } } },
    });

    await expect(handleStripeWebhook(buildContext("{}"))).rejects.toThrow(/stripeConnectId/);
    expect(mockTransferCreate).not.toHaveBeenCalled();
  });

  it("cancels and restocks pending orders on payment_intent.payment_failed", async () => {
    const { db, updates } = buildDb({
      ordersForUpdate: [
        {
          id: 1,
          buyerId: 7,
          sellerId: 9,
          listingId: 100,
          quantity: 4,
          sellerPayout: "10.00",
          status: "pending",
        },
      ],
    });
    mockGetDb.mockReturnValue(db);
    mockConstructEvent.mockReturnValue({
      type: "payment_intent.payment_failed",
      data: {
        object: {
          id: "pi_x",
          metadata: { orderIds: "1" },
        },
      },
    });

    const res = await handleStripeWebhook(buildContext("{}"));
    expect(res.status).toBe(200);
    expect(updates.some((u) => JSON.stringify(u.data).includes('"cancelled"'))).toBe(true);
    expect(mockTransferCreate).not.toHaveBeenCalled();
  });
});
