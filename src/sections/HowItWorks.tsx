import { Scissors, Sprout, HandHeart } from "lucide-react";

const steps = [
  {
    num: "01",
    title: "Request Scion Wood",
    desc: "Browse 500+ verified varieties and request cuttings from preservation orchards",
    icon: Scissors,
  },
  {
    num: "02",
    title: "Graft & Grow",
    desc: "Receive fresh scion wood in season, graft onto your rootstock, and cultivate living history",
    icon: Sprout,
  },
  {
    num: "03",
    title: "Share the Harvest",
    desc: "Return the favor — list surplus scions, trade locally, or sell to fund your orchard",
    icon: HandHeart,
  },
];

export default function HowItWorks() {
  return (
    <section className="w-full py-24 sm:py-32 bg-[var(--color-bark)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8 relative">
          {/* Dotted connecting line */}
          <div className="hidden md:block absolute top-16 left-[16%] right-[16%] border-t-2 border-dotted border-[var(--color-sage)]/30" />

          {steps.map((step) => (
            <div key={step.num} className="relative text-center md:text-left">
              <span className="font-display text-5xl text-[var(--color-flesh)]">
                {step.num}
              </span>
              <div className="mt-4 mb-3 inline-flex items-center justify-center w-10 h-10 rounded-full bg-[var(--color-flesh)]/10">
                <step.icon className="w-5 h-5 text-[var(--color-flesh)]" />
              </div>
              <h3 className="font-body text-lg font-medium text-[var(--color-cream)] mb-2">
                {step.title}
              </h3>
              <p className="text-sm text-[var(--color-cream)]/70 leading-relaxed max-w-xs mx-auto md:mx-0">
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
