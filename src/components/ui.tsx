import React, { useState } from 'react';
import { Check, Copy, AlertTriangle, Info, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { SplitWords } from './motion';

/* ───────────── helpers ───────────── */

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ');

export const shortAddress = (addr?: string | null, head = 4, tail = 4) =>
  !addr ? '' : addr.length <= head + tail + 1 ? addr : `${addr.slice(0, head)}…${addr.slice(-tail)}`;

export const formatAmount = (value: string | number, maxDigits = 4) => {
  const n = typeof value === 'string' ? parseFloat(value) : value;
  if (!isFinite(n)) return String(value);
  return n.toLocaleString(undefined, { minimumFractionDigits: Math.min(2, maxDigits), maximumFractionDigits: maxDigits });
};

export const formatUsd = (n: number) =>
  n.toLocaleString(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: n < 1 ? 4 : 2 });

export const timeAgo = (iso: string) => {
  const s = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  if (!isFinite(s)) return '';
  if (s < 45) return 'just now';
  if (s < 3600) return `${Math.round(s / 60)} min ago`;
  if (s < 86400) return `${Math.round(s / 3600)} h ago`;
  if (s < 86400 * 7) return `${Math.round(s / 86400)} d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
};

/* ───────────── signature: Orion's belt ───────────── */

/** Three aligned stars — Alnitak, Alnilam, Mintaka. Used as the brand mark and the active-nav marker. */
export function Belt({ className, glow = false }: { className?: string; glow?: boolean }) {
  return (
    <svg viewBox="0 0 30 10" className={cx('shrink-0', className)} aria-hidden="true">
      <line x1="4" y1="7" x2="26" y2="3" stroke="currentColor" strokeOpacity="0.35" strokeWidth="0.6" />
      {[
        [4, 7, 1.7],
        [15, 5, 2.1],
        [26, 3, 1.5],
      ].map(([x, y, r], i) => (
        <circle key={i} cx={x} cy={y} r={r} fill="currentColor" style={glow ? { filter: 'drop-shadow(0 0 2px currentColor)' } : undefined} />
      ))}
    </svg>
  );
}

/* Orion logo: a high-contrast serif "O" with Orion's belt rising through its counter. */
export const ORION_RING_PATH =
  'M6 50a44 44 0 1 0 88 0a44 44 0 1 0-88 0ZM73.070 43.385A24 35.5 -16 1 0 26.930 56.615A24 35.5 -16 1 0 73.070 43.385Z';
export const ORION_STAR_PATHS = [
  'M36.5 55.3Q38.24 59.76 42.7 61.5Q38.24 63.24 36.5 67.7Q34.76 63.24 30.3 61.5Q34.76 59.76 36.5 55.3Z',
  'M50 41.9Q52.41 48.09 58.6 50.5Q52.41 52.91 50 59.1Q47.59 52.91 41.4 50.5Q47.59 48.09 50 41.9Z',
  'M63.5 33.7Q65.12 37.88 69.3 39.5Q65.12 41.12 63.5 45.3Q61.88 41.12 57.7 39.5Q61.88 37.88 63.5 33.7Z',
];

export function OrionMark({ className, title, starClassName }: { className?: string; title?: string; starClassName?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={cx('shrink-0', className)} role={title ? 'img' : undefined} aria-hidden={title ? undefined : true} aria-label={title}>
      <path d={ORION_RING_PATH} fill="currentColor" fillRule="evenodd" />
      {ORION_STAR_PATHS.map((d, i) => (
        <path key={i} d={d} fill="currentColor" className={starClassName} />
      ))}
    </svg>
  );
}

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex items-center gap-2 text-ink">
      <OrionMark className="w-7 h-7" />
      {!compact && <span className="font-serif text-[22px] leading-none tracking-tight">Orion</span>}
    </span>
  );
}

/* ───────────── layout primitives ───────────── */

export function Card({
  children,
  className,
  as: Tag = 'section',
  padded = true,
  ...rest
}: React.HTMLAttributes<HTMLElement> & { as?: any; padded?: boolean }) {
  return (
    <Tag className={cx('rounded-[24px] border border-line bg-card shadow-card', padded && 'p-5 sm:p-7', className)} {...rest}>
      {children}
    </Tag>
  );
}

export function CardHeader({ title, description, action, icon }: { title: string; description?: React.ReactNode; action?: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 mb-5">
      <div className="min-w-0">
        <h3 className="font-serif text-[24px] leading-tight text-ink flex items-center gap-2.5">
          {icon && <span className="text-muted">{icon}</span>}
          {title}
        </h3>
        {description && <p className="text-[14px] text-muted mt-1.5 leading-relaxed">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function PageHeader({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description?: React.ReactNode; action?: React.ReactNode }) {
  return (
    <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
      <div>
        {eyebrow && (
          <p className="flex items-center gap-2 text-[13px] text-muted mb-3">
            <Belt className="w-5 text-ink" />
            {eyebrow}
          </p>
        )}
        <h1 className="font-serif text-[40px] sm:text-[56px] leading-[1] tracking-[-0.02em] text-ink">
          <SplitWords text={title} />
        </h1>
        {description && <p className="text-[16px] text-muted mt-3 max-w-2xl leading-relaxed">{description}</p>}
      </div>
      {action}
    </header>
  );
}

/* ───────────── controls ───────────── */

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

export function Button({
  variant = 'secondary',
  size = 'md',
  loading = false,
  icon,
  className,
  children,
  disabled,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; size?: 'sm' | 'md' | 'lg'; loading?: boolean; icon?: React.ReactNode }) {
  const variants: Record<ButtonVariant, string> = {
    primary: 'bg-ink text-paper hover:bg-black shadow-[0_8px_20px_-10px_rgba(0,0,0,0.6)]',
    secondary: 'bg-card text-ink border border-line hover:border-line-strong',
    ghost: 'text-muted hover:text-ink hover:bg-black/[0.04]',
    danger: 'text-bad border border-bad/30 hover:bg-bad/10',
  };
  const sizes = { sm: 'h-8 px-3 text-[13px] gap-1.5', md: 'h-10 px-4 text-sm gap-2', lg: 'h-12 px-5 text-[15px] gap-2' };
  return (
    <button
      disabled={disabled || loading}
      className={cx(
        'inline-flex items-center justify-center rounded-[12px] font-medium transition-[background,border-color,color,transform] active:scale-[0.98] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap',
        variants[variant],
        sizes[size],
        className
      )}
      {...rest}
    >
      {loading ? <Loader2 size={16} className="animate-spin" /> : icon}
      {children}
    </button>
  );
}

export function CopyButton({ value, label = 'Copy', toastText = 'Copied', className }: { value: string; label?: string; toastText?: string; className?: string }) {
  const [done, setDone] = useState(false);
  return (
    <Button
      type="button"
      size="sm"
      variant="ghost"
      className={className}
      aria-label={label}
      icon={done ? <Check size={14} className="text-ok" /> : <Copy size={14} />}
      onClick={() => {
        navigator.clipboard.writeText(value);
        setDone(true);
        toast.success(toastText);
        setTimeout(() => setDone(false), 1500);
      }}
    >
      <span className="hidden sm:inline">{done ? 'Copied' : label}</span>
    </Button>
  );
}

export function Field({
  label,
  hint,
  error,
  trailing,
  children,
  htmlFor,
}: {
  label: string;
  hint?: React.ReactNode;
  error?: string;
  trailing?: React.ReactNode;
  children: React.ReactNode;
  htmlFor?: string;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={htmlFor} className="text-[13px] font-medium text-ink/90">
          {label}
        </label>
        {trailing}
      </div>
      {children}
      {error ? (
        <p className="text-[13px] text-bad flex items-center gap-1.5">
          <AlertTriangle size={13} className="shrink-0" />
          {error}
        </p>
      ) : (
        hint && <p className="text-[13px] text-subtle">{hint}</p>
      )}
    </div>
  );
}

export const inputClass = (invalid?: boolean) =>
  cx(
    'w-full h-12 rounded-[12px] bg-paper border px-4 text-[15px] text-ink placeholder:text-subtle transition-colors focus:outline-none focus:bg-card',
    invalid ? 'border-bad/50 focus:border-bad' : 'border-line hover:border-line-strong focus:border-ink',
    'disabled:opacity-50 disabled:cursor-not-allowed'
  );

/* ───────────── status ───────────── */

type Tone = 'neutral' | 'info' | 'ok' | 'warning' | 'bad' | 'in' | 'out';

const toneClasses: Record<Tone, string> = {
  neutral: 'text-muted bg-inset border-line',
  info: 'text-rigel bg-rigel/10 border-rigel/25',
  ok: 'text-ok bg-ok/10 border-ok/25',
  warning: 'text-warn bg-warn/10 border-warn/25',
  bad: 'text-bad bg-bad/10 border-bad/25',
  in: 'text-rigel bg-rigel/10 border-rigel/25',
  out: 'text-betel bg-betel/10 border-betel/25',
};

export function Badge({ tone = 'neutral', children, dot = false }: { tone?: Tone; children: React.ReactNode; dot?: boolean }) {
  return (
    <span className={cx('inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full border text-[12px] font-medium whitespace-nowrap', toneClasses[tone])}>
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}

export function Notice({
  tone = 'info',
  title,
  children,
  action,
}: {
  tone?: 'info' | 'warning' | 'bad' | 'ok';
  title: string;
  children?: React.ReactNode;
  action?: React.ReactNode;
}) {
  const Icon = tone === 'ok' ? CheckCircle2 : tone === 'bad' ? XCircle : tone === 'warning' ? AlertTriangle : Info;
  return (
    <div className={cx('rounded-[20px] border p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4', toneClasses[tone])}>
      <div className="flex items-start gap-3 flex-1 min-w-0">
        <Icon size={18} className="shrink-0 mt-0.5" />
        <div className="min-w-0">
          <p className="font-serif text-[19px] leading-snug text-ink">{title}</p>
          {children && <div className="text-sm text-muted mt-1 leading-relaxed">{children}</div>}
        </div>
      </div>
      {action && <div className="shrink-0 sm:ml-auto">{action}</div>}
    </div>
  );
}

export function Mono({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={cx('font-mono text-[13px] break-all', className)}>{children}</span>;
}

export function Skeleton({ className }: { className?: string; key?: React.Key }) {
  return <span className={cx('block rounded-md bg-black/[0.06] animate-pulse', className)} />;
}

export function EmptyState({ icon, title, children, action }: { icon?: React.ReactNode; title: string; children?: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="text-center py-10 px-4">
      {icon && <div className="mx-auto w-12 h-12 rounded-[14px] grid place-items-center bg-inset text-muted mb-4">{icon}</div>}
      <p className="font-serif text-[22px] text-ink">{title}</p>
      {children && <p className="text-sm text-muted mt-1.5 max-w-sm mx-auto leading-relaxed">{children}</p>}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}
