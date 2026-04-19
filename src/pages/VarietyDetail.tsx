import { useParams, Link } from "react-router";
import { trpc } from "@/providers/trpc";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MapPin, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import Footer from "@/sections/Footer";

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

export default function VarietyDetail() {
  const { slug } = useParams<{ slug: string }>();
  const utils = trpc.useUtils();

  const { data: variety, isLoading } = trpc.variety.getBySlug.useQuery(
    { slug: slug ?? "" },
    { enabled: !!slug }
  );

  const addToCart = trpc.cart.add.useMutation({
    onSuccess: () => {
      utils.cart.get.invalidate();
      toast.success("Added to cart");
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--color-bone)] pt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            <Skeleton className="aspect-square rounded-2xl" />
            <div className="space-y-4">
              <Skeleton className="w-3/4 h-8" />
              <Skeleton className="w-1/2 h-5" />
              <Skeleton className="w-full h-32" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!variety) {
    return (
      <div className="min-h-screen bg-[var(--color-bone)] pt-24 flex items-center justify-center">
        <div className="text-center">
          <h2 className="font-display text-2xl text-[var(--color-bark)] mb-2">Variety not found</h2>
          <Link to="/varieties" className="text-[var(--color-flesh)] hover:underline">
            Back to catalog
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-bone)] pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <Link
          to="/varieties"
          className="inline-flex items-center gap-1.5 text-sm text-[var(--color-bark-warm)] hover:text-[var(--color-flesh)] transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to catalog
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Image */}
          <div className="aspect-square rounded-2xl overflow-hidden bg-[var(--color-sage-light)]/20">
            <img
              src={getVarietyImage(variety.slug)}
              alt={variety.name}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Details */}
          <div>
            <div className="flex items-start gap-3 mb-2">
              <h1 className="font-display text-4xl sm:text-5xl text-[var(--color-bark)]">
                {variety.name}
              </h1>
              {variety.isRare && (
                <span className="shrink-0 mt-2 text-[10px] font-mono bg-[var(--color-flesh)]/10 text-[var(--color-flesh)] px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Heritage
                </span>
              )}
            </div>

            <p className="font-mono text-[11px] tracking-wider text-[var(--color-sage)] uppercase mb-4">
              {variety.originYear ? `${variety.originYear} · ` : ""}
              {variety.originCountry}
              {variety.parentage ? ` · ${variety.parentage}` : ""}
            </p>

            <p className="text-[var(--color-bark-warm)] text-base leading-relaxed mb-6">
              {variety.description}
            </p>

            {/* Flavor profile */}
            {variety.flavorProfile && (
              <div className="mb-6">
                <h3 className="font-body text-sm font-semibold text-[var(--color-bark)] mb-2">
                  Flavor Profile
                </h3>
                <div className="flex flex-wrap gap-2">
                  {variety.flavorProfile.split(",").map((flavor) => (
                    <span
                      key={flavor}
                      className="px-3 py-1.5 rounded-full text-xs font-medium bg-[var(--color-sage-light)]/30 text-[var(--color-bark-warm)]"
                    >
                      {flavor.trim()}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Details grid */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              {variety.skinColor && (
                <div className="bg-[var(--color-surface-solid)] rounded-xl p-3">
                  <p className="text-[10px] font-mono uppercase tracking-wider text-[var(--color-sage)] mb-1">Skin</p>
                  <p className="text-sm text-[var(--color-bark)]">{variety.skinColor}</p>
                </div>
              )}
              {variety.fleshColor && (
                <div className="bg-[var(--color-surface-solid)] rounded-xl p-3">
                  <p className="text-[10px] font-mono uppercase tracking-wider text-[var(--color-sage)] mb-1">Flesh</p>
                  <p className="text-sm text-[var(--color-bark)]">{variety.fleshColor}</p>
                </div>
              )}
              {variety.primaryUse && (
                <div className="bg-[var(--color-surface-solid)] rounded-xl p-3">
                  <p className="text-[10px] font-mono uppercase tracking-wider text-[var(--color-sage)] mb-1">Best For</p>
                  <p className="text-sm text-[var(--color-bark)]">{variety.primaryUse}</p>
                </div>
              )}
              {(variety.hardinessZoneMin || variety.hardinessZoneMax) && (
                <div className="bg-[var(--color-surface-solid)] rounded-xl p-3">
                  <p className="text-[10px] font-mono uppercase tracking-wider text-[var(--color-sage)] mb-1">Hardiness</p>
                  <p className="text-sm text-[var(--color-bark)]">Zones {variety.hardinessZoneMin}-{variety.hardinessZoneMax}</p>
                </div>
              )}
            </div>

            {variety.diseaseResistance && (
              <div className="mb-6 bg-[var(--color-sage)]/5 rounded-xl p-3">
                <p className="text-[10px] font-mono uppercase tracking-wider text-[var(--color-sage)] mb-1">
                  Disease Resistance
                </p>
                <p className="text-sm text-[var(--color-bark-warm)]">{variety.diseaseResistance}</p>
              </div>
            )}
          </div>
        </div>

        {/* Availability section */}
        <div className="mt-16">
          <h2 className="font-display text-2xl text-[var(--color-bark)] mb-6">
            Available from growers
          </h2>

          {variety.availability && variety.availability.length > 0 ? (
            <div className="space-y-4">
              {variety.availability.map((listing) => (
                <div
                  key={listing.id}
                  className="bg-[var(--color-surface-solid)] rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center gap-4"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-body font-semibold text-[var(--color-bark)]">
                        {listing.sellerName}
                      </p>
                      {listing.sellerVerified && (
                        <span className="text-[10px] font-mono bg-[var(--color-sage)]/10 text-[var(--color-sage)] px-2 py-0.5 rounded-full">
                          Verified
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-[var(--color-bark-warm)]">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        Zone {listing.sellerZone}
                      </span>
                      <span>{listing.sellerLocation}</span>
                      <span>{listing.quantity} sticks</span>
                    </div>
                    {listing.description && (
                      <p className="text-sm text-[var(--color-bark-warm)]/70 mt-1 line-clamp-2">
                        {listing.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right">
                      <p className="font-mono text-lg font-medium text-[var(--color-bark)]">
                        ${listing.pricePerStick}
                      </p>
                      <p className="text-xs text-[var(--color-bark-warm)]">per stick</p>
                    </div>
                    <Button
                      onClick={() => addToCart.mutate({ listingId: listing.id, quantity: 1 })}
                      disabled={addToCart.isPending}
                      className="bg-[var(--color-flesh)] hover:bg-[var(--color-flesh)]/90 text-white rounded-full px-5"
                    >
                      <ShoppingCart className="w-4 h-4 mr-1.5" />
                      Add
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-[var(--color-surface-solid)] rounded-2xl">
              <p className="text-[var(--color-bark-warm)] mb-2">
                No active listings for this variety
              </p>
              <Link
                to="/marketplace"
                className="text-sm text-[var(--color-flesh)] hover:underline"
              >
                Browse other varieties
              </Link>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
