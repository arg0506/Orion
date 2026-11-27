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
