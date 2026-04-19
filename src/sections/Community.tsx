import { Link } from "react-router";
import { BookOpen, Trees, ArrowRight } from "lucide-react";

const guides = [
  { title: "Bench Grafting 101", desc: "Step-by-step for beginners" },
  { title: "When to Collect Scions", desc: "Timing for optimal success" },
  { title: "Storage Tips", desc: "Keep cuttings fresh for weeks" },
];

export default function Community() {
  return (
    <section className="w-full py-20 sm:py-24 bg-[var(--color-cream)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <h2 className="font-display text-3xl sm:text-4xl text-[var(--color-bark)] text-center mb-12">
          Join the grafting community
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Zone Lookup */}
          <div className="bg-[var(--color-surface-solid)] rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Trees className="w-5 h-5 text-[var(--color-flesh)]" />
              <h3 className="font-body text-base font-semibold text-[var(--color-bark)]">
                Varieties in your zone
              </h3>
            </div>
            <p className="text-sm text-[var(--color-bark-warm)] mb-4">
              Enter your zipcode or USDA hardiness zone to find varieties that thrive in your climate.
            </p>
            <Link
              to="/varieties"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--color-flesh)] hover:underline"
            >
              Browse by zone <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Growing Guides */}
          <div className="bg-[var(--color-surface-solid)] rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="w-5 h-5 text-[var(--color-flesh)]" />
              <h3 className="font-body text-base font-semibold text-[var(--color-bark)]">
                Growing guides
              </h3>
            </div>
            <div className="space-y-3">
              {guides.map((guide) => (
                <div
                  key={guide.title}
                  className="flex items-center justify-between py-2 border-b border-[var(--color-sage-light)]/30 last:border-0"
                >
                  <div>
                    <p className="text-sm font-medium text-[var(--color-bark)]">{guide.title}</p>
                    <p className="text-xs text-[var(--color-bark-warm)]">{guide.desc}</p>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-[var(--color-sage)]" />
                </div>
              ))}
            </div>
          </div>

          {/* Trade Network */}
          <div className="bg-[var(--color-surface-solid)] rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Trees className="w-5 h-5 text-[var(--color-flesh)]" />
              <h3 className="font-body text-base font-semibold text-[var(--color-bark)]">
                Community trades
              </h3>
            </div>
            <p className="text-sm text-[var(--color-bark-warm)] mb-4">
              Connect with local growers for scion exchanges. Trade varieties you have for ones you want — no money needed.
            </p>
            <Link
              to="/marketplace"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--color-flesh)] hover:underline"
            >
              Explore trades <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
