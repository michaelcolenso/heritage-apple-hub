import { Link } from "react-router";
import { trpc } from "@/providers/trpc";
import { Skeleton } from "@/components/ui/skeleton";

const varietyImages: Record<string, string> = {
  "ashmeads-kernel": "/variety-ashmeads-kernel.jpg",
  "roxbury-russet": "/variety-roxbury-russet.jpg",
  "esopus-spitzenburg": "/variety-esopus-spitzenburg.jpg",
  "newtown-pippin": "/variety-newtown-pippin.jpg",
  "gravenstein": "/variety-gravenstein.jpg",
  "winesap": "/variety-winesap.jpg",
  "baldwin": "/variety-baldwin.jpg",
  "northern-spy": "/variety-northern-spy.jpg",
  "pink-pearl": "/variety-pink-pearl.jpg",
  "honeycrisp": "/variety-honeycrisp.jpg",
};

function getVarietyImage(slug: string) {
  return varietyImages[slug] ?? "/orchard-spring-blossom.jpg";
}

export default function FeaturedVarieties() {
  const { data: varieties, isLoading } = trpc.variety.getFeatured.useQuery();

  return (
    <section className="w-full py-24 sm:py-32 bg-[var(--color-bone)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="mb-12">
          <h2 className="font-display text-3xl sm:text-4xl text-[var(--color-bark)] mb-3">
            Rare varieties, living history
          </h2>
          <p className="text-[var(--color-bark-warm)] text-base max-w-lg">
            Each stick carries decades of flavor, disease resistance, and regional adaptation
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="w-full aspect-square rounded-2xl" />
                <Skeleton className="w-3/4 h-5" />
                <Skeleton className="w-1/2 h-4" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {varieties?.map((variety) => (
              <Link
                key={variety.id}
                to={`/varieties/${variety.slug}`}
                className="group block"
              >
                <div className="relative aspect-square rounded-2xl overflow-hidden mb-3 bg-[var(--color-sage-light)]/20">
                  <img
                    src={getVarietyImage(variety.slug)}
                    alt={variety.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                </div>
                <h3 className="font-display text-lg text-[var(--color-bark)] group-hover:text-[var(--color-flesh)] transition-colors">
                  {variety.name}
                </h3>
                {variety.originYear && (
                  <p className="font-mono text-[11px] tracking-wider text-[var(--color-sage)] uppercase mt-0.5">
                    {variety.originYear} · {variety.originCountry}
                  </p>
                )}
                <p className="text-sm text-[var(--color-bark-warm)] mt-1 line-clamp-2">
                  {variety.flavorProfile?.split(",").slice(0, 3).join(" · ")}
                </p>
                <span className="inline-block mt-2 px-3 py-1 rounded-full text-[11px] font-mono bg-[var(--color-flesh)]/10 text-[var(--color-flesh)]">
                  {variety.primaryUse}
                </span>
              </Link>
            ))}
          </div>
        )}

        <div className="mt-10 text-center">
          <Link
            to="/varieties"
            className="inline-flex items-center gap-2 text-sm font-medium text-[var(--color-flesh)] hover:underline"
          >
            View all 40+ varieties
            <span className="text-lg">→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
