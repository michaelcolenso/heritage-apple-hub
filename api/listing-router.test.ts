import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetDb = vi.fn();

vi.mock("./queries/connection", () => ({
  getDb: () => mockGetDb(),
}));

import { listingRouter } from "./listing-router";

type ListingRow = {
  id: number;
  quantity: number;
  pricePerStick: string;
  description: string | null;
  shippingZones: string | null;
  status: string | null;
  harvestDate: Date | null;
  createdAt: Date;
  varietyName: string;
  varietySlug: string;
  varietyImage: string | null;
  sellerName: string | null;
  sellerId: number;
  sellerLocation: string | null;
  sellerZone: number | null;
  sellerVerified: boolean | null;
};

function makeRow(id: number, shippingZones: string | null = "1,2,3"): ListingRow {
  return {
    id,
    quantity: 10,
    pricePerStick: "12.50",
    description: null,
    shippingZones,
    status: "active",
    harvestDate: null,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    varietyName: "Honeycrisp",
    varietySlug: "honeycrisp",
    varietyImage: null,
    sellerName: "Seller",
    sellerId: 1,
    sellerLocation: "NY",
    sellerZone: 6,
    sellerVerified: true,
  };
}

function createMockDb(dataRows: ListingRow[], totalCount: number) {
  const calls: {
    dataWhere?: unknown;
    countWhere?: unknown;
    limit?: number;
    offset?: number;
  } = {};

  const db = {
    select(selection: Record<string, unknown>) {
      const keys = Object.keys(selection);
      const mode = keys.includes("count") ? "count" : keys.includes("id") && keys.length === 1 ? "subquery" : "data";

      return {
        from() {
          if (mode === "subquery") {
            return {
              where() {
                return {
                  getSQL() {
                    return { queryChunks: [] };
                  },
                };
              },
            };
          }

          if (mode === "count") {
            return {
              where(whereClause: unknown) {
                calls.countWhere = whereClause;
                return Promise.resolve([{ count: totalCount }]);
              },
            };
          }

          return {
            innerJoin() {
              return this;
            },
            where(whereClause: unknown) {
              calls.dataWhere = whereClause;
              return this;
            },
            orderBy() {
              return this;
            },
            limit(value: number) {
              calls.limit = value;
              return this;
            },
            offset(value: number) {
              calls.offset = value;
              return Promise.resolve(dataRows.slice(value, value + (calls.limit ?? dataRows.length)));
            },
          };
        },
      };
    },
  };

  return { db, calls };
}

function createCaller() {
  return listingRouter.createCaller({
    req: new Request("http://localhost/api/trpc/listing.list"),
    resHeaders: new Headers(),
  });
}

describe("listingRouter.list", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("supports zone-only filtering at DB level without in-memory shipping zone filtering", async () => {
    const { db, calls } = createMockDb([makeRow(1, "9")], 1);
    mockGetDb.mockReturnValue(db);

    const result = await createCaller().list({ page: 1, limit: 12, zone: 5, sortBy: "newest" });

    expect(result.items).toHaveLength(1);
    expect(result.items[0].shippingZones).toBe("9");
    expect(calls.dataWhere).toBe(calls.countWhere);
    expect(result.total).toBe(1);
    expect(result.totalPages).toBe(1);
  });

  it("applies combined filters and keeps count query where clause exactly aligned", async () => {
    const { db, calls } = createMockDb([makeRow(10), makeRow(11)], 2);
    mockGetDb.mockReturnValue(db);

    const result = await createCaller().list({
      page: 1,
      limit: 12,
      varietyId: 7,
      sellerId: 3,
      zone: 6,
      minPrice: 5,
      maxPrice: 20,
      sortBy: "price_desc",
    });

    expect(result.items).toHaveLength(2);
    expect(calls.dataWhere).toBeDefined();
    expect(calls.dataWhere).toBe(calls.countWhere);
    expect(result.total).toBe(2);
    expect(result.totalPages).toBe(1);
  });

  it("handles page boundaries correctly", async () => {
    const rows = [makeRow(1), makeRow(2), makeRow(3), makeRow(4), makeRow(5)];
    const { db } = createMockDb(rows, 5);
    mockGetDb.mockReturnValue(db);

    const result = await createCaller().list({ page: 3, limit: 2, sortBy: "newest" });

    expect(result.items.map((item) => item.id)).toEqual([5]);
    expect(result.page).toBe(3);
  });

  it("returns correct total and totalPages", async () => {
    const rows = [makeRow(1), makeRow(2), makeRow(3)];
    const { db } = createMockDb(rows, 7);
    mockGetDb.mockReturnValue(db);

    const result = await createCaller().list({ page: 1, limit: 3, sortBy: "newest" });

    expect(result.total).toBe(7);
    expect(result.totalPages).toBe(3);
  });
});
