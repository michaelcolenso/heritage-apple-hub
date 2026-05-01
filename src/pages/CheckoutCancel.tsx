import { Link } from "react-router";
import { XCircle } from "lucide-react";
import Footer from "@/sections/Footer";

export default function CheckoutCancel() {
  return (
    <div className="min-h-screen bg-[var(--color-bone)] pt-24">
      <div className="max-w-xl mx-auto px-4 sm:px-6 py-16 text-center">
        <XCircle className="w-12 h-12 text-[var(--color-crimson)] mx-auto mb-4" />
        <h1 className="font-display text-3xl text-[var(--color-bark)] mb-3">
          Payment cancelled
        </h1>
        <p className="text-[var(--color-bark-warm)] mb-6">
          Your cart is still here. We held the inventory while you decide — if you don't complete
          payment within a few minutes, the items will return to general stock.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link
            to="/cart"
            className="inline-flex items-center px-6 py-2.5 rounded-full bg-[var(--color-flesh)] text-white text-sm font-medium hover:bg-[var(--color-flesh)]/90 transition-colors"
          >
            Back to cart
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
