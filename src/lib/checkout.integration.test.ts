import { describe, expect, it } from "vitest";
import { calculateCheckoutTotals, createCheckoutPayload } from "./checkout";

describe("checkout integration", () => {
  it("calculates subtotal, platform fee, and total", () => {
    const totals = calculateCheckoutTotals([
      { id: 1, quantity: 2, pricePerStick: 4 },
      { id: 2, quantity: 1, pricePerStick: 10 },
    ]);

    expect(totals.subtotal).toBe(18);
    expect(totals.platformFee).toBeCloseTo(2.7, 5);
    expect(totals.total).toBeCloseTo(20.7, 5);
  });

  it("builds checkout payload from selected line items", () => {
    expect(createCheckoutPayload("  123 Main St ", [{ id: 4, quantity: 1, pricePerStick: 3 }])).toEqual({
      shippingAddress: "123 Main St",
      cartItemIds: [4],
    });
  });
});
