import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router";
import { Search, ShoppingCart, Menu, X, TreePine } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/providers/trpc";

export default function Navigation() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuth();

  const { data: cartItems } = trpc.cart.get.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 100);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const cartCount = cartItems?.reduce((sum, item) => sum + item.quantity, 0) ?? 0;
  const isHome = location.pathname === "/";
  const showTransparent = isHome && !scrolled;

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 h-16 flex items-center transition-all duration-300 ${
          showTransparent
            ? "bg-transparent"
            : "bg-[var(--color-surface-solid)]/90 backdrop-blur-xl border-b border-[var(--color-sage-light)]/40"
        }`}
      >
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <TreePine className={`w-5 h-5 ${showTransparent ? "text-[var(--color-cream)]" : "text-[var(--color-flesh)]"}`} />
            <span
              className={`font-display text-lg tracking-tight ${
                showTransparent ? "text-[var(--color-cream)]" : "text-[var(--color-bark)]"
              }`}
            >
              Heritage Roots
            </span>
          </Link>

          {/* Center nav links - hidden on mobile */}
          <div className="hidden md:flex items-center gap-8">
            {[
              { label: "Varieties", to: "/varieties" },
              { label: "Marketplace", to: "/marketplace" },
              { label: "Sellers", to: "/sellers" },
            ].map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`text-sm font-medium tracking-wide transition-colors hover:text-[var(--color-flesh)] ${
                  showTransparent ? "text-[var(--color-cream)]/90" : "text-[var(--color-bark-warm)]"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-3">
            <Link
              to="/varieties"
              className={`hidden sm:flex p-2 rounded-full transition-colors ${
                showTransparent ? "text-[var(--color-cream)]/80 hover:text-[var(--color-cream)]" : "text-[var(--color-bark-warm)] hover:text-[var(--color-flesh)]"
              }`}
            >
              <Search className="w-[18px] h-[18px]" />
            </Link>

            {isAuthenticated && (
              <Link
                to="/cart"
                className={`relative p-2 rounded-full transition-colors ${
                  showTransparent ? "text-[var(--color-cream)]/80 hover:text-[var(--color-cream)]" : "text-[var(--color-bark-warm)] hover:text-[var(--color-flesh)]"
                }`}
              >
                <ShoppingCart className="w-[18px] h-[18px]" />
                {cartCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[var(--color-flesh)] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </Link>
            )}

            <Link
              to="/dashboard/listings"
              className={`hidden sm:inline-flex items-center px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                showTransparent
                  ? "bg-[var(--color-cream)] text-[var(--color-bark)] hover:bg-[var(--color-cream)]/90"
                  : "bg-[var(--color-flesh)] text-white hover:bg-[var(--color-flesh)]/90"
              }`}
            >
              Sell
            </Link>

            {isAuthenticated ? (
              <div className="hidden sm:flex items-center gap-2">
                <Link
                  to="/dashboard"
                  className={`text-sm font-medium ${
                    showTransparent ? "text-[var(--color-cream)]" : "text-[var(--color-bark-warm)]"
                  }`}
                >
                  {user?.name?.split(" ")[0] ?? "Account"}
                </Link>
                <button
                  onClick={logout}
                  className={`text-xs ${
                    showTransparent ? "text-[var(--color-cream)]/60" : "text-[var(--color-sage)]"
                  } hover:text-[var(--color-flesh)]`}
                >
                  Sign out
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className={`hidden sm:inline-flex text-sm font-medium transition-colors hover:text-[var(--color-flesh)] ${
                  showTransparent ? "text-[var(--color-cream)]" : "text-[var(--color-bark-warm)]"
                }`}
              >
                Sign in
              </Link>
            )}

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className={`md:hidden p-2 rounded-lg ${
                showTransparent ? "text-[var(--color-cream)]" : "text-[var(--color-bark)]"
              }`}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-[var(--color-cream)] pt-16">
          <div className="flex flex-col p-6 gap-4">
            {[
              { label: "Varieties", to: "/varieties" },
              { label: "Marketplace", to: "/marketplace" },
              { label: "Sellers", to: "/sellers" },
              { label: "Sell Scions", to: "/dashboard/listings" },
            ].map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="text-lg font-medium text-[var(--color-bark)] py-2 border-b border-[var(--color-sage-light)]/30"
              >
                {link.label}
              </Link>
            ))}
            {isAuthenticated ? (
              <>
                <Link to="/dashboard" className="text-lg font-medium text-[var(--color-bark)] py-2">
                  Dashboard
                </Link>
                <Link to="/cart" className="text-lg font-medium text-[var(--color-bark)] py-2">
                  Cart {cartCount > 0 && `(${cartCount})`}
                </Link>
                <button onClick={logout} className="text-left text-lg font-medium text-[var(--color-crimson)] py-2">
                  Sign out
                </button>
              </>
            ) : (
              <Link to="/login" className="text-lg font-medium text-[var(--color-flesh)] py-2">
                Sign in
              </Link>
            )}
          </div>
        </div>
      )}
    </>
  );
}
