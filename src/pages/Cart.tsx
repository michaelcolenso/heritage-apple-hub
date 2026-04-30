import { useState } from "react";
import { Link } from "react-router";
import { trpc } from "@/providers/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import Footer from "@/sections/Footer";

export default function Cart() {
  const utils = trpc.useUtils();

  const { data: cartItems, isLoading } = trpc.cart.get.useQuery();
  const [shippingAddress, setShippingAddress] = useState("");
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const updateItem = trpc.cart.update.useMutation({
    onSuccess: () => utils.cart.get.invalidate(),
  });
  const removeItem = trpc.cart.remove.useMutation({
    onSuccess: () => {
      utils.cart.get.invalidate();
      toast.success("Item removed from cart");
    },
  });
  const createOrder = trpc.order.create.useMutation();
  const startCheckout = trpc.payment.createCheckoutSession.useMutation();

  const subtotal = cartItems?.reduce((sum, item) => sum + Number(item.pricePerStick) * item.quantity, 0) ?? 0;
  const platformFee = subtotal * 0.15;
  const total = subtotal + platformFee;

  const handleCheckout = async () => {
    if (!shippingAddress.trim()) {
      toast.error("Please enter your shipping address");
      return;
    }
    if (!cartItems || cartItems.length === 0) return;
    setIsCheckingOut(true);
    try {
      const { orderIds } = await createOrder.mutateAsync({
        shippingAddress,
        cartItemIds: cartItems.map((item) => item.id),
      });
      utils.cart.get.invalidate();
      utils.order.list.invalidate();
      const { url } = await startCheckout.mutateAsync({ orderIds });
      if (!url) {
        toast.error("Could not start payment. Please contact support.");
        setIsCheckingOut(false);
        return;
      }
      window.location.assign(url);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Checkout failed";
      toast.error(message);
      setIsCheckingOut(false);
    }
  };

  const isPending = isCheckingOut || createOrder.isPending || startCheckout.isPending;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--color-bone)] pt-24 flex items-center justify-center">
        <p className="text-[var(--color-bark-warm)]">Loading cart...</p>
      </div>
    );
  }

  if (!cartItems || cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-[var(--color-bone)] pt-24">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-16 text-center">
          <ShoppingBag className="w-12 h-12 text-[var(--color-sage)] mx-auto mb-4" />
          <h2 className="font-display text-2xl text-[var(--color-bark)] mb-2">Your cart is empty</h2>
          <p className="text-[var(--color-bark-warm)] mb-6">
            Browse varieties and add scion wood to your cart.
          </p>
          <Link
            to="/varieties"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[var(--color-flesh)] text-white text-sm font-medium hover:bg-[var(--color-flesh)]/90 transition-colors"
          >
            Explore Varieties
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-bone)] pt-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <Link
          to="/varieties"
          className="inline-flex items-center gap-1.5 text-sm text-[var(--color-bark-warm)] hover:text-[var(--color-flesh)] transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Continue browsing
        </Link>

        <h1 className="font-display text-3xl text-[var(--color-bark)] mb-8">Your Cart</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart items */}
          <div className="lg:col-span-2 space-y-4">
            {cartItems.map((item) => (
              <div
                key={item.id}
                className="bg-[var(--color-surface-solid)] rounded-2xl p-5 flex items-center gap-4"
              >
                <div className="flex-1 min-w-0">
                  <Link
                    to={`/varieties/${item.varietySlug}`}
                    className="font-display text-lg text-[var(--color-bark)] hover:text-[var(--color-flesh)] transition-colors"
                  >
                    {item.varietyName}
                  </Link>
                  <p className="text-sm text-[var(--color-bark-warm)]">
                    from {item.sellerName}
                  </p>
                  <p className="font-mono text-sm text-[var(--color-flesh)] mt-1">
                    ${item.pricePerStick}/stick
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateItem.mutate({ cartItemId: item.id, quantity: Math.max(1, item.quantity - 1) })}
                    className="w-8 h-8 rounded-full border border-[var(--color-sage-light)] flex items-center justify-center text-[var(--color-bark-warm)] hover:bg-[var(--color-sage-light)]/20"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-8 text-center font-mono text-sm">{item.quantity}</span>
                  <button
                    onClick={() => {
                      if (item.quantity < item.available) {
                        updateItem.mutate({ cartItemId: item.id, quantity: item.quantity + 1 });
                      } else {
                        toast.info(`Only ${item.available} sticks available`);
                      }
                    }}
                    className="w-8 h-8 rounded-full border border-[var(--color-sage-light)] flex items-center justify-center text-[var(--color-bark-warm)] hover:bg-[var(--color-sage-light)]/20"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="text-right min-w-[60px]">
                  <p className="font-mono text-sm font-medium">
                    ${(Number(item.pricePerStick) * item.quantity).toFixed(2)}
                  </p>
                </div>

                <button
                  onClick={() => removeItem.mutate({ cartItemId: item.id })}
                  className="p-2 text-[var(--color-sage)] hover:text-[var(--color-crimson)] transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Checkout summary */}
          <div className="bg-[var(--color-surface-solid)] rounded-2xl p-6 h-fit">
            <h3 className="font-body text-lg font-semibold text-[var(--color-bark)] mb-4">
              Order Summary
            </h3>

            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-[var(--color-bark-warm)]">Subtotal</span>
                <span className="font-mono text-[var(--color-bark)]">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[var(--color-bark-warm)]">Platform fee (15%)</span>
                <span className="font-mono text-[var(--color-bark)]">${platformFee.toFixed(2)}</span>
              </div>
              <div className="border-t border-[var(--color-sage-light)]/30 pt-2 flex justify-between">
                <span className="font-medium text-[var(--color-bark)]">Total</span>
                <span className="font-mono font-medium text-[var(--color-bark)]">${total.toFixed(2)}</span>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-[var(--color-bark)] mb-1.5">
                Shipping Address
              </label>
              <Input
                placeholder="Enter your full address..."
                value={shippingAddress}
                onChange={(e) => setShippingAddress(e.target.value)}
                className="bg-[var(--color-bone)] border-[var(--color-sage-light)]"
              />
            </div>

            <Button
              onClick={handleCheckout}
              disabled={isPending}
              className="w-full bg-[var(--color-flesh)] hover:bg-[var(--color-flesh)]/90 text-white rounded-full py-3"
            >
              {isPending ? "Redirecting to Stripe..." : `Checkout — $${total.toFixed(2)}`}
            </Button>

            <p className="text-xs text-[var(--color-sage)] text-center mt-3">
              15% platform fee supports heritage preservation
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
