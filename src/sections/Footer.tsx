import { Link } from "react-router";
import { TreePine } from "lucide-react";

const footerLinks = {
  Browse: [
    { label: "Varieties", to: "/varieties" },
    { label: "Marketplace", to: "/marketplace" },
    { label: "Hardiness Zones", to: "/varieties" },
    { label: "Seasonal Calendar", to: "/marketplace" },
  ],
  Growers: [
    { label: "Sell Scions", to: "/dashboard/listings" },
    { label: "Manage Listings", to: "/dashboard/listings" },
    { label: "Shipping Guide", to: "#" },
    { label: "Grafting Tips", to: "#" },
  ],
  Community: [
    { label: "Sellers", to: "/sellers" },
    { label: "Exchange Network", to: "/marketplace" },
    { label: "Research Archive", to: "/varieties" },
    { label: "Contact", to: "#" },
  ],
};

export default function Footer() {
  return (
    <footer className="w-full bg-[var(--color-bark)] pt-16 sm:pt-20 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <TreePine className="w-5 h-5 text-[var(--color-flesh)]" />
              <span className="font-display text-lg text-[var(--color-cream)]">
                Heritage Roots
              </span>
            </div>
            <p className="text-sm text-[var(--color-cream)]/60 leading-relaxed">
              Preserving apple diversity, one graft at a time.
            </p>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="font-body text-sm font-semibold text-[var(--color-cream)] mb-4">
                {title}
              </h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.to}
                      className="text-sm text-[var(--color-cream)]/50 hover:text-[var(--color-flesh)] transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="pt-6 border-t border-[var(--color-cream)]/10 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="font-mono text-[11px] tracking-wider text-[var(--color-cream)]/40">
            &copy; 2025 Heritage Roots
          </p>
          <div className="flex items-center gap-4">
            <span className="font-mono text-[11px] tracking-wider text-[var(--color-cream)]/40 hover:text-[var(--color-cream)]/60 cursor-pointer transition-colors">
              Terms
            </span>
            <span className="font-mono text-[11px] tracking-wider text-[var(--color-cream)]/40 hover:text-[var(--color-cream)]/60 cursor-pointer transition-colors">
              Privacy
            </span>
            <span className="font-mono text-[11px] tracking-wider text-[var(--color-cream)]/40 hover:text-[var(--color-cream)]/60 cursor-pointer transition-colors">
              Accessibility
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
