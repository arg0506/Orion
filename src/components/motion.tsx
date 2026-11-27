import React from 'react';
import { motion, useReducedMotion } from 'motion/react';

export const ease = [0.22, 1, 0.36, 1] as const;

/** Fades and lifts its children in, on mount or when scrolled into view. */
export function Rise({
  children,
  delay = 0,
  y = 18,
  className,
  inView = false,
}: {
  key?: React.Key;
  children: React.ReactNode;
  delay?: number;
  y?: number;
  className?: string;
  inView?: boolean;
}) {
  const reduced = useReducedMotion();
  const to = { opacity: 1, y: 0 };
  return (
    <motion.div
      className={className}
      initial={reduced ? false : { opacity: 0, y }}
      {...(inView ? { whileInView: to, viewport: { once: true, margin: '-60px' } } : { animate: to })}
      transition={{ duration: 0.7, ease, delay }}
    >
      {children}
    </motion.div>
  );
}

/** Slides a headline up from behind a mask, word by word. */
export function SplitWords({ text, delay = 0, className }: { text: string; delay?: number; className?: string }) {
  const reduced = useReducedMotion();
  const words = text.split(' ');
  return (
    <span className={className} aria-label={text}>
      {words.map((w, i) => (
        <span key={i} className="inline-block overflow-hidden align-bottom pb-[0.1em] -mb-[0.1em]" aria-hidden="true">
          <motion.span
            className="inline-block"
            initial={reduced ? false : { y: '105%' }}
            animate={{ y: '0%' }}
            transition={{ duration: 0.8, ease, delay: delay + i * 0.07 }}
          >
            {w}
            {i < words.length - 1 ? ' ' : ''}
          </motion.span>
        </span>
      ))}
    </span>
  );
}
