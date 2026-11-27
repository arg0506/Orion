/**
 * Ori — Orion's mascot. A chubby cartoon star wearing Orion's belt (three studs).
 * Thick ink outlines, rubber-hose limbs, big sneakers, and a hand-drawn "line boil".
 * Every pose / mood / prop is original artwork drawn in code.
 */
import React, { useEffect, useId, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';

export type Pose = 'stand' | 'wave' | 'sit' | 'run' | 'sleep' | 'shh' | 'cheer';
export type Mood = 'happy' | 'excited' | 'sleepy' | 'dizzy' | 'worried' | 'focused';
export type Prop = 'key' | 'can' | 'stop' | 'magnifier' | 'telescope' | 'plug' | 'rocket' | null;

const INK = '#141414';
const BODY = '#ffd84d';
const BODY_SHADE = '#f2b92f';
const SHOE = '#ff6b3d';
const CHEEK = '#ff9db0';
const PAPER = '#ffffff';

// The star's ten vertices (outer R=72, inner r=40, centred at 100,100).
const C = { x: 100, y: 100 };
function starPoints(R = 72, r = 40) {
  const pts: [number, number][] = [];
  for (let i = 0; i < 10; i++) {
    const a = ((-90 + i * 36) * Math.PI) / 180;
    const rad = i % 2 === 0 ? R : r;
    pts.push([C.x + rad * Math.cos(a), C.y + rad * Math.sin(a)]);
  }
  return pts;
}
const STAR = starPoints();
const STAR_PATH = 'M' + STAR.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join(' L') + 'Z';
const SHADE_PATH = 'M' + starPoints(64, 34).map(([x, y]) => `${(x + 5).toFixed(1)} ${(y + 6).toFixed(1)}`).join(' L') + 'Z';

/** Wobbles the outlines a little, three times a second, like hand-inked animation. */
function useBoil(on: boolean) {
  const [seed, setSeed] = useState(1);
  useEffect(() => {
    if (!on) return;
    const id = setInterval(() => setSeed((s) => (s % 3) + 1), 160);
    return () => clearInterval(id);
  }, [on]);
  return seed;
}

function Sparkle({ x, y, s = 1, delay = 0, color = INK }: { x: number; y: number; s?: number; delay?: number; color?: string }) {
  const reduced = useReducedMotion();
  return (
    <motion.path
      d={`M${x} ${y - 8 * s}Q${x + 1.5 * s} ${y - 1.5 * s} ${x + 8 * s} ${y}Q${x + 1.5 * s} ${y + 1.5 * s} ${x} ${y + 8 * s}Q${x - 1.5 * s} ${y + 1.5 * s} ${x - 8 * s} ${y}Q${x - 1.5 * s} ${y - 1.5 * s} ${x} ${y - 8 * s}Z`}
      fill={color}
      style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
      animate={reduced ? undefined : { scale: [0.4, 1.1, 0.4], rotate: [0, 45, 90] }}
      transition={{ duration: 1.8, repeat: Infinity, delay }}
    />
  );
}

function Eyes({ mood, blink }: { mood: Mood; blink: boolean }) {
  if (mood === 'sleepy')
    return (
      <g stroke={INK} strokeWidth={3.5} fill="none" strokeLinecap="round">
        <path d="M78 92 Q86 98 94 92" />
        <path d="M106 92 Q114 98 122 92" />
      </g>
    );
  if (mood === 'dizzy')
    return (
      <g stroke={INK} strokeWidth={3} fill="none" strokeLinecap="round">
        <path d="M86 92 m-7 0 a7 7 0 1 1 7 7 a4 4 0 1 1 -4 -4" />
        <path d="M114 92 m-7 0 a7 7 0 1 1 7 7 a4 4 0 1 1 -4 -4" />
      </g>
    );
  const pupilDx = mood === 'focused' ? 3 : 1;
  const pupilDy = mood === 'focused' ? 2 : 1;
  return (
    <g style={{ transformOrigin: '100px 92px', transform: blink ? 'scaleY(0.1)' : undefined, transition: 'transform 80ms' }}>
      {[86, 114].map((x) => (
        <g key={x}>
          <ellipse cx={x} cy={89} rx={11.5} ry={14.5} fill={PAPER} stroke={INK} strokeWidth={3.5} />
          <circle cx={x + pupilDx} cy={92 + pupilDy} r={mood === 'excited' ? 7.5 : 6.2} fill={INK} />
          <circle cx={x + pupilDx + 2.5} cy={88 + pupilDy} r={2.2} fill={PAPER} />
        </g>
      ))}
      {mood === 'worried' && (
        <g stroke={INK} strokeWidth={3} strokeLinecap="round">
          <path d="M77 76 L93 80" />
          <path d="M123 76 L107 80" />
        </g>
      )}
    </g>
  );
}

function Mouth({ mood }: { mood: Mood }) {
  switch (mood) {
    case 'excited':
      return (
        <g>
          <path d="M89 108 Q100 128 111 108 Z" fill="#c2253f" stroke={INK} strokeWidth={3.5} strokeLinejoin="round" />
          <path d="M94 117 Q100 113 106 117" fill="#ff7c93" />
        </g>
      );
    case 'worried':
      return <path d="M91 115 Q96 110 100 114 Q104 118 109 113" fill="none" stroke={INK} strokeWidth={3.5} strokeLinecap="round" />;
    case 'dizzy':
      return <ellipse cx={100} cy={114} rx={5} ry={6} fill="#c2253f" stroke={INK} strokeWidth={3} />;
    case 'sleepy':
      return <ellipse cx={100} cy={112} rx={3.5} ry={4.5} fill="#c2253f" stroke={INK} strokeWidth={2.5} />;
    case 'focused':
      return <path d="M93 112 L107 110" stroke={INK} strokeWidth={3.5} strokeLinecap="round" />;
    default:
      return <path d="M90 108 Q100 120 110 108" fill="none" stroke={INK} strokeWidth={3.5} strokeLinecap="round" />;
  }
}

function Glove({ x, y, r = 11.5 }: { x: number; y: number; r?: number }) {
  return (
    <g>
      <circle cx={x} cy={y} r={r} fill={PAPER} stroke={INK} strokeWidth={3.5} />
      <path d={`M${x - r * 0.4} ${y - r * 0.2} q${r * 0.2} ${r * 0.5} 0 ${r * 0.7}`} stroke={INK} strokeWidth={2} fill="none" strokeLinecap="round" />
    </g>
  );
}

function Shoe({ x, y, flip = false }: { x: number; y: number; flip?: boolean }) {
  const s = flip ? -1 : 1;
  return (
    <g transform={`translate(${x} ${y}) scale(${s} 1)`}>
      <path d="M-14 0 Q-15 -11 -2 -11 Q8 -11 12 -4 Q19 -2 18 4 L-13 4 Q-15 3 -14 0 Z" fill={SHOE} stroke={INK} strokeWidth={3.5} strokeLinejoin="round" />
      <path d="M-13 1 L17 1" stroke={PAPER} strokeWidth={2.5} strokeLinecap="round" />
      <circle cx={0} cy={-6} r={1.6} fill={PAPER} />
    </g>
  );
}

const hose = { stroke: INK, strokeWidth: 8.5, fill: 'none', strokeLinecap: 'round' as const };

/** Props are drawn relative to the right hand. */
function PropArt({ prop, x, y }: { prop: Prop; x: number; y: number }) {
  const reduced = useReducedMotion();
  if (!prop) return null;
  const T = ({ children, rot = 0 }: { children: React.ReactNode; rot?: number }) => <g transform={`translate(${x} ${y}) rotate(${rot}) scale(1.45)`}>{children}</g>;
  switch (prop) {
    case 'key':
      return (
        <T rot={-25}>
          <circle cx={0} cy={-18} r={10} fill="#ffcf3f" stroke={INK} strokeWidth={3.5} />
          <circle cx={0} cy={-18} r={3.5} fill={PAPER} stroke={INK} strokeWidth={2.5} />
          <path d="M0 -8 L0 18 M0 10 L7 10 M0 16 L6 16" stroke={INK} strokeWidth={4} strokeLinecap="round" />
        </T>
      );
    case 'can':
      return (
        <T rot={-28}>
          <path d="M-14 -16 h22 v20 a4 4 0 0 1 -4 4 h-14 a4 4 0 0 1 -4 -4 Z" fill="#5fd1a0" stroke={INK} strokeWidth={3.5} strokeLinejoin="round" />
          <path d="M8 -10 L26 -22 L28 -18 L10 -4" fill="#5fd1a0" stroke={INK} strokeWidth={3} strokeLinejoin="round" />
          <path d="M-14 -12 q-10 4 -2 14" fill="none" stroke={INK} strokeWidth={3} />
          {[0, 1, 2].map((i) => (
            <motion.ellipse key={i} cx={30 + i * 4} cy={-14} rx={2.5} ry={3.5} fill="#5aa9ff" stroke={INK} strokeWidth={1.5}
              animate={reduced ? undefined : { cy: [-14, 14], opacity: [1, 0] }} transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.3 }} />
          ))}
        </T>
      );
    case 'stop':
      return (
        <T rot={8}>
          <path d="M0 0 L0 34" stroke={INK} strokeWidth={4} strokeLinecap="round" />
          <path d="M-8 -20 L8 -20 L20 -8 L20 8 L8 20 L-8 20 L-20 8 L-20 -8 Z" transform="translate(0 -14) scale(0.95)" fill="#ff4d5e" stroke={INK} strokeWidth={3.5} strokeLinejoin="round" />
          <text x={0} y={-10} textAnchor="middle" fontFamily="Gloock, Georgia, serif" fontSize={11} fill={PAPER}>STOP</text>
        </T>
      );
    case 'magnifier':
      return (
        <T rot={-20}>
          <path d="M0 4 L0 26" stroke={INK} strokeWidth={6} strokeLinecap="round" />
          <circle cx={0} cy={-10} r={14} fill="#bfe3ff" fillOpacity={0.7} stroke={INK} strokeWidth={4} />
          <path d="M-6 -16 q4 -4 9 -2" stroke={PAPER} strokeWidth={3} fill="none" strokeLinecap="round" />
        </T>
      );
    case 'telescope':
      return (
        <T rot={-38}>
          <rect x={-8} y={-34} width={16} height={40} rx={3} fill="#8f8cff" stroke={INK} strokeWidth={3.5} />
          <rect x={-11} y={-40} width={22} height={9} rx={2} fill="#5b55e8" stroke={INK} strokeWidth={3.5} />
          <path d="M-8 -12 h16" stroke={INK} strokeWidth={3} />
        </T>
      );
    case 'plug':
      return (
        <T rot={-10}>
          <path d="M0 12 q-10 18 8 26 q16 6 4 22" stroke={INK} strokeWidth={4} fill="none" strokeLinecap="round" />
          <rect x={-9} y={-10} width={18} height={22} rx={4} fill="#cfccc4" stroke={INK} strokeWidth={3.5} />
          <path d="M-4 -10 v-8 M4 -10 v-8" stroke={INK} strokeWidth={3.5} strokeLinecap="round" />
          <motion.path d="M14 -20 l6 -6 m-2 12 l8 -2 m-14 -14 l2 -8" stroke="#ff4d5e" strokeWidth={3} strokeLinecap="round"
            animate={reduced ? undefined : { opacity: [1, 0, 1] }} transition={{ duration: 0.6, repeat: Infinity }} />
        </T>
      );
    case 'rocket':
      return (
        <T rot={-35}>
          <path d="M0 -34 Q14 -20 10 8 L-10 8 Q-14 -20 0 -34 Z" fill={PAPER} stroke={INK} strokeWidth={3.5} strokeLinejoin="round" />
          <circle cx={0} cy={-12} r={5} fill="#5aa9ff" stroke={INK} strokeWidth={3} />
          <path d="M-10 0 L-18 12 L-9 8 M10 0 L18 12 L9 8" fill="#ff6b3d" stroke={INK} strokeWidth={3} strokeLinejoin="round" />
          <motion.path d="M-6 10 Q0 28 6 10 Z" fill="#ffcf3f" stroke={INK} strokeWidth={2.5}
            animate={reduced ? undefined : { scaleY: [1, 1.5, 1] }} style={{ transformBox: 'fill-box', transformOrigin: 'top' }} transition={{ duration: 0.25, repeat: Infinity }} />
        </T>
      );
  }
  return null;
}

export default function Ori({
  pose = 'stand',
  mood = 'happy',
  prop = null,
  size = 160,
  className,
  sparkles = false,
  shadow = true,
}: {
  pose?: Pose;
  mood?: Mood;
  prop?: Prop;
  size?: number;
  className?: string;
  sparkles?: boolean;
  shadow?: boolean;
}) {
  const reduced = !!useReducedMotion();
  const seed = useBoil(!reduced);
  const filterId = useId().replace(/:/g, '');
  const clipId = `${filterId}-clip`;
  const [blink, setBlink] = useState(false);

  useEffect(() => {
    if (reduced || mood === 'sleepy' || mood === 'dizzy') return;
    let t: ReturnType<typeof setTimeout>;
    const loop = () => {
      t = setTimeout(() => {
        setBlink(true);
        setTimeout(() => setBlink(false), 120);
        loop();
      }, 1800 + Math.random() * 2600);
    };
    loop();
    return () => clearTimeout(t);
  }, [reduced, mood]);

  // Body motion per pose
  const bodyAnim =
    reduced ? undefined
    : pose === 'run' ? { y: [0, -6, 0], rotate: [-4, 4, -4] }
    : pose === 'cheer' ? { y: [0, -14, 0], rotate: [-3, 3, -3] }
    : pose === 'sleep' ? { scale: [1, 1.03, 1] }
    : { y: [0, -4, 0], rotate: [-1.5, 1.5, -1.5] };
  const bodyDur = pose === 'run' ? 0.35 : pose === 'cheer' ? 0.6 : pose === 'sleep' ? 2.4 : 2.6;

  const rightHand = pose === 'wave' ? { x: 184, y: 34 } : pose === 'cheer' ? { x: 178, y: 28 } : pose === 'shh' ? { x: 104, y: 114 } : pose === 'sit' ? { x: 172, y: 120 } : { x: 192, y: 112 };
  const leftHand = pose === 'cheer' ? { x: 18, y: 24 } : pose === 'sit' ? { x: 24, y: 124 } : { x: 8, y: 118 };

  return (
    <svg viewBox="-10 -14 220 244" width={size} height={size * (244 / 220)} className={className} aria-hidden="true" overflow="visible">
      <defs>
        <filter id={filterId} x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves={2} seed={seed} />
          <feDisplacementMap in="SourceGraphic" scale={reduced ? 0 : 2.2} />
        </filter>
        <clipPath id={clipId}>
          <path d={STAR_PATH} />
        </clipPath>
      </defs>

      {shadow && <motion.ellipse cx={100} cy={214} rx={58} ry={7} fill={INK} opacity={0.1} animate={reduced ? undefined : { rx: [58, 50, 58] }} transition={{ duration: bodyDur, repeat: Infinity }} />}

      {pose === 'run' && !reduced && (
        <g stroke={INK} strokeWidth={4} strokeLinecap="round" opacity={0.6}>
          {[70, 100, 130].map((y, i) => (
            <motion.path key={y} d={`M-6 ${y} h-26`} animate={{ x: [0, -14, 0], opacity: [0.8, 0, 0.8] }} transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.12 }} />
          ))}
        </g>
      )}

      <g filter={`url(#${filterId})`}>
        <motion.g style={{ transformOrigin: '100px 200px' }} animate={bodyAnim} transition={{ duration: bodyDur, repeat: Infinity, ease: 'easeInOut' }}>
          {/* Legs */}
          {pose === 'sit' ? (
            <>
              <motion.g style={{ transformOrigin: '70px 150px' }} animate={reduced ? undefined : { rotate: [-12, 12, -12] }} transition={{ duration: 1.4, repeat: Infinity }}>
                <path d="M70 150 Q66 178 64 196" {...hose} />
                <Shoe x={66} y={200} flip />
              </motion.g>
              <motion.g style={{ transformOrigin: '130px 150px' }} animate={reduced ? undefined : { rotate: [12, -12, 12] }} transition={{ duration: 1.4, repeat: Infinity }}>
                <path d="M130 150 Q134 178 136 196" {...hose} />
                <Shoe x={134} y={200} />
              </motion.g>
            </>
          ) : pose === 'sleep' ? (
            <>
              <path d="M66 156 Q58 180 44 190" {...hose} />
              <Shoe x={40} y={194} flip />
              <path d="M134 156 Q142 180 156 190" {...hose} />
              <Shoe x={160} y={194} />
            </>
          ) : (
            <>
              <motion.g style={{ transformOrigin: '72px 150px' }} animate={pose === 'run' && !reduced ? { rotate: [30, -30, 30] } : undefined} transition={{ duration: 0.35, repeat: Infinity }}>
                <path d="M72 150 Q70 176 70 198" {...hose} />
                <Shoe x={66} y={204} flip />
              </motion.g>
              <motion.g style={{ transformOrigin: '128px 150px' }} animate={pose === 'run' && !reduced ? { rotate: [-30, 30, -30] } : undefined} transition={{ duration: 0.35, repeat: Infinity }}>
                <path d="M128 150 Q130 176 130 198" {...hose} />
                <Shoe x={134} y={204} />
              </motion.g>
            </>
          )}

          {/* Left arm */}
          <path d={`M42 84 Q${(42 + leftHand.x) / 2 - 8} ${(84 + leftHand.y) / 2 + 6} ${leftHand.x} ${leftHand.y}`} {...hose} />
          <Glove x={leftHand.x} y={leftHand.y} />

          {/* Body: ink outline, fill, shading, belt */}
          <path d={STAR_PATH} fill={INK} stroke={INK} strokeWidth={22} strokeLinejoin="round" />
          <path d={STAR_PATH} fill={BODY} stroke={BODY} strokeWidth={13} strokeLinejoin="round" />
          <g clipPath={`url(#${clipId})`}>
            <path d={SHADE_PATH} fill={BODY_SHADE} opacity={0.55} transform="translate(10 12)" />
            <rect x={20} y={124} width={160} height={13} fill={INK} transform="rotate(-4 100 130)" />
            <rect x={92} y={122} width={16} height={16} rx={3} fill="#ffcf3f" stroke={INK} strokeWidth={2.5} transform="rotate(-4 100 130)" />
          </g>
          {/* Orion's belt: three studs */}
          {[
            [74, 132],
            [100, 130],
            [126, 128],
          ].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r={i === 1 ? 0 : 3.2} fill={PAPER} />
          ))}
          <path d="M72 46 Q78 40 86 42" stroke={PAPER} strokeWidth={4} fill="none" strokeLinecap="round" opacity={0.8} />

          {/* Face */}
          <ellipse cx={74} cy={106} rx={7} ry={4.5} fill={CHEEK} opacity={0.85} />
          <ellipse cx={126} cy={106} rx={7} ry={4.5} fill={CHEEK} opacity={0.85} />
          <Eyes mood={mood} blink={blink} />
          {pose !== 'shh' && <Mouth mood={mood} />}
          {mood === 'worried' && (
            <motion.path d="M134 70 q6 10 0 14 q-6 -4 0 -14Z" fill="#7cc6ff" stroke={INK} strokeWidth={2.5} animate={reduced ? undefined : { y: [0, 6, 0] }} transition={{ duration: 1.2, repeat: Infinity }} />
          )}

          {/* Right arm (+ prop) */}
          <motion.g
            style={{ transformOrigin: '158px 84px' }}
            animate={pose === 'wave' && !reduced ? { rotate: [-10, 18, -10] } : pose === 'run' && !reduced ? { rotate: [-25, 25, -25] } : undefined}
            transition={{ duration: pose === 'run' ? 0.35 : 0.7, repeat: Infinity, ease: 'easeInOut' }}
          >
            <path d={pose === 'shh' ? `M158 84 Q150 110 ${rightHand.x + 4} ${rightHand.y}` : `M158 84 Q${(158 + rightHand.x) / 2 + 10} ${(84 + rightHand.y) / 2 + (rightHand.y < 84 ? -4 : 10)} ${rightHand.x} ${rightHand.y}`} {...hose} />
            <PropArt prop={prop} x={rightHand.x} y={rightHand.y - 6} />
            <Glove x={rightHand.x} y={rightHand.y} />
          </motion.g>
        </motion.g>
      </g>

      {mood === 'sleepy' && !reduced && (
        <g fontFamily="Gloock, Georgia, serif" fill={INK}>
          {['z', 'Z', 'Z'].map((z, i) => (
            <motion.text key={i} x={150 + i * 14} y={40 - i * 14} fontSize={14 + i * 6} animate={{ opacity: [0, 1, 0], y: [0, -10] }} transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.6 }}>
              {z}
            </motion.text>
          ))}
        </g>
      )}
      {sparkles && (
        <>
          <Sparkle x={8} y={20} s={1.1} />
          <Sparkle x={196} y={150} s={0.8} delay={0.6} color="#ff6b3d" />
          <Sparkle x={24} y={176} s={0.7} delay={1.1} color="#5aa9ff" />
        </>
      )}
    </svg>
  );
}
