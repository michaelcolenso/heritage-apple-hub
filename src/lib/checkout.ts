export type CheckoutLine = { id: number; quantity: number; pricePerStick: number };

export function calculateCheckoutTotals(lines: CheckoutLine[]) {
  const subtotal = lines.reduce((sum, line) => sum + line.quantity * line.pricePerStick, 0);
  const platformFee = subtotal * 0.15;

  return {
    subtotal,
    platformFee,
    total: subtotal + platformFee,
  };
}

export function createCheckoutPayload(shippingAddress: string, lines: CheckoutLine[]) {
  const cleanedAddress = shippingAddress.trim();

  if (!cleanedAddress) {
    throw new Error("Please enter your shipping address");
  }

  if (lines.length === 0) {
    throw new Error("No cart items selected");
  }

  return {
    shippingAddress: cleanedAddress,
    cartItemIds: lines.map((line) => line.id),
  };
}
