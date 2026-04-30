import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetDb = vi.fn();
const mockSessionsCreate = vi.fn();
const mockAccountsCreate = vi.fn();
const mockAccountLinksCreate = vi.fn();
const mockAccountsRetrieve = vi.fn();

vi.mock("./queries/connection", () => ({
  getDb: () => mockGetDb(),
}));

vi.mock("./lib/stripe", () => ({
  isStripeConfigured: () => true,
  getStripe: () => ({
    checkout: { sessions: { create: mockSessionsCreate } },
    accounts: {
      create: mockAccountsCreate,
      retrieve: mockAccountsRetrieve,
    },
    accountLinks: { create: mockAccountLinksCreate },
  }),
}));

vi.mock("./lib/env", () => ({
  env: {
    appUrl: "http://test.local",
    stripe: { secretKey: "sk_test_x", webhookSecret: "whsec_x" },
    s3: { accessKeyId: "", secretAccessKey: "", bucket: "" },
  },
}));

import { paymentRouter } from "./payment-router";

type OrderRow = {
  id: number;
  buyerId: number;
  sellerId: number;
  varietyName: string;
  quantity: number;
  pricePerStick: string;
  status: string;
};

function buildDbWithOrders(orders: OrderRow[]) {
  return {
    select: () => ({
      from: () => ({
        where: () => Promise.resolve(orders),
      }),
    }),
    update: () => ({
      set: () => ({
        where: () => Promise.resolve(),
      }),
    }),
  };
}

function caller(user: { id: number; email?: string; stripeConnectId?: string | null; stripeChargesEnabled?: boolean; stripePayoutsEnabled?: boolean }) {
  return paymentRouter.createCaller({
    req: new Request("http://localhost/api/trpc/payment"),
    resHeaders: new Headers(),
    user: {
      id: user.id,
      role: "user",
      email: user.email ?? null,
      unionId: "u",
      name: "Test",
      avatar: null,
      hardinessZone: null,
      location: null,
      bio: null,
      isVerifiedSeller: false,
      sellerVerificationRequested: false,
      stripeConnectId: user.stripeConnectId ?? null,
      stripeChargesEnabled: user.stripeChargesEnabled ?? false,
      stripePayoutsEnabled: user.stripePayoutsEnabled ?? false,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignInAt: new Date(),
    },
  });
}

describe("paymentRouter.createCheckoutSession", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates a checkout session with correct line items and metadata", async () => {
    mockGetDb.mockReturnValue(
      buildDbWithOrders([
        {
          id: 1,
          buyerId: 42,
          sellerId: 99,
          varietyName: "Honeycrisp",
          quantity: 3,
          pricePerStick: "12.50",
          status: "pending",
        },
      ]),
    );
    mockSessionsCreate.mockResolvedValue({ url: "https://stripe/checkout/x", id: "cs_x" });

    const result = await caller({ id: 42 }).createCheckoutSession({ orderIds: [1] });

    expect(result).toEqual({ url: "https://stripe/checkout/x", sessionId: "cs_x" });
    const args = mockSessionsCreate.mock.calls[0][0];
    expect(args.line_items[0]).toMatchObject({
      quantity: 3,
      price_data: {
        currency: "usd",
        unit_amount: 1250,
        product_data: { name: "Honeycrisp (scion wood)" },
      },
    });
    expect(args.metadata.orderIds).toBe("1");
    expect(args.payment_intent_data.transfer_group).toBe("order_group_1");
  });

  it("rejects orders that don't belong to the user", async () => {
    mockGetDb.mockReturnValue(buildDbWithOrders([]));

    await expect(
      caller({ id: 42 }).createCheckoutSession({ orderIds: [1] }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("rejects orders that are not pending", async () => {
    mockGetDb.mockReturnValue(
      buildDbWithOrders([
        {
          id: 1,
          buyerId: 42,
          sellerId: 99,
          varietyName: "Honeycrisp",
          quantity: 1,
          pricePerStick: "5.00",
          status: "confirmed",
        },
      ]),
    );

    await expect(
      caller({ id: 42 }).createCheckoutSession({ orderIds: [1] }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});

describe("paymentRouter.createConnectOnboardingLink", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates a Connect account when none exists and returns onboarding link", async () => {
    mockGetDb.mockReturnValue({
      update: () => ({ set: () => ({ where: () => Promise.resolve() }) }),
    });
    mockAccountsCreate.mockResolvedValue({ id: "acct_new" });
    mockAccountLinksCreate.mockResolvedValue({ url: "https://stripe/onboard" });

    const result = await caller({ id: 7, email: "x@y.z" }).createConnectOnboardingLink();

    expect(result.url).toBe("https://stripe/onboard");
    expect(mockAccountsCreate).toHaveBeenCalledOnce();
    expect(mockAccountLinksCreate).toHaveBeenCalledWith(
      expect.objectContaining({ account: "acct_new", type: "account_onboarding" }),
    );
  });

  it("reuses an existing Connect account", async () => {
    mockGetDb.mockReturnValue({
      update: () => ({ set: () => ({ where: () => Promise.resolve() }) }),
    });
    mockAccountLinksCreate.mockResolvedValue({ url: "https://stripe/onboard" });

    await caller({ id: 7, stripeConnectId: "acct_existing" }).createConnectOnboardingLink();

    expect(mockAccountsCreate).not.toHaveBeenCalled();
    expect(mockAccountLinksCreate).toHaveBeenCalledWith(
      expect.objectContaining({ account: "acct_existing" }),
    );
  });
});
