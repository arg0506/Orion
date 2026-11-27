/** Cartoon set dressing: wobbly splats, orbiting coins, confetti bursts and margin doodles. */
import React, { useMemo } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import Ori, { type Mood, type Pose, type Prop } from './Ori';
import { Coin } from './ChainLogo';
import type { Family } from '../../lib/networks';

const INK = '#141414';

function blobPath(seed: number, points = 9, r = 46, wob = 7) {
  let s = seed;
  const rand = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  const pts: [number, number][] = Array.from({ length: points }, (_, i) => {
    const a = (i / points) * Math.PI * 2;
    const rr = r + (rand() - 0.5) * 2 * wob;
    return [50 + rr * Math.cos(a), 50 + rr * Math.sin(a)] as [number, number];
  });
  // Smooth closed curve through the points (Catmull-Rom -> Bezier)
  let d = `M${pts[0]![0]} ${pts[0]![1]}`;
  for (let i = 0; i < points; i++) {
    const p0 = pts[(i - 1 + points) % points]!, p1 = pts[i]!, p2 = pts[(i + 1) % points]!, p3 = pts[(i + 2) % points]!;
    d += ` C${p1[0] + (p2[0] - p0[0]) / 6} ${p1[1] + (p2[1] - p0[1]) / 6} ${p2[0] - (p3[0] - p1[0]) / 6} ${p2[1] - (p3[1] - p1[1]) / 6} ${p2[0]} ${p2[1]}`;
  }
  return d + 'Z';
}

/** A slowly rotating, gently morphing paint splat with halftone dots. */
export function Splat({ color = '#ffe9a8', seed = 7, className, dots = true }: { color?: string; seed?: number; className?: string; dots?: boolean }) {
  const reduced = useReducedMotion();
  const a = useMemo(() => blobPath(seed), [seed]);
  const b = useMemo(() => blobPath(seed + 13), [seed]);
  const pid = `dots-${seed}`;
  return (
    <motion.svg viewBox="0 0 100 100" className={className} aria-hidden="true" animate={reduced ? undefined : { rotate: [0, 360] }} transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}>
      <defs>
        <pattern id={pid} width="5" height="5" patternUnits="userSpaceOnUse">
          <circle cx="2.5" cy="2.5" r="0.9" fill={INK} opacity="0.18" />
        </pattern>
      </defs>
      <motion.path d={a} fill={color} stroke={INK} strokeWidth="1.6" animate={reduced ? undefined : { d: [a, b, a] }} transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }} />
      {dots && <motion.path d={a} fill={`url(#${pid})`} animate={reduced ? undefined : { d: [a, b, a] }} transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }} />}
    </motion.svg>
  );
}

/** Ori on a splat, with optional chain coins orbiting around. */
export function OriScene({
  size = 200,
  pose,
  mood,
  prop,
  splat = '#ffe9a8',
  seed = 7,
  orbit = false,
}: {
  size?: number;
  pose?: Pose;
  mood?: Mood;
  prop?: Prop;
  splat?: string;
  seed?: number;
  orbit?: boolean;
}) {
  const reduced = useReducedMotion();
  const families: Family[] = ['evm', 'solana', 'stellar'];
  return (
    <div className="relative mx-auto" style={{ width: size, height: size }}>
      <Splat color={splat} seed={seed} className="absolute inset-[6%]" />
      <div className="absolute inset-0 grid place-items-center">
        <Ori pose={pose} mood={mood} prop={prop} size={size * 0.72} sparkles />
      </div>
      {orbit &&
        families.map((f, i) => (
          <motion.div
            key={f}
            className="absolute left-1/2 top-1/2"
            style={{ width: 0, height: 0 }}
            animate={reduced ? undefined : { rotate: [i * 120, i * 120 + 360] }}
            transition={{ duration: 9, repeat: Infinity, ease: 'linear' }}
          >
            <motion.div
              style={{ x: size * 0.44, y: 0, translateX: '-50%', translateY: '-50%' }}
              animate={reduced ? undefined : { rotate: [-(i * 120), -(i * 120) - 360] }}
              transition={{ duration: 9, repeat: Infinity, ease: 'linear' }}
            >
              <Coin family={f} size={size * 0.2} />
            </motion.div>
          </motion.div>
        ))}
    </div>
  );
}

const CONFETTI_COLORS = ['#ffd84d', '#ff6b3d', '#5aa9ff', '#5fd1a0', '#ff9db0', '#8f8cff'];

/** A one-shot confetti burst of ink-outlined shapes. */
export function Confetti({ show, count = 26 }: { show: boolean; count?: number }) {
  const reduced = useReducedMotion();
  const bits = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        x: (Math.random() - 0.5) * 320,
        y: -80 - Math.random() * 220,
        r: Math.random() * 540 - 270,
        c: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        shape: i % 3,
        d: Math.random() * 0.15,
      })),
    [show, count]
  );
  if (reduced) return null;
  return (
    <AnimatePresence>
      {show && (
        <div className="pointer-events-none absolute inset-0 z-40 overflow-hidden">
          {bits.map((b, i) => (
            <motion.svg
              key={i}
              width="14"
              height="14"
              viewBox="0 0 14 14"
              className="absolute left-1/2 top-[55%]"
              initial={{ x: 0, y: 0, rotate: 0, opacity: 1, scale: 0.4 }}
              animate={{ x: b.x, y: [0, b.y, b.y + 380], rotate: b.r, opacity: [1, 1, 0], scale: 1 }}
              transition={{ duration: 1.6, delay: b.d, ease: [0.2, 0.7, 0.4, 1] }}
            >
              {b.shape === 0 ? (
                <rect x="2" y="4" width="10" height="6" rx="1.5" fill={b.c} stroke={INK} strokeWidth="1.5" />
              ) : b.shape === 1 ? (
                <circle cx="7" cy="7" r="4.5" fill={b.c} stroke={INK} strokeWidth="1.5" />
              ) : (
                <path d="M7 1 L8.6 5.4 L13 7 L8.6 8.6 L7 13 L5.4 8.6 L1 7 L5.4 5.4 Z" fill={b.c} stroke={INK} strokeWidth="1.2" strokeLinejoin="round" />
              )}
            </motion.svg>
          ))}
        </div>
      )}
    </AnimatePresence>
  );
}

/** Hand-drawn stars and squiggles scattered in the margins. */
export function Doodles({ className }: { className?: string }) {
  const reduced = useReducedMotion();
  // Kept to the margins and lower half so they never sit on headlines.
  const items = [
    { x: '3%', y: '30%', k: 'star', r: -12, s: 0.8 },
    { x: '91%', y: '52%', k: 'squiggle', r: 10, s: 0.9 },
    { x: '92%', y: '30%', k: 'star', r: 18, s: 0.6 },
    { x: '4%', y: '58%', k: 'dot', r: 0, s: 0.8 },
    { x: '8%', y: '86%', k: 'squiggle', r: -20, s: 0.8 },
    { x: '88%', y: '80%', k: 'star', r: 6, s: 0.8 },
  ];
  return (
    <div className={`pointer-events-none absolute inset-0 opacity-70 ${className ?? ''}`} aria-hidden="true">
      {items.map((it, i) => (
        <motion.svg
          key={i}
          width={28 * it.s}
          height={28 * it.s}
          viewBox="0 0 28 28"
          className="absolute"
          style={{ left: it.x, top: it.y, rotate: it.r }}
          animate={reduced ? undefined : { y: [0, -5, 0], rotate: [it.r, it.r + 8, it.r] }}
          transition={{ duration: 3 + i * 0.4, repeat: Infinity, ease: 'easeInOut' }}
        >
          {it.k === 'star' && <path d="M14 3 L16.8 10.6 L25 11.2 L18.6 16.2 L20.8 24 L14 19.6 L7.2 24 L9.4 16.2 L3 11.2 L11.2 10.6 Z" fill="none" stroke={INK} strokeWidth="2" strokeLinejoin="round" />}
          {it.k === 'squiggle' && <path d="M3 18 Q7 8 11 16 T19 14 T26 10" fill="none" stroke={INK} strokeWidth="2.2" strokeLinecap="round" />}
          {it.k === 'dot' && <circle cx="14" cy="14" r="5" fill="#ffd84d" stroke={INK} strokeWidth="2" />}
        </motion.svg>
      ))}
    </div>
  );
}
