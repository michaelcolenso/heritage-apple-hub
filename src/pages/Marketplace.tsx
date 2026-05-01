import { useState } from "react";
import { Link, useSearchParams } from "react-router";
import { trpc } from "@/providers/trpc";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, MapPin, ShoppingCart, SlidersHorizontal, X } from "lucide-react";
import { toast } from "sonner";
import Footer from "@/sections/Footer";

export default function Marketplace() {
  const [search, setSearch] = useState("");
  const [zone, setZone] = useState<number | undefined>();
  const [page, setPage] = useState(1);
  const [searchParams, setSearchParams] = useSearchParams();
  const utils = trpc.useUtils();

  const sellerParam = searchParams.get("seller");
  const sellerId = sellerParam && /^\d+$/.test(sellerParam) ? Number(sellerParam) : undefined;

  const { data, isLoading } = trpc.listing.list.useQuery({
    page,
    limit: 12,
    zone,
    sellerId,
    sortBy: "newest",
  });

  const sellerName = sellerId
    ? data?.items.find((item) => item.sellerId === sellerId)?.sellerName
    : undefined;

  const clearSeller = () => {
    const next = new URLSearchParams(searchParams);
    next.delete("seller");
    setSearchParams(next);
    setPage(1);
  };

  const addToCart = trpc.cart.add.useMutation({
    onSuccess: () => {
      utils.cart.get.invalidate();
      toast.success("Added to cart");
    },
  });

  const filteredItems = search
    ? data?.items.filter((item) =>
        item.varietyName.toLowerCase().includes(search.toLowerCase()) ||
        item.sellerName?.toLowerCase().includes(search.toLowerCase())
      )
    : data?.items;

  return (
    <div className="min-h-screen bg-[var(--color-bone)] pt-16">
      <div className="w-full py-12 sm:py-16" style={{ background: "linear-gradient(135deg, #261d17, #4a3b2f, #7e8f7e)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <h1 className="font-display text-4xl sm:text-5xl text-[var(--color-cream)] mb-3">
            Marketplace
          </h1>
          <p className="text-[var(--color-cream)]/80 text-base max-w-lg">
            Fresh scion wood from verified heritage growers. February–April season.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {sellerId && (
          <div className="mb-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--color-sage)]/10 text-[var(--color-sage)] text-xs font-mono">
            <span>Seller: {sellerName ?? `#${sellerId}`}</span>
            <button onClick={clearSeller} aria-label="Clear seller filter" className="hover:text-[var(--color-flesh)]">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-8">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-sage)]" />
            <Input
              placeholder="Search listings..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10 bg-[var(--color-surface-solid)] border-[var(--color-sage-light)]"
            />
          </div>
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-[var(--color-sage)]" />
            {[3, 4, 5, 6, 7, 8, 9].map((z) => (
              <button
                key={z}
                onClick={() => { setZone(zone === z ? undefined : z); setPage(1); }}
                className={`w-9 h-9 rounded-full text-xs font-medium transition-colors ${
                  zone === z
                    ? "bg-[var(--color-flesh)] text-white"
                    : "bg-[var(--color-surface-solid)] text-[var(--color-bark-warm)] hover:bg-[var(--color-sage-light)]/30"
                }`}
              >
                {z}
              </button>
            ))}
            <span className="text-xs text-[var(--color-sage)] ml-1">Zone</span>
          </div>
        </div>

        {/* Listings grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-64 rounded-2xl" />
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredItems?.map((listing) => {
                const listingImages = Array.isArray(listing.images) ? (listing.images as string[]) : [];
                const heroImage = listingImages[0] ?? listing.varietyImage ?? null;
                return (
                <div
                  key={listing.id}
                  className="bg-[var(--color-surface-solid)] rounded-2xl p-5 hover:-translate-y-1 hover:shadow-lg transition-all duration-300"
                >
                  {heroImage && (
                    <div className="aspect-[4/3] -mx-5 -mt-5 mb-4 overflow-hidden rounded-t-2xl bg-[var(--color-sage-light)]/20">
                      <img src={heroImage} alt={listing.varietyName} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-full bg-[var(--color-sage-light)]/30 flex items-center justify-center">
                      <span className="text-xs font-mono text-[var(--color-sage)]">
                        {listing.sellerName?.charAt(0) ?? "?"}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[var(--color-bark)]">
                        {listing.sellerName}
                      </p>
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-[var(--color-sage)]" />
                        <span className="text-[10px] font-mono text-[var(--color-sage)] uppercase">
                          Zone {listing.sellerZone}
                        </span>
                      </div>
                    </div>
                    {listing.sellerVerified && (
                      <span className="ml-auto text-[10px] font-mono bg-[var(--color-sage)]/10 text-[var(--color-sage)] px-2 py-0.5 rounded-full">
                        Verified
                      </span>
                    )}
                  </div>

                  <Link to={`/varieties/${listing.varietySlug}`}>
                    <h3 className="font-display text-xl text-[var(--color-bark)] hover:text-[var(--color-flesh)] transition-colors mb-1">
                      {listing.varietyName}
                    </h3>
                  </Link>

                  <p className="text-sm text-[var(--color-bark-warm)] mb-3 line-clamp-2">
                    {listing.description}
                  </p>

                  <div className="flex items-center justify-between pt-3 border-t border-[var(--color-sage-light)]/30">
                    <div>
                      <p className="font-mono text-lg font-medium text-[var(--color-bark)]">
                        ${listing.pricePerStick}
                      </p>
                      <p className="text-xs text-[var(--color-bark-warm)]">
                        {listing.quantity} sticks available
                      </p>
                    </div>
                    <Button
                      onClick={() => addToCart.mutate({ listingId: listing.id, quantity: 1 })}
                      disabled={addToCart.isPending}
                      size="sm"
                      className="bg-[var(--color-flesh)] hover:bg-[var(--color-flesh)]/90 text-white rounded-full"
                    >
                      <ShoppingCart className="w-4 h-4 mr-1" />
                      Add
                    </Button>
                  </div>
                </div>
                );
              })}
            </div>

            {filteredItems?.length === 0 && (
              <div className="text-center py-16">
                <p className="text-[var(--color-bark-warm)] text-lg mb-2">No listings found</p>
                <p className="text-sm text-[var(--color-sage)]">Try adjusting your filters</p>
              </div>
            )}

            {data && data.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-10">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 rounded-full text-sm font-medium border border-[var(--color-sage-light)] text-[var(--color-bark-warm)] disabled:opacity-40 hover:bg-[var(--color-sage-light)]/20 transition-colors"
                >
                  Previous
                </button>
                <span className="font-mono text-sm text-[var(--color-bark-warm)] px-3">
                  Page {page} of {data.totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                  disabled={page === data.totalPages}
                  className="px-4 py-2 rounded-full text-sm font-medium border border-[var(--color-sage-light)] text-[var(--color-bark-warm)] disabled:opacity-40 hover:bg-[var(--color-sage-light)]/20 transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
      <Footer />
    </div>
  );
}
