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
