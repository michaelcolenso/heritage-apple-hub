import { useEffect } from "react";
import { Link } from "react-router";
import { CheckCircle2 } from "lucide-react";
import { trpc } from "@/providers/trpc";
import Footer from "@/sections/Footer";

export default function CheckoutSuccess() {
  const utils = trpc.useUtils();
  const { data: orders } = trpc.order.list.useQuery(undefined, {
    refetchInterval: (query) => {
      const data = query.state.data;
      const stillPending = Array.isArray(data) && data.some((o) => o.status === "pending");
      return stillPending ? 2000 : false;
    },
  });

  useEffect(() => {
    utils.cart.get.invalidate();
  }, [utils]);

  const recent = orders?.slice(0, 5) ?? [];
  const stillPending = recent.some((o) => o.status === "pending");

  return (
    <div className="min-h-screen bg-[var(--color-bone)] pt-24">
      <div className="max-w-xl mx-auto px-4 sm:px-6 py-16 text-center">
        <CheckCircle2 className="w-12 h-12 text-[var(--color-sage)] mx-auto mb-4" />
        <h1 className="font-display text-3xl text-[var(--color-bark)] mb-3">
          Payment received
        </h1>
        <p className="text-[var(--color-bark-warm)] mb-6">
          {stillPending
            ? "We're confirming your payment with Stripe. This page will update in a moment."
            : "Your scion order is confirmed. The seller has been notified and will ship shortly."}
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link
            to="/orders"
            className="inline-flex items-center px-6 py-2.5 rounded-full bg-[var(--color-flesh)] text-white text-sm font-medium hover:bg-[var(--color-flesh)]/90 transition-colors"
          >
            View your orders
          </Link>
          <Link
            to="/varieties"
            className="inline-flex items-center px-6 py-2.5 rounded-full border border-[var(--color-sage-light)] text-[var(--color-bark-warm)] text-sm font-medium hover:bg-[var(--color-sage-light)]/20 transition-colors"
          >
            Keep browsing
          </Link>
        </div>
      </div>
      <Footer />
    </div>
  );
}
