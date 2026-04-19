import { describe, expect, it } from "vitest";
import { applyListingSearch } from "./listing-filters";

describe("listing filter integration", () => {
  const items = [
    { varietyName: "Arkansas Black", sellerName: "Orchard One" },
    { varietyName: "Golden Russet", sellerName: "Heritage Grower" },
  ];

  it("filters by variety name", () => {
    expect(applyListingSearch(items, "golden")).toEqual([items[1]]);
  });

  it("filters by seller name", () => {
    expect(applyListingSearch(items, "orchard")).toEqual([items[0]]);
  });
});
