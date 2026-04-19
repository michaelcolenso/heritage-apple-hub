import { useState } from "react";
import { Link } from "react-router";
import { trpc } from "@/providers/trpc";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Search, SlidersHorizontal } from "lucide-react";
import Footer from "@/sections/Footer";

const useOptions = ["Fresh Eating", "Cooking", "Cider", "Storage", "Multi-use"];

const fallbackImages: Record<string, string> = {
  "ashmeads-kernel": "https://images.unsplash.com/photo-1568702846914-96b305d2ebb2?w=400&h=400&fit=crop",
  "roxbury-russet": "https://images.unsplash.com/photo-1570913149827-d2ac84ab3f9a?w=400&h=400&fit=crop",
  "esopus-spitzenburg": "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=400&h=400&fit=crop",
  "newtown-pippin": "https://images.unsplash.com/photo-1584306670957-acf935f5033c?w=400&h=400&fit=crop",
  "gravenstein": "https://images.unsplash.com/photo-1568702846914-96b305d2ebb2?w=400&h=400&fit=crop",
  "winesap": "https://images.unsplash.com/photo-1570913149827-d2ac84ab3f9a?w=400&h=400&fit=crop",
  "baldwin": "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=400&h=400&fit=crop",
  "northern-spy": "https://images.unsplash.com/photo-1584306670957-acf935f5033c?w=400&h=400&fit=crop",
};

function getVarietyImage(slug: string) {
  return fallbackImages[slug] ?? "https://images.unsplash.com/photo-1568702846914-96b305d2ebb2?w=400&h=400&fit=crop";
}

export default function Varieties() {
  const [search, setSearch] = useState("");
  const [selectedUse, setSelectedUse] = useState<string | undefined>();
  const [showRare, setShowRare] = useState<boolean | undefined>();
  const [page, setPage] = useState(1);

  const { data, isLoading } = trpc.variety.list.useQuery({
    page,
    limit: 12,
    search: search || undefined,
    primaryUse: selectedUse,
    isRare: showRare,
    sortBy: "popularity",
  });

  return (
    <div className="min-h-screen bg-[var(--color-bone)] pt-16">
      {/* Compact header */}
      <div className="w-full py-16 sm:py-20" style={{ background: "linear-gradient(135deg, #261d17, #e8725a, #7e8f7e)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <h1 className="font-display text-4xl sm:text-5xl text-[var(--color-cream)] mb-3">
            Apple Variety Catalog
          </h1>
          <p className="text-[var(--color-cream)]/80 text-base max-w-md mx-auto">
            40+ heritage and modern varieties available for grafting
          </p>
        </div>
      </div>

      {/* Filter bar */}
      <div className="sticky top-16 z-30 bg-[var(--color-surface-solid)]/95 backdrop-blur-xl border-b border-[var(--color-sage-light)]/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-sage)]" />
            <Input
              placeholder="Search varieties..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-9 h-9 bg-[var(--color-bone)] border-[var(--color-sage-light)] text-sm"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto">
            <SlidersHorizontal className="w-4 h-4 text-[var(--color-sage)] shrink-0" />
            {useOptions.map((use) => (
              <button
                key={use}
                onClick={() => { setSelectedUse(selectedUse === use ? undefined : use); setPage(1); }}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                  selectedUse === use
                    ? "bg-[var(--color-flesh)] text-white"
                    : "bg-[var(--color-bone)] text-[var(--color-bark-warm)] hover:bg-[var(--color-sage-light)]/30"
                }`}
              >
                {use}
              </button>
            ))}
            <button
              onClick={() => { setShowRare(showRare === true ? undefined : true); setPage(1); }}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                showRare === true
                  ? "bg-[var(--color-flesh)] text-white"
                  : "bg-[var(--color-bone)] text-[var(--color-bark-warm)] hover:bg-[var(--color-sage-light)]/30"
              }`}
            >
              Heritage Only
            </button>
          </div>
        </div>
      </div>

      {/* Variety grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="w-full aspect-square rounded-2xl" />
                <Skeleton className="w-3/4 h-5" />
                <Skeleton className="w-1/2 h-4" />
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {data?.items.map((variety) => (
                <Link
                  key={variety.id}
                  to={`/varieties/${variety.slug}`}
                  className="group block bg-[var(--color-surface-solid)] rounded-2xl overflow-hidden hover:-translate-y-1 hover:shadow-lg transition-all duration-300"
                >
                  <div className="aspect-square overflow-hidden bg-[var(--color-sage-light)]/20">
                    <img
                      src={getVarietyImage(variety.slug)}
                      alt={variety.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-display text-lg text-[var(--color-bark)] group-hover:text-[var(--color-flesh)] transition-colors">
                        {variety.name}
                      </h3>
                      {variety.isRare && (
                        <span className="shrink-0 text-[10px] font-mono bg-[var(--color-flesh)]/10 text-[var(--color-flesh)] px-2 py-0.5 rounded-full uppercase tracking-wider">
                          Heritage
                        </span>
                      )}
                    </div>
                    {variety.originYear && (
                      <p className="font-mono text-[11px] tracking-wider text-[var(--color-sage)] uppercase mt-1">
                        {variety.originYear} · {variety.originCountry}
                      </p>
                    )}
                    <p className="text-sm text-[var(--color-bark-warm)] mt-2 line-clamp-2">
                      {variety.description?.slice(0, 120)}...
                    </p>
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {variety.flavorProfile?.split(",").slice(0, 3).map((flavor) => (
                        <span
                          key={flavor}
                          className="text-[10px] font-mono bg-[var(--color-sage-light)]/30 text-[var(--color-bark-warm)] px-2 py-0.5 rounded-full"
                        >
                          {flavor.trim()}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-[var(--color-sage-light)]/20">
                      <span className="text-xs text-[var(--color-sage)]">
                        Zones {variety.hardinessZoneMin}-{variety.hardinessZoneMax}
                      </span>
                      <span className="text-xs font-medium text-[var(--color-flesh)]">
                        {variety.primaryUse}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination */}
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
