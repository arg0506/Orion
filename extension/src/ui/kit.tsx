import React, { useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Check, Copy, Loader2, Wallet, Sun, Sparkles } from 'lucide-react';
import { ORION_RING_PATH, ORION_STAR_PATHS } from '../ui-logo';
import { FamilyLogo } from './art/ChainLogo';
import type { Family } from '../lib/networks';

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ');
export const ease = [0.22, 1, 0.36, 1] as const;
export const short = (a?: string, h = 4, t = 4) => (!a ? '' : a.length <= h + t + 1 ? a : `${a.slice(0, h)}…${a.slice(-t)}`);
export const fmt = (v: string | number, max = 4) => {
  const n = typeof v === 'string' ? Number(v) : v;
  return isFinite(n) ? n.toLocaleString(undefined, { minimumFractionDigits: Math.min(2, max), maximumFractionDigits: max }) : String(v);
};
export const ago = (t: number) => {
  const s = Math.round((Date.now() - t) / 1000);
  if (s < 45) return 'just now';
  if (s < 3600) return `${Math.round(s / 60)} min ago`;
  if (s < 86400) return `${Math.round(s / 3600)} h ago`;
  return new Date(t).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

export function OrionMark({ className, animate = false }: { className?: string; animate?: boolean }) {
  const reduced = useReducedMotion();
  const a = animate && !reduced;
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
      <motion.path d={ORION_RING_PATH} fill="currentColor" fillRule="evenodd" style={{ transformOrigin: '50px 50px' }} initial={a ? { scale: 0.6, opacity: 0, rotate: -40 } : false} animate={{ scale: 1, opacity: 1, rotate: 0 }} transition={{ duration: 0.9, ease }} />
      {ORION_STAR_PATHS.map((d, i) => (
        <motion.path key={i} d={d} fill="currentColor" style={{ transformBox: 'fill-box', transformOrigin: 'center' }} initial={a ? { scale: 0, opacity: 0, x: -6, y: 6 } : false} animate={{ scale: 1, opacity: 1, x: 0, y: 0 }} transition={{ delay: 0.45 + i * 0.14, type: 'spring', stiffness: 260, damping: 14 }} />
      ))}
    </svg>
  );
}

export function Belt({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 30 10" className={className} aria-hidden="true">
      <line x1="4" y1="7" x2="26" y2="3" stroke="currentColor" strokeOpacity="0.35" strokeWidth="0.6" />
      <circle cx="4" cy="7" r="1.7" fill="currentColor" />
      <circle cx="15" cy="5" r="2.1" fill="currentColor" />
      <circle cx="26" cy="3" r="1.5" fill="currentColor" />
    </svg>
  );
}

/** Chain identity tiles, in the landing page's app-icon style. */
export const FAMILY_TILE: Record<Family, { bg: string; fg: string; label: string; glyph: React.ReactNode }> = {
  evm: { bg: 'linear-gradient(160deg,#9aa8ff,#5b62e8)', fg: '#fff', label: 'EVM', glyph: <span className="font-serif text-[15px] leading-none">Ξ</span> },
  solana: { bg: 'linear-gradient(160deg,#7ef0c8,#8f5cff)', fg: '#fff', label: 'Solana', glyph: <span className="font-serif text-[15px] leading-none">◎</span> },
  stellar: { bg: 'linear-gradient(160deg,#ffffff,#eceae4)', fg: '#141414', label: 'Stellar', glyph: <Sparkles size={15} strokeWidth={2.4} /> },
};

export function FamilyTile({ family, size = 28 }: { family: Family; size?: number }) {
  return (
    <span className="tile shrink-0 bg-white" style={{ width: size, height: size, borderRadius: size * 0.32 }}>
      <FamilyLogo family={family} size={size * 0.74} />
    </span>
  );
}

type V = 'primary' | 'secondary' | 'ghost' | 'danger';
export function Button({ variant = 'secondary', size = 'md', loading, icon, className, children, disabled, ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: V; size?: 'sm' | 'md' | 'lg'; loading?: boolean; icon?: React.ReactNode }) {
  const v: Record<V, string> = {
    primary: 'bg-ink text-paper hover:bg-black shadow-[0_8px_18px_-10px_rgba(0,0,0,0.6)]',
    secondary: 'bg-card text-ink border border-line hover:border-line-strong',
    ghost: 'text-muted hover:text-ink hover:bg-black/[0.04]',
    danger: 'text-bad border border-bad/30 hover:bg-bad/[0.06]',
  };
  const s = { sm: 'h-8 px-3 text-[13px] gap-1.5', md: 'h-10 px-4 text-[14px] gap-2', lg: 'h-12 px-5 text-[15px] gap-2' };
  return (
    <button disabled={disabled || loading} className={cx('inline-flex items-center justify-center rounded-[12px] font-medium transition active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap', v[variant], s[size], className)} {...rest}>
      {loading ? <Loader2 size={16} className="animate-spin" /> : icon}
      {children}
    </button>
  );
}

export const inputCls = (bad?: boolean) =>
  cx('w-full h-11 rounded-[12px] bg-card border px-3.5 text-[14px] text-ink placeholder:text-subtle focus:outline-none transition-colors', bad ? 'border-bad/50 focus:border-bad' : 'border-line focus:border-ink');

export function Field({ label, hint, error, trailing, children }: { label: string; hint?: React.ReactNode; error?: string; trailing?: React.ReactNode; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="flex items-center justify-between text-[12px] font-medium text-muted">
        {label}
        {trailing}
      </span>
      {children}
      {error ? <span className="block text-[12px] text-bad">{error}</span> : hint ? <span className="block text-[12px] text-subtle">{hint}</span> : null}
    </label>
  );
}

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cx('rounded-[20px] border border-line bg-card shadow-card', className)}>{children}</div>;
}

const tones = {
  neutral: 'text-muted bg-inset',
  ok: 'text-ok bg-ok/10',
  warn: 'text-warn bg-warn/10',
  bad: 'text-bad bg-bad/10',
  info: 'text-rigel bg-rigel/10',
};
export function Badge({ tone = 'neutral', children, dot }: { tone?: keyof typeof tones; children: React.ReactNode; dot?: boolean }) {
  return (
    <span className={cx('inline-flex items-center gap-1.5 h-[22px] px-2 rounded-full text-[11px] font-medium whitespace-nowrap', tones[tone])}>
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}

export function Copy_({ value, label }: { value: string; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard.writeText(value);
        setDone(true);
        setTimeout(() => setDone(false), 1200);
      }}
      className="inline-flex items-center gap-1.5 h-7 px-2 rounded-[8px] text-[12px] text-muted hover:text-ink hover:bg-black/[0.04]"
      aria-label={label ?? 'Copy'}
    >
      {done ? <Check size={13} className="text-ok" /> : <Copy size={13} />}
      {label}
    </button>
  );
}

export function SplitWords({ text, delay = 0, className }: { text: string; delay?: number; className?: string }) {
  const reduced = useReducedMotion();
  return (
    <span className={className} aria-label={text}>
      {text.split(' ').map((w, i, arr) => (
        <span key={i} className="inline-block overflow-hidden align-bottom pb-[0.1em] -mb-[0.1em]" aria-hidden="true">
          <motion.span className="inline-block" initial={reduced ? false : { y: '105%' }} animate={{ y: '0%' }} transition={{ duration: 0.7, ease, delay: delay + i * 0.06 }}>
            {w}
            {i < arr.length - 1 ? ' ' : ''}
          </motion.span>
        </span>
      ))}
    </span>
  );
}

export function Rise({ children, delay = 0, className }: { key?: React.Key; children: React.ReactNode; delay?: number; className?: string }) {
  const reduced = useReducedMotion();
  return (
    <motion.div className={className} initial={reduced ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease, delay }}>
      {children}
    </motion.div>
  );
}

export function ErrorText({ children }: { children?: React.ReactNode }) {
  if (!children) return null;
  return <p className="text-[12px] text-bad bg-bad/[0.06] rounded-[10px] px-3 py-2 leading-snug">{children}</p>;
}

export { Wallet, Sun };
