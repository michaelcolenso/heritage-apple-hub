import { Link } from "react-router";
import { trpc } from "@/lib/trpc";
import { Skeleton } from "@/components/ui/skeleton";
import { Star, MapPin, Package, ArrowRight } from "lucide-react";
import Footer from "@/sections/Footer";

export default function Sellers() {
  const { data: sellers, isLoading } = trpc.user.listSellers.useQuery();

  return (
    <div className="min-h-screen bg-[var(--color-bone)] pt-16">
      <div className="w-full py-12 sm:py-16" style={{ background: "linear-gradient(135deg, #261d17, #7e8f7e)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <h1 className="font-display text-4xl sm:text-5xl text-[var(--color-cream)] mb-3">
            Verified Growers
          </h1>
          <p className="text-[var(--color-cream)]/80 text-base max-w-lg">
            Heritage apple preservationists offering scion wood from their orchards
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-64 rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {sellers?.map((seller) => (
              <div
                key={seller.id}
                className="bg-[var(--color-surface-solid)] rounded-2xl p-6 hover:-translate-y-1 hover:shadow-lg transition-all duration-300"
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-14 h-14 rounded-full bg-[var(--color-flesh)]/10 flex items-center justify-center shrink-0">
                    <span className="font-display text-xl text-[var(--color-flesh)]">
                      {seller.name?.charAt(0) ?? "?"}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-body text-lg font-semibold text-[var(--color-bark)] truncate">
                        {seller.name}
                      </h3>
                      {seller.isVerifiedSeller && (
                        <span className="shrink-0 text-[10px] font-mono bg-[var(--color-sage)]/10 text-[var(--color-sage)] px-2 py-0.5 rounded-full uppercase tracking-wider">
                          Verified
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-[var(--color-sage)]" />
                      <span className="text-xs text-[var(--color-bark-warm)]">
                        {seller.location}
                        {seller.hardinessZone && ` · Zone ${seller.hardinessZone}`}
                      </span>
                    </div>
                  </div>
                </div>

                {seller.bio && (
                  <p className="text-sm text-[var(--color-bark-warm)] mb-4 line-clamp-3">
                    {seller.bio}
                  </p>
                )}

                <div className="flex items-center gap-4 mb-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Package className="w-3.5 h-3.5 text-[var(--color-sage)]" />
                    <span className="text-[var(--color-bark-warm)]">{seller.listingCount} listings</span>
                  </div>
                  {seller.totalReviews > 0 && (
                    <div className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 text-[var(--color-amber)] fill-[var(--color-amber)]" />
                      <span className="text-[var(--color-bark-warm)]">
                        {seller.avgRating} ({seller.totalReviews})
                      </span>
                    </div>
                  )}
                </div>

                <Link
                  to={`/marketplace?seller=${seller.id}`}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--color-flesh)] hover:underline"
                >
                  View listings <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
