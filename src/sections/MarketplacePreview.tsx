import { useRef } from "react";
import { Link } from "react-router";
import { trpc } from "@/providers/trpc";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, ChevronRight, MapPin } from "lucide-react";

export default function MarketplacePreview() {
  const { data, isLoading } = trpc.listing.list.useQuery({ limit: 12 });
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    const amount = 320;
    scrollRef.current.scrollBy({ left: dir === "left" ? -amount : amount, behavior: "smooth" });
  };

  return (
    <section className="w-full py-20 sm:py-24 bg-[var(--color-bone)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-end justify-between mb-10">
          <div>
            <h2 className="font-display text-3xl sm:text-4xl text-[var(--color-bark)] mb-2">
              Fresh listings this season
            </h2>
            <p className="text-[var(--color-bark-warm)] text-base">
              Scion wood collected and ready for grafting
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <button
              onClick={() => scroll("left")}
              className="w-9 h-9 rounded-full border border-[var(--color-sage-light)] flex items-center justify-center text-[var(--color-bark-warm)] hover:bg-[var(--color-sage-light)]/30 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => scroll("right")}
              className="w-9 h-9 rounded-full border border-[var(--color-sage-light)] flex items-center justify-center text-[var(--color-bark-warm)] hover:bg-[var(--color-sage-light)]/30 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex gap-5 overflow-hidden">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="min-w-[280px]">
                <Skeleton className="h-40 rounded-xl" />
                <Skeleton className="w-3/4 h-5 mt-3" />
                <Skeleton className="w-1/2 h-4 mt-2" />
              </div>
            ))}
          </div>
        ) : (
          <div
            ref={scrollRef}
            className="flex gap-5 overflow-x-auto pb-4 scrollbar-hide"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {data?.items.map((listing) => (
              <Link
                key={listing.id}
                to={`/marketplace?variety=${listing.varietySlug}`}
                className="min-w-[280px] max-w-[280px] bg-[var(--color-surface-solid)] rounded-2xl p-5 hover:-translate-y-1 hover:shadow-lg transition-all duration-300 shrink-0"
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-full bg-[var(--color-sage-light)]/30 flex items-center justify-center">
                    <span className="text-[10px] font-mono text-[var(--color-sage)]">
                      {listing.sellerName?.charAt(0) ?? "?"}
                    </span>
                  </div>
                  <span className="font-mono text-[11px] tracking-wider text-[var(--color-bark-warm)] uppercase">
                    {listing.sellerName}
                  </span>
                  {listing.sellerVerified && (
                    <span className="ml-auto text-[10px] font-mono text-[var(--color-sage)] bg-[var(--color-sage)]/10 px-2 py-0.5 rounded-full">
                      Verified
                    </span>
                  )}
                </div>

                <h4 className="font-body text-base font-semibold text-[var(--color-bark)] mb-1">
                  {listing.varietyName}
                </h4>

                <p className="text-sm text-[var(--color-bark-warm)] mb-3">
                  {listing.quantity} sticks available · ${listing.pricePerStick}/stick
                </p>

                <div className="flex items-center gap-1.5 mb-3">
                  <MapPin className="w-3 h-3 text-[var(--color-sage)]" />
                  <span className="font-mono text-[10px] tracking-wider text-[var(--color-sage)] uppercase">
                    Zone {listing.sellerZone} · {listing.sellerLocation}
                  </span>
                </div>

                <span className="text-sm font-medium text-[var(--color-flesh)]">
                  View Listing →
                </span>
              </Link>
            ))}
          </div>
        )}

        <div className="mt-8 text-center">
          <Link
            to="/marketplace"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full border border-[var(--color-bark)]/20 text-sm font-medium text-[var(--color-bark)] hover:bg-[var(--color-bark)] hover:text-[var(--color-cream)] transition-all"
          >
            Browse all listings
          </Link>
        </div>
      </div>
    </section>
  );
}
