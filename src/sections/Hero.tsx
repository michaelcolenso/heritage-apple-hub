import { useEffect, useRef } from "react";
import { Link } from "react-router";
import { ArrowRight } from "lucide-react";

// Simplex noise implementation
class SimplexNoise {
  p: number[];
  constructor(seed = 42) {
    const perm: number[] = [];
    for (let i = 0; i < 256; i++) perm[i] = i;
    for (let i = 255; i > 0; i--) {
      seed = (seed * 16807 + 0) % 2147483647;
      const j = seed % (i + 1);
      [perm[i], perm[j]] = [perm[j], perm[i]];
    }
    this.p = [...perm, ...perm];
  }
  fade(t: number) { return t * t * t * (t * (t * 6 - 15) + 10); }
  lerp(a: number, b: number, t: number) { return a + t * (b - a); }
  grad2D(hash: number, x: number, y: number) {
    const h = hash & 3;
    const g = h === 0 ? [1, x] : h === 1 ? [-1, x] : h === 2 ? [1, y] : [-1, y];
    return g[0] * x + g[1] * y;
  }
  noise2D(x: number, y: number) {
    const F2 = 0.5 * (Math.sqrt(3) - 1);
    const s = (x + y) * F2;
    const i = Math.floor(x + s);
    const j = Math.floor(y + s);
    const G2 = (3 - Math.sqrt(3)) / 6;
    const t = (i + j) * G2;
    const x0 = x - (i - t);
    const y0 = y - (j - t);
    const i1 = x0 > y0 ? 1 : 0;
    const j1 = x0 > y0 ? 0 : 1;
    const x1 = x0 - i1 + G2;
    const y1 = y0 - j1 + G2;
    const x2 = x0 - 1 + 2 * G2;
    const y2 = y0 - 1 + 2 * G2;
    const ii = i & 255;
    const jj = j & 255;
    let n0: number, n1: number, n2: number;
    let t0 = 0.5 - x0 * x0 - y0 * y0;
    if (t0 < 0) n0 = 0;
    else { t0 *= t0; n0 = t0 * t0 * this.grad2D(this.p[ii + this.p[jj]], x0, y0); }
    let t1 = 0.5 - x1 * x1 - y1 * y1;
    if (t1 < 0) n1 = 0;
    else { t1 *= t1; n1 = t1 * t1 * this.grad2D(this.p[ii + i1 + this.p[jj + j1]], x1, y1); }
    let t2 = 0.5 - x2 * x2 - y2 * y2;
    if (t2 < 0) n2 = 0;
    else { t2 *= t2; n2 = t2 * t2 * this.grad2D(this.p[ii + 1 + this.p[jj + 1]], x2, y2); }
    return 70 * (n0 + n1 + n2);
  }
}

const points = [
  { baseX: 0.1, baseY: 0.2, radius: 0.08, phase: 0, speed: 0.3 },
  { baseX: 0.8, baseY: 0.15, radius: 0.1, phase: Math.PI * 0.5, speed: 0.25 },
  { baseX: 0.25, baseY: 0.85, radius: 0.09, phase: Math.PI, speed: 0.35 },
  { baseX: 0.9, baseY: 0.75, radius: 0.07, phase: Math.PI * 1.5, speed: 0.2 },
];
const colors = ["#261d17", "#e8725a", "#7e8f7e", "#d4a574"];

export default function Hero() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timeRef = useRef(0);
  const rafRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const noise = new SimplexNoise(123);

    function resize() {
      canvas!.width = window.innerWidth;
      canvas!.height = window.innerHeight;
    }

    function draw() {
      const w = canvas!.width;
      const h = canvas!.height;
      timeRef.current += 0.003;
      const time = timeRef.current;
      ctx!.clearRect(0, 0, w, h);

      const p = points.map((point) => ({
        x: point.baseX + Math.cos(time * point.speed + point.phase) * point.radius + noise.noise2D(time * 0.5, point.phase) * 0.03,
        y: point.baseY + Math.sin(time * point.speed + point.phase) * point.radius + noise.noise2D(time * 0.5 + 100, point.phase) * 0.03,
      }));

      const px = p.map((pt) => ({ x: pt.x * w, y: pt.y * h }));
      const gradient = ctx!.createLinearGradient(px[0].x, px[0].y, px[3].x, px[3].y);
      gradient.addColorStop(0, colors[0]);
      gradient.addColorStop(0.33, colors[1]);
      gradient.addColorStop(0.66, colors[2]);
      gradient.addColorStop(1, colors[3]);
      ctx!.fillStyle = gradient;
      ctx!.fillRect(0, 0, w, h);

      rafRef.current = requestAnimationFrame(draw);
    }

    window.addEventListener("resize", resize);
    resize();
    draw();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <section className="relative w-full h-screen flex items-center justify-center overflow-hidden">
      {/* Mesh gradient canvas */}
      <canvas
        ref={canvasRef}
        style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", zIndex: 1 }}
      />

      {/* Grain overlay */}
      <div
        className="absolute inset-0 z-[2] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          opacity: 0.04,
        }}
      />

      {/* Content */}
      <div className="relative z-[3] text-center px-4 sm:px-6 max-w-2xl mx-auto">
        <p className="font-mono text-[11px] tracking-[0.12em] uppercase text-[var(--color-cream)] mb-6">
          Heritage Apple Scion Wood Marketplace
        </p>

        <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl text-[var(--color-cream)] leading-[1] tracking-tight mb-6">
          Preserve the
          <span className="block mt-1">
            living history of
          </span>
          <span className="block mt-1 text-[var(--color-blush)]">
            apple cultivation
          </span>
        </h1>

        <p className="text-[var(--color-cream)]/80 text-base sm:text-lg leading-relaxed max-w-xl mx-auto mb-10 font-body">
          Connect with growers preserving 500+ rare apple varieties. Source scion wood for grafting, 
          barter for cuttings, or sell your surplus.
        </p>

        <div className="flex items-center justify-center gap-4">
          <Link
            to="/varieties"
            className="inline-flex items-center gap-2 px-7 py-3 rounded-full bg-[var(--color-cream)] text-[var(--color-bark)] text-sm font-medium hover:bg-[var(--color-cream)]/90 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            Explore Varieties
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/dashboard/listings"
            className="inline-flex items-center px-7 py-3 rounded-full border border-[var(--color-cream)]/60 text-[var(--color-cream)] text-sm font-medium hover:bg-[var(--color-cream)]/10 transition-all"
          >
            Start Selling
          </Link>
        </div>
      </div>
    </section>
  );
}
