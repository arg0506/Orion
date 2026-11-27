import React, { useEffect, useRef } from 'react';

/**
 * A hand-drawn-looking halftone planet whose top has been opened like a bowl.
 * Every dot is placed procedurally (seeded, so it looks the same on every visit)
 * and the dots "print" outward from the opening on load.
 */

const W = 560;
const H = 470;

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

export const PLANET = {
  cx: W / 2,
  cy: H * 0.57,
  r: W * 0.37,
  get openY() {
    return this.cy - this.r * 0.7;
  },
  get openRx() {
    return this.r * 0.69;
  },
  get openRy() {
    return this.r * 0.15;
  },
  W,
  H,
};

/** Belt stars carved into the planet's surface, as fractions of the canvas. */
export const BELT = [
  { x: (PLANET.cx + PLANET.r * 0.05) / W, y: (PLANET.cy + PLANET.r * 0.2) / H },
  { x: (PLANET.cx + PLANET.r * 0.25) / W, y: (PLANET.cy + PLANET.r * 0.12) / H },
  { x: (PLANET.cx + PLANET.r * 0.45) / W, y: (PLANET.cy + PLANET.r * 0.03) / H },
];

type Dot = { x: number; y: number; r: number; order: number };

// cheap value noise for paper-like grain
function makeNoise(rand: () => number) {
  const N = 64;
  const g = Array.from({ length: N * N }, rand);
  const at = (x: number, y: number) => g[((y % N) + N) % N * N + (((x % N) + N) % N)];
  return (x: number, y: number) => {
    const xi = Math.floor(x), yi = Math.floor(y);
    const xf = x - xi, yf = y - yi;
    const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    const a = at(xi, yi), b = at(xi + 1, yi), c = at(xi, yi + 1), d = at(xi + 1, yi + 1);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  };
}

function buildDots(): Dot[] {
  const rand = mulberry32(1987);
  const noise = makeNoise(rand);
  const { cx, cy, r, openY, openRx, openRy } = PLANET;
  const L = (() => {
    const v = [-0.6, -0.55, 0.58];
    const m = Math.hypot(...v);
    return v.map((c) => c / m);
  })();

  const craters = [
    { x: cx - r * 0.38, y: cy + r * 0.05, rad: r * 0.13 },
    { x: cx + r * 0.1, y: cy + r * 0.52, rad: r * 0.1 },
    { x: cx - r * 0.12, y: cy - r * 0.28, rad: r * 0.07 },
    { x: cx + r * 0.62, y: cy + r * 0.35, rad: r * 0.08 },
    { x: cx - r * 0.55, y: cy + r * 0.48, rad: r * 0.06 },
  ];
  const beltPx = BELT.map((b) => ({ x: b.x * W, y: b.y * H }));

  const dots: Dot[] = [];
  const step = 1.7;
  for (let gy = 0; gy < H; gy += step) {
    for (let gx = 0; gx < W; gx += step) {
      const x = gx + (rand() - 0.5) * step;
      const y = gy + (rand() - 0.5) * step;
      const dx = x - cx;
      const dy = y - cy;
      const inSphere = dx * dx + dy * dy <= r * r;
      const ex = (x - cx) / openRx;
      const ey = (y - openY) / openRy;
      const eDist = ex * ex + ey * ey;
      const lipOuter = 1.22;

      let t = 0; // tone: 0 = paper, 1 = ink
      if (eDist <= 1) {
        // Inside the opening: near-black, the far wall catches a little light
        t = 0.97 - smooth(0.2, -1, ey) * 0.3;
      } else if (eDist <= lipOuter && (y >= openY || eDist <= lipOuter)) {
        // The cut edge of the shell, lit from above
        t = 0.12 + smooth(1, lipOuter, eDist) * 0.25 + Math.max(0, ex) * 0.25;
      } else if (inSphere && y > openY) {
        const nx = dx / r, ny = dy / r;
        const nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny));
        const lambert = Math.max(0, nx * L[0] + ny * L[1] + nz * L[2]);
        t = 0.04 + Math.pow(1 - lambert, 1.35) * 0.9;
        t += Math.pow(1 - nz, 4) * 0.2; // rim
        for (const c of craters) {
          const cd = Math.hypot(x - c.x, (y - c.y) * 1.25) / c.rad;
          if (cd < 0.85) t = t * 0.8 + 0.06;
          else if (cd < 1.1) t = Math.min(1, t + 0.22);
        }
        t += smooth(openRy * 2.2, 0, y - openY) * 0.35; // shadow under the lip
        t *= 0.82 + noise(x / 14, y / 14) * 0.36; // grain
        t *= 1 - smooth(cy + r * 0.35, cy + r * 1.02, y) * 0.75; // dissolve at the bottom
      } else if (y > cy + r * 0.5) {
        // ink dust falling away below
        const fall = 1 - smooth(cy + r * 0.5, H, y);
        const spread = 1 - Math.min(1, Math.abs(dx) / (r * (0.95 + (y - cy) / r * 0.2)));
        t = fall * spread * 0.09;
      }

      for (const b of beltPx) {
        const bd = Math.hypot(x - b.x, y - b.y);
        if (bd < 8) t = 0;
        else if (bd < 14) t *= (bd - 8) / 6;
      }

      t = Math.min(1, Math.max(0, t));
      if (t > 0 && rand() < t) {
        const fromOpening = Math.hypot(x - cx, (y - openY) * 1.6);
        dots.push({ x, y, r: 0.42 + t * 0.72 + rand() * 0.18, order: fromOpening + rand() * 70 });
      }
    }
  }
  dots.sort((a, b) => a.order - b.order);
  return dots;
}

export default function StipplePlanet({ className, reduced }: { className?: string; reduced?: boolean }) {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.scale(dpr, dpr);
    ctx.fillStyle = '#141414';

    const dots = buildDots();
    const draw = (from: number, to: number) => {
      ctx.beginPath();
      for (let i = from; i < to; i++) {
        const d = dots[i];
        ctx.moveTo(d.x + d.r, d.y);
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
      }
      ctx.fill();
    };

    if (reduced) {
      draw(0, dots.length);
      return;
    }

    let raf = 0;
    let drawn = 0;
    const start = performance.now();
    const DURATION = 1800;
    const tick = (now: number) => {
      const t = Math.min(1, Math.max(0, (now - start) / DURATION));
      const eased = 1 - Math.pow(1 - t, 3);
      const target = Math.floor(eased * dots.length);
      if (target > drawn) {
        draw(drawn, target);
        drawn = target;
      }
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [reduced]);

  return <canvas ref={ref} className={className} style={{ aspectRatio: `${W} / ${H}` }} aria-hidden="true" />;
}
