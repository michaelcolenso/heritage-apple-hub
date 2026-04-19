import { TreePine, Users, GitBranch } from "lucide-react";

const stats = [
  { icon: TreePine, value: "40+", label: "varieties listed" },
  { icon: Users, value: "3", label: "verified growers" },
  { icon: GitBranch, value: "15,000+", label: "grafts tracked" },
];

export default function PreservationImpact() {
  return (
    <section className="w-full py-20 sm:py-24 bg-[var(--color-bone)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="font-display text-3xl sm:text-4xl text-[var(--color-bark)] mb-4">
              Every graft is an act of preservation
            </h2>
            <p className="text-[var(--color-bark-warm)] text-base leading-relaxed max-w-md mb-8">
              Over 7,000 apple varieties once grew in North America. Today, less than 100 are 
              commercially available. When you graft a rare variety, you become part of a living archive.
            </p>

            <div className="flex flex-wrap gap-8">
              {stats.map((stat) => (
                <div key={stat.label} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[var(--color-sage)]/10 flex items-center justify-center">
                    <stat.icon className="w-5 h-5 text-[var(--color-sage)]" />
                  </div>
                  <div>
                    <p className="font-mono text-lg font-medium text-[var(--color-bark)]">
                      {stat.value}
                    </p>
                    <p className="font-mono text-[10px] tracking-wider text-[var(--color-sage)] uppercase">
                      {stat.label}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {[
              "https://images.unsplash.com/photo-1568702846914-96b305d2ebb2?w=200&h=200&fit=crop",
              "https://images.unsplash.com/photo-1570913149827-d2ac84ab3f9a?w=200&h=200&fit=crop",
              "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=200&h=200&fit=crop",
              "https://images.unsplash.com/photo-1584306670957-acf935f5033c?w=200&h=200&fit=crop",
              "https://images.unsplash.com/photo-1523712999610-f77fbcfc3843?w=200&h=200&fit=crop",
              "https://images.unsplash.com/photo-1508349937086-99c9e621a7b8?w=200&h=200&fit=crop",
              "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=200&h=200&fit=crop",
              "https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=200&h=200&fit=crop",
              "https://images.unsplash.com/photo-1470058869958-2a77ade41c02?w=200&h=200&fit=crop",
            ].map((src, i) => (
              <div
                key={i}
                className="aspect-square rounded-xl overflow-hidden bg-[var(--color-sage-light)]/20"
                style={{
                  transform: `translateZ(${(i % 3 === 1 ? 10 : -5) * (i % 2 === 0 ? 1 : -1)}px)`,
                }}
              >
                <img
                  src={src}
                  alt={`Apple orchard ${i + 1}`}
                  className="w-full h-full object-cover hover:scale-110 transition-transform duration-500"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
