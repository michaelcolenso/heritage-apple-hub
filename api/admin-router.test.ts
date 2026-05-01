import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetDb = vi.fn();

vi.mock("./queries/connection", () => ({
  getDb: () => mockGetDb(),
}));

vi.mock("./lib/stripe", () => ({
  isStripeConfigured: () => false,
  getStripe: () => ({ refunds: { create: vi.fn() } }),
}));

import { adminRouter } from "./admin-router";

function caller(role: "admin" | "user") {
  return adminRouter.createCaller({
    req: new Request("http://localhost/api/trpc/admin"),
    resHeaders: new Headers(),
    user: {
      id: 1,
      role,
      email: null,
      unionId: "u",
      name: "Test",
      avatar: null,
      hardinessZone: null,
      location: null,
      bio: null,
      isVerifiedSeller: false,
      sellerVerificationRequested: false,
      stripeConnectId: null,
      stripeChargesEnabled: false,
      stripePayoutsEnabled: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignInAt: new Date(),
    },
  });
}

describe("adminRouter authorization", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rejects non-admin callers with FORBIDDEN", async () => {
    await expect(
      caller("user").listSellers({ pendingOnly: false }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});

describe("adminRouter.varietyCreate", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rejects duplicate slugs with CONFLICT", async () => {
    mockGetDb.mockReturnValue({
      select: () => ({
        from: () => ({
          where: () => ({
            limit: () => Promise.resolve([{ id: 5, slug: "honeycrisp" }]),
          }),
        }),
      }),
      insert: () => ({ values: () => Promise.resolve([{ insertId: 0 }]) }),
    });

    await expect(
      caller("admin").varietyCreate({
        name: "Honeycrisp",
        slug: "honeycrisp",
      }),
    ).rejects.toMatchObject({ code: "CONFLICT" });
  });

  it("creates a new variety when slug is free", async () => {
    mockGetDb.mockReturnValue({
      select: () => ({
        from: () => ({
          where: () => ({
            limit: () => Promise.resolve([]),
          }),
        }),
      }),
      insert: () => ({
        values: () => Promise.resolve([{ insertId: 99 }]),
      }),
    });

    const result = await caller("admin").varietyCreate({
      name: "Pink Pearl",
      slug: "pink-pearl",
    });

    expect(result).toEqual({ id: 99, success: true });
  });
});

describe("adminRouter.setSellerVerified", () => {
  beforeEach(() => vi.clearAllMocks());

  it("flips the verified flag", async () => {
    let updateCalledWith: unknown = null;
    mockGetDb.mockReturnValue({
      update: () => ({
        set: (data: unknown) => {
          updateCalledWith = data;
          return { where: () => Promise.resolve() };
        },
      }),
    });

    const result = await caller("admin").setSellerVerified({ userId: 7, verified: true });

    expect(result).toEqual({ success: true });
    expect(updateCalledWith).toMatchObject({ isVerifiedSeller: true });
  });
});
