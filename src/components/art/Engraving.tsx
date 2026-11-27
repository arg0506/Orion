/**
 * Orion's illustration system: a 19th-century star atlas, reprinted in halftone.
 * Stippled celestial bodies are generated dot by dot (seeded, so they print the same
 * every time), and everything else is fine ink line work. Ink only, plus one accent.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useAnimationFrame, useReducedMotion } from 'motion/react';
export type Family = 'evm' | 'solana' | 'stellar';
import { FamilyLogo, NetworkLogo } from './ChainLogo';

const INK = '#141414';
export const RIGEL = '#2f6fe0';
export const BETEL = '#e8622f';

function rng(seed: number) {
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

export type BodyKind = 'sphere' | 'crescent' | 'eclipse' | 'keyhole' | 'ringed';

/** A stippled celestial body that prints itself dot by dot. */
export function Stipple({ kind = 'sphere', size = 120, seed = 7, className, reprint = 0 }: { kind?: BodyKind; size?: number; seed?: number; className?: string; reprint?: number }) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const reduced = useReducedMotion();

  const dots = useMemo(() => {
    const rand = rng(seed * 97 + kind.length);
    const cx = size / 2, cy = size / 2;
    const R = size * (kind === 'eclipse' ? 0.3 : kind === 'ringed' ? 0.28 : 0.38);
    const L = kind === 'crescent' ? [0.92, -0.28, -0.25] : [-0.58, -0.6, 0.55];
    const m = Math.hypot(...L);
    const light = L.map((v) => v / m);
    const step = Math.max(1.15, size / 110);
    const out: { x: number; y: number; r: number; o: number }[] = [];
    for (let y = 0; y < size; y += step) {
      for (let x = 0; x < size; x += step) {
        const px = x + (rand() - 0.5) * step, py = y + (rand() - 0.5) * step;
        const dx = (px - cx) / R, dy = (py - cy) / R;
        const d2 = dx * dx + dy * dy;
        let t = 0;
        if (d2 <= 1) {
          const nz = Math.sqrt(1 - d2);
          const lam = Math.max(0, dx * light[0]! + dy * light[1]! + nz * light[2]!);
          t = kind === 'eclipse' ? 0.93 : 0.05 + Math.pow(1 - lam, 1.35) * 0.9 + Math.pow(1 - nz, 4) * 0.18;
          if (kind === 'keyhole') {
            const inCircle = Math.hypot(dx, dy + 0.18) < 0.2;
            const inSlot = dy > -0.1 && dy < 0.42 && Math.abs(dx) < 0.07 + (dy + 0.1) * 0.12;
            if (inCircle || inSlot) t = 0;
            else if (Math.hypot(dx, dy + 0.18) < 0.27 || (dy > -0.1 && dy < 0.5 && Math.abs(dx) < 0.14 + (dy + 0.1) * 0.12)) t = Math.min(1, t + 0.45);
          }
        } else if (kind === 'eclipse') {
          // Corona: streaky light that fades outward
          const dist = Math.sqrt(d2);
          const ang = Math.atan2(dy, dx);
          const streak = 0.55 + 0.45 * Math.sin(ang * 9 + seed) * Math.sin(ang * 5 - seed);
          t = Math.max(0, (1 - smooth(1, 1.75, dist)) * 0.55 * streak);
        }
        if (kind === 'ringed') {
          // A tilted ring: dense band, hidden where the planet is in front of it
          const tilt = -0.32;
          const rx = dx * Math.cos(tilt) - dy * Math.sin(tilt);
          const ry = dx * Math.sin(tilt) + dy * Math.cos(tilt);
          const e = Math.hypot(rx / 1.75, ry / 0.42);
          const band = Math.abs(e - 1) < 0.1 ? 0.85 : Math.abs(e - 0.84) < 0.05 ? 0.5 : 0;
          const behind = ry < 0 && d2 <= 1;
          if (band && !behind) t = Math.max(t, band);
        }
        if (t > 0 && rand() < t) out.push({ x: px, y: py, r: (0.32 + t * 0.62) * (size / 120) ** 0.35, o: Math.hypot(px - cx * 0.6, py - cy * 0.5) + rand() * size * 0.25 });
      }
    }
    return out.sort((a, b) => a.o - b.o);
  }, [kind, size, seed]);

  useEffect(() => {
    const c = ref.current;
    const ctx = c?.getContext('2d');
    if (!c || !ctx) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    c.width = size * dpr;
    c.height = size * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, size, size);
    ctx.fillStyle = INK;
    const draw = (a: number, b: number) => {
      ctx.beginPath();
      for (let i = a; i < b; i++) {
        const d = dots[i]!;
        ctx.moveTo(d.x + d.r, d.y);
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
      }
      ctx.fill();
    };
    if (reduced) return draw(0, dots.length);
    let raf = 0, drawn = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, Math.max(0, (now - start) / 1300));
      const target = Math.floor((1 - Math.pow(1 - t, 3)) * dots.length);
      if (target > drawn) {
        draw(drawn, target);
        drawn = target;
      }
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [dots, size, reduced, reprint]);

  return <canvas ref={ref} className={className} style={{ width: size, height: size }} aria-hidden="true" />;
}

/** A chain's mark set in an engraved medallion: hairline rings and a graduated bezel. */
export function Medallion({ family, networkId, size = 40 }: { family: Family; networkId?: string; size?: number }) {
  const ticks = 36;
  return (
    <span className="relative inline-grid place-items-center shrink-0" style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" className="absolute inset-0" aria-hidden="true">
        <circle cx="50" cy="50" r="48" fill="#fff" stroke={INK} strokeWidth="1.6" />
        <circle cx="50" cy="50" r="40" fill="none" stroke={INK} strokeWidth="0.8" />
        {Array.from({ length: ticks }, (_, i) => {
          const a = (i / ticks) * Math.PI * 2;
          const r1 = 41.5, r2 = i % 3 === 0 ? 47 : 44.5;
          return <line key={i} x1={50 + r1 * Math.cos(a)} y1={50 + r1 * Math.sin(a)} x2={50 + r2 * Math.cos(a)} y2={50 + r2 * Math.sin(a)} stroke={INK} strokeWidth={i % 3 === 0 ? 0.9 : 0.5} />;
        })}
      </svg>
      <span className="relative">{networkId ? <NetworkLogo networkId={networkId} family={family} size={size * 0.52} /> : <FamilyLogo family={family} size={size * 0.52} />}</span>
    </span>
  );
}

/** A stippled planet with chain medallions on tilted elliptical orbits. */
export function Orrery({ size = 220, families = ['evm', 'solana', 'stellar'] as Family[], seed = 7, period = 14 }: { size?: number; families?: Family[]; seed?: number; period?: number }) {
  const reduced = useReducedMotion();
  const [t, setT] = useState(0);
  useAnimationFrame((ms) => {
    if (!reduced) setT(ms / 1000);
  });
  const a = size * 0.46, b = size * 0.15, tilt = -14;
  const rad = (tilt * Math.PI) / 180;
  const med = Math.max(22, size * 0.15);
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} className="absolute inset-0" aria-hidden="true">
        <g transform={`rotate(${tilt} ${size / 2} ${size / 2})`} fill="none" stroke={INK}>
          <ellipse cx={size / 2} cy={size / 2} rx={a} ry={b} strokeWidth="0.9" strokeDasharray="1.5 3.5" />
          <ellipse cx={size / 2} cy={size / 2} rx={a * 0.74} ry={b * 1.55} strokeWidth="0.6" opacity="0.5" />
        </g>
      </svg>
      {families.map((f, i) => {
        const ang = (t / period) * Math.PI * 2 + (i * Math.PI * 2) / families.length;
        const ex = a * Math.cos(ang), ey = b * Math.sin(ang);
        const x = size / 2 + ex * Math.cos(rad) - ey * Math.sin(rad);
        const y = size / 2 + ex * Math.sin(rad) + ey * Math.cos(rad);
        const front = Math.sin(ang) > 0;
        const s = 0.82 + 0.18 * Math.sin(ang);
        return (
          <div key={f} className="absolute" style={{ left: x - med / 2, top: y - med / 2, zIndex: front ? 3 : 1, transform: `scale(${s})` }}>
            <Medallion family={f} size={med} />
          </div>
        );
      })}
      <div className="absolute inset-0 grid place-items-center" style={{ zIndex: 2 }}>
        <Stipple kind="sphere" size={size * 0.62} seed={seed} />
      </div>
    </div>
  );
}

/** Orion as drawn in an old atlas: seven stars, hairline figure, tiny italic names. */
const ORION_STARS: [string, number, number, number][] = [
  ['Betelgeuse', 0.28, 0.16, 3.4],
  ['Bellatrix', 0.72, 0.22, 2.4],
  ['Alnitak', 0.42, 0.5, 2.2],
  ['Alnilam', 0.5, 0.48, 2.4],
  ['Mintaka', 0.58, 0.46, 2.1],
  ['Saiph', 0.33, 0.84, 2.3],
  ['Rigel', 0.74, 0.8, 3.4],
];
const ORION_LINES = [[0, 1], [0, 2], [1, 4], [2, 3], [3, 4], [2, 5], [4, 6], [5, 6]];

export function Constellation({ size = 120, labels = true, draw = true }: { size?: number; labels?: boolean; draw?: boolean }) {
  const reduced = useReducedMotion();
  const P = (i: number) => [ORION_STARS[i]![1] * size, ORION_STARS[i]![2] * size] as const;
  return (
    <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} aria-hidden="true">
      {ORION_LINES.map(([a, b], i) => {
        const [x1, y1] = P(a!), [x2, y2] = P(b!);
        return (
          <motion.line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={INK} strokeWidth={0.7} strokeDasharray="2 2.5"
            initial={draw && !reduced ? { pathLength: 0, opacity: 0 } : false} animate={{ pathLength: 1, opacity: 0.7 }} transition={{ duration: 0.8, delay: 0.2 + i * 0.12 }} />
        );
      })}
      {ORION_STARS.map(([name, x, y, r], i) => (
        <g key={name}>
          <motion.circle cx={x * size} cy={y * size} r={r * (size / 120)} fill={name === 'Betelgeuse' ? BETEL : name === 'Rigel' ? RIGEL : INK}
            initial={!reduced ? { scale: 0 } : false} animate={{ scale: 1 }} style={{ transformBox: 'fill-box', transformOrigin: 'center' }} transition={{ delay: 0.1 + i * 0.08, type: 'spring', stiffness: 260, damping: 14 }} />
          {labels && size >= 110 && (
            <text x={x * size + 5} y={y * size - 4} fontFamily="Gloock, Georgia, serif" fontStyle="italic" fontSize={size / 22} fill={INK} opacity={0.6}>
              {name}
            </text>
          )}
        </g>
      ))}
    </svg>
  );
}

/** A slowly turning astrolabe: graduated rings around Orion. */
export function Astrolabe({ size = 140 }: { size?: number }) {
  const reduced = useReducedMotion();
  const ring = (r: number, ticks: number, w: number) =>
    Array.from({ length: ticks }, (_, i) => {
      const a = (i / ticks) * Math.PI * 2;
      const long = i % 5 === 0;
      return <line key={i} x1={50 + r * Math.cos(a)} y1={50 + r * Math.sin(a)} x2={50 + (r - (long ? 4 : 2)) * Math.cos(a)} y2={50 + (r - (long ? 4 : 2)) * Math.sin(a)} stroke={INK} strokeWidth={long ? w : w * 0.6} />;
    });
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <motion.svg viewBox="0 0 100 100" className="absolute inset-0" animate={reduced ? undefined : { rotate: 360 }} transition={{ duration: 80, repeat: Infinity, ease: 'linear' }} aria-hidden="true">
        <circle cx="50" cy="50" r="48" fill="#fff" stroke={INK} strokeWidth="1.2" />
        <circle cx="50" cy="50" r="44" fill="none" stroke={INK} strokeWidth="0.5" />
        {ring(48, 60, 0.8)}
      </motion.svg>
      <motion.svg viewBox="0 0 100 100" className="absolute inset-0" animate={reduced ? undefined : { rotate: -360 }} transition={{ duration: 50, repeat: Infinity, ease: 'linear' }} aria-hidden="true">
        <circle cx="50" cy="50" r="38" fill="none" stroke={INK} strokeWidth="0.7" strokeDasharray="0.8 2" />
        <ellipse cx="50" cy="50" rx="38" ry="14" fill="none" stroke={INK} strokeWidth="0.5" />
        <line x1="12" y1="50" x2="88" y2="50" stroke={INK} strokeWidth="0.4" />
        <line x1="50" y1="12" x2="50" y2="88" stroke={INK} strokeWidth="0.4" />
      </motion.svg>
      <div className="absolute inset-0 grid place-items-center">
        <Constellation size={size * 0.56} labels={false} />
      </div>
    </div>
  );
}

/** A stippled comet crossing on a loop: used for "in flight". */
export function Comet({ width = 120, height = 40 }: { width?: number; height?: number }) {
  const reduced = useReducedMotion();
  const dots = useMemo(() => {
    const r = rng(42);
    return Array.from({ length: 90 }, () => {
      const t = Math.pow(r(), 0.7);
      return { x: -t * width * 0.7, y: (r() - 0.5) * t * height * 0.55 + t * height * 0.12, rr: (1 - t) * 1.6 + 0.35, o: 1 - t * 0.85 };
    });
  }, [width, height]);
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true" style={{ overflow: 'hidden' }}>
      <motion.g initial={{ x: width * 0.2 }} animate={reduced ? { x: width * 0.75 } : { x: [width * 0.1, width * 1.25] }} transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}>
        <g transform={`translate(0 ${height * 0.42})`}>
          {dots.map((d, i) => (
            <circle key={i} cx={d.x} cy={d.y} r={d.rr} fill={INK} opacity={d.o} />
          ))}
          <circle cx={2} cy={0} r={4} fill={RIGEL} />
          <circle cx={2} cy={0} r={7} fill="none" stroke={INK} strokeWidth={0.7} />
        </g>
      </motion.g>
    </svg>
  );
}

/** Engraved starburst with a serif word: shown when something lands. */
export function Starburst({ show, word }: { show: boolean; word?: string }) {
  const reduced = useReducedMotion();
  const rays = 56;
  return (
    <AnimatePresence>
      {show && (
        <motion.div className="pointer-events-none absolute inset-0 z-40 grid place-items-center bg-paper/70 backdrop-blur-[1px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="relative w-[240px] h-[240px] grid place-items-center">
            <svg viewBox="0 0 200 200" className="absolute inset-0" aria-hidden="true">
              {Array.from({ length: rays }, (_, i) => {
                const a = (i / rays) * Math.PI * 2;
                const long = i % 4 === 0;
                const r1 = 34, r2 = long ? 98 : 72;
                return (
                  <motion.line key={i} x1={100 + r1 * Math.cos(a)} y1={100 + r1 * Math.sin(a)} x2={100 + r2 * Math.cos(a)} y2={100 + r2 * Math.sin(a)}
                    stroke={i % 14 === 0 ? BETEL : i % 14 === 7 ? RIGEL : INK} strokeWidth={long ? 0.9 : 0.5}
                    initial={reduced ? false : { pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.7, delay: (i % 8) * 0.03, ease: [0.22, 1, 0.36, 1] }} />
                );
              })}
              <circle cx="100" cy="100" r="30" fill="#f6f5f2" stroke={INK} strokeWidth="0.8" />
            </svg>
            <motion.span className="relative font-serif text-[34px] italic" initial={reduced ? false : { scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 14, delay: 0.15 }}>
              {word}
            </motion.span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** A small italic annotation with a leader line, like a label in an old atlas. */
export function Annotation({ children, tone = 'ink' }: { children: React.ReactNode; tone?: 'ink' | 'bad' | 'accent' }) {
  const color = tone === 'bad' ? '#d93b4b' : tone === 'accent' ? RIGEL : '#5a5955';
  return (
    <motion.span className="inline-flex items-center gap-1.5 font-serif italic text-[12px] whitespace-nowrap" style={{ color }} initial={{ opacity: 0, x: 6 }} animate={{ opacity: 1, x: 0 }}>
      {children}
      <svg width="22" height="6" viewBox="0 0 22 6" aria-hidden="true">
        <line x1="0" y1="3" x2="18" y2="3" stroke={color} strokeWidth="0.8" />
        <circle cx="19.5" cy="3" r="1.6" fill={color} />
      </svg>
    </motion.span>
  );
}
