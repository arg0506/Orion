import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform, useMotionValue, useSpring, useInView, useReducedMotion, MotionValue } from 'motion/react';
import { ArrowRight, ArrowUpRight, BookOpen, Check, Copy, Github, Puzzle, ShieldCheck, Server, Droplets, ScrollText, FlaskConical, Network } from 'lucide-react';
import StipplePlanet, { BELT, PLANET } from '../components/landing/StipplePlanet';
import { Astrolabe, Constellation, Medallion, Stipple, type Family } from '../components/art/Engraving';
import { Belt, cx, ORION_RING_PATH, ORION_STAR_PATHS } from '../components/ui';

const REPO_URL = 'https://github.com/arg0506/Orion';
const ease = [0.22, 1, 0.36, 1] as const;

/* ───────────────────────── hero art: chains spilling out of the planet ───────────────────────── */

type Spec = { id: string; family: Family; networkId?: string; label: string; x: number; y: number; depth: number };
const MEDALLIONS: Spec[] = [
  { id: 'arb', family: 'evm', networkId: 'evm:arbitrum-sepolia', label: 'Arbitrum', x: 7, y: 36, depth: 0.9 },
  { id: 'sol', family: 'solana', label: 'Solana', x: 21, y: 9, depth: 0.6 },
  { id: 'base', family: 'evm', networkId: 'evm:base', label: 'Base', x: 37, y: 25, depth: 0.4 },
  { id: 'eth', family: 'evm', networkId: 'evm:mainnet', label: 'Ethereum', x: 50.5, y: 4, depth: 0.3 },
  { id: 'op', family: 'evm', networkId: 'evm:op-sepolia', label: 'Optimism', x: 63, y: 27, depth: 0.45 },
  { id: 'xlm', family: 'stellar', label: 'Stellar', x: 79, y: 7, depth: 0.7 },
  { id: 'sep', family: 'evm', networkId: 'evm:sepolia', label: 'Sepolia', x: 93, y: 33, depth: 1 },
];

function FloatingMedallion({ m, i, mx, my, reduced }: { key?: React.Key; m: Spec; i: number; mx: MotionValue<number>; my: MotionValue<number>; reduced: boolean }) {
  const px = useTransform(mx, (v) => v * 22 * m.depth);
  const py = useTransform(my, (v) => v * 16 * m.depth);
  const fromX = `${(PLANET.cx / PLANET.W) * 100 - m.x}%`;
  const fromY = `${(PLANET.openY / PLANET.H) * 100 - m.y}%`;
  return (
    <motion.div className="absolute z-10" style={{ left: `${m.x}%`, top: `${m.y}%`, x: px, y: py }}>
      <motion.div
        initial={reduced ? false : { left: fromX, top: fromY, scale: 0.2, opacity: 0 }}
        animate={{ left: '0%', top: '0%', scale: 1, opacity: 1 }}
        transition={{ delay: 0.9 + i * 0.09, type: 'spring', stiffness: 70, damping: 13 }}
        className="relative -translate-x-1/2 -translate-y-1/2"
      >
        <motion.div
          animate={reduced ? undefined : { y: [0, -7, 0], rotate: [-4, 4, -4] }}
          transition={{ duration: 4 + (i % 3), repeat: Infinity, ease: 'easeInOut', delay: 2 + i * 0.3 }}
          whileHover={{ scale: 1.12 }}
          className="group relative"
        >
          {/* One instance only: duplicated SVG logos would share gradient ids */}
          <span className="block scale-[0.7] sm:scale-100">
            <Medallion family={m.family} networkId={m.networkId} size={60} />
          </span>
          <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-full mt-1.5 font-serif italic text-[13px] text-[#141414] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            {m.label}
          </span>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

export function HeroArt({ className }: { className?: string }) {
  const reduced = !!useReducedMotion();
  const mx = useSpring(useMotionValue(0), { stiffness: 60, damping: 18 });
  const my = useSpring(useMotionValue(0), { stiffness: 60, damping: 18 });
  return (
    <div
      className={cx('relative w-full max-w-[600px] mx-auto', className)}
      onMouseMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        mx.set((e.clientX - r.left) / r.width - 0.5);
        my.set((e.clientY - r.top) / r.height - 0.5);
      }}
      onMouseLeave={() => {
        mx.set(0);
        my.set(0);
      }}
    >
      <StipplePlanet className="w-full h-auto" reduced={reduced} />
      {BELT.map((b, i) => (
        <motion.span
          key={i}
          className="absolute w-[6px] h-[6px] -ml-[3px] -mt-[3px] rounded-full bg-white"
          style={{ left: `${b.x * 100}%`, top: `${b.y * 100}%`, boxShadow: '0 0 10px 3px rgba(255,255,255,0.9)' }}
          initial={{ opacity: 0, scale: 0 }}
          animate={reduced ? { opacity: 1, scale: 1 } : { opacity: [0, 1, 0.55, 1], scale: [0, 1.4, 1, 1] }}
          transition={{ delay: 1.8 + i * 0.15, duration: 1.2 }}
        />
      ))}
      {MEDALLIONS.map((m, i) => (
        <FloatingMedallion key={m.id} m={m} i={i} mx={mx} my={my} reduced={reduced} />
      ))}
    </div>
  );
}

/* ───────────────────────── motion helpers ───────────────────────── */

function Reveal({ children, delay = 0, className, y = 28 }: { key?: React.Key; children: React.ReactNode; delay?: number; className?: string; y?: number }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.8, ease, delay }}
    >
      {children}
    </motion.div>
  );
}

function SplitHeadline({ text, className, delay = 0 }: { text: string; className?: string; delay?: number }) {
  const words = text.split(' ');
  return (
    <span className={className} aria-label={text}>
      {words.map((w, i) => (
        <span key={i} className="inline-block overflow-hidden align-bottom pb-[0.08em] -mb-[0.08em]" aria-hidden="true">
          <motion.span
            className="inline-block"
            initial={{ y: '105%' }}
            whileInView={{ y: '0%' }}
            viewport={{ once: true }}
            transition={{ duration: 0.9, ease, delay: delay + i * 0.08 }}
          >
            {w}
            {i < words.length - 1 ? ' ' : ''}
          </motion.span>
        </span>
      ))}
    </span>
  );
}

/** Paragraph whose words darken one by one as it scrolls through the viewport. */
function ScrollInk({ text }: { text: string }) {
  const ref = useRef<HTMLParagraphElement | null>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 0.85', 'end 0.45'] });
  const words = text.split(' ');
  return (
    <p ref={ref} className="font-serif text-[30px] sm:text-[44px] lg:text-[52px] leading-[1.12] tracking-[-0.01em] text-[#141414]">
      {words.map((w, i) => (
        <InkWord key={i} word={w} progress={scrollYProgress} range={[i / words.length, (i + 1) / words.length]} />
      ))}
    </p>
  );
}

function InkWord({ word, progress, range }: { key?: React.Key; word: string; progress: MotionValue<number>; range: [number, number] }) {
  const opacity = useTransform(progress, range, [0.16, 1]);
  return (
    <motion.span style={{ opacity }} className="inline-block mr-[0.25em]">
      {word}
    </motion.span>
  );
}

function CountUp({ to, decimals = 2 }: { to: number; decimals?: number }) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const inView = useInView(ref, { once: true });
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!inView) return;
    const controls = animate(0, to, { duration: 1.8, ease, onUpdate: setV });
    return () => controls.stop();
  }, [inView, to]);
  return <span ref={ref}>{v.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}</span>;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <Reveal y={12}>
      <p className="flex items-center gap-2 text-[13px] text-[#6b6a66]">
        <Belt className="w-5 text-[#141414]" />
        {children}
      </p>
    </Reveal>
  );
}

/* ───────────────────────── page ───────────────────────── */

const FEATURES = [
  { tile: TILES[2], title: 'Payments that follow the rules', body: "Orion knows Stellar's minimum balance, fees and 28-byte memo limit, and creates the account for you when you pay a brand-new address." },
  { tile: TILES[5], title: 'Activity, as it happens', body: 'History streams straight from Horizon. Incoming payments appear, and your balance updates, the moment they land.' },
  { tile: TILES[0], title: 'A watchlist for any address', body: "Track wallets you don't control, like a team treasury or a judge's account, with totals at a glance." },
  { tile: { ...TILES[3], icon: ShieldCheck }, title: 'Safe by default', body: 'Keys stay in Freighter or MetaMask. Sending is blocked on the wrong network, and errors are shown, never papered over.' },
];

const STEPS = [
  { title: 'Connect Freighter', body: 'Orion asks for your public address. Your secret key never leaves the extension.' },
  { title: 'Fund with Friendbot', body: "New addresses don't exist until they hold 1 XLM. One click brings 10,000 test XLM." },
  { title: 'Send and watch it land', body: 'Pick an address and amount, approve in Freighter, and see it on the ledger seconds later.' },
];

export default function LandingPage() {
  const reduced = !!useReducedMotion();
  const { scrollY } = useScroll();
  const navShadow = useTransform(scrollY, [0, 80], ['0 0 0 rgba(0,0,0,0)', '0 8px 30px -12px rgba(0,0,0,0.25)']);
  const heroArtY = useTransform(scrollY, [0, 700], [0, reduced ? 0 : -60]);

  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });

  return (
    <div className="landing min-h-screen bg-[#f6f5f2] text-[#141414] font-sans overflow-x-hidden selection:bg-[#141414] selection:text-white">
      {/* Nav pill */}
      <motion.nav
        initial={{ y: -24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.7, ease }}
        style={{ boxShadow: navShadow }}
        className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1 rounded-[14px] bg-[#e9e8e4]/85 backdrop-blur-md px-2 py-1.5 border border-black/[0.04]"
        aria-label="Main"
      >
        <Link to="/" aria-label="Orion home" className="h-8 pl-1.5 pr-2.5 flex items-center gap-1.5 rounded-lg hover:bg-black/5">
          <AnimatedMark className="w-[22px] h-[22px] text-[#141414]" delay={0.3} />
          <span className="font-serif text-[17px] leading-none">Orion</span>
        </Link>
        {[
          ['About', () => scrollTo('about')],
          ['Features', () => scrollTo('features')],
        ].map(([label, fn]) => (
          <button key={label as string} onClick={fn as () => void} className="h-8 px-2.5 rounded-lg text-[13px] text-[#3a3a37] hover:bg-black/5">
            {label as string}
          </button>
        ))}
        <a href={REPO_URL} target="_blank" rel="noreferrer" className="h-8 px-2.5 rounded-lg text-[13px] text-[#3a3a37] hover:bg-black/5 inline-flex items-center">
          Source
        </a>
      </motion.nav>

      {/* ───────── Hero ───────── */}
      <section className="relative pt-28 sm:pt-32 text-center px-5">
        <h1 className="font-serif text-[52px] sm:text-[84px] lg:text-[96px] leading-[0.95] tracking-[-0.02em]">
          <SplitHeadline text="Meet Orion," delay={0.15} />
        </h1>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.7, ease }}
          className="mt-4 text-[15px] sm:text-base text-[#3a3a37]"
        >
          and send your first Stellar payment in under a minute.
        </motion.p>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7, duration: 0.7, ease }} className="mt-6">
          <Link
            to="/terminal"
            className="group inline-flex items-center gap-2 h-11 px-5 rounded-[12px] bg-[#141414] text-white text-[15px] font-medium shadow-[0_8px_20px_-10px_rgba(0,0,0,0.6)] hover:bg-black transition-colors"
          >
            <Wallet size={17} />
            Open wallet
            <ArrowRight size={15} className="w-0 opacity-0 -ml-2 group-hover:w-[15px] group-hover:opacity-100 group-hover:ml-0 transition-all" />
          </Link>
        </motion.div>

        <motion.div style={{ y: heroArtY }} className="mt-8 sm:mt-10">
          <HeroArt />
        </motion.div>
      </section>

      {/* ───────── About ───────── */}
      <section id="about" className="px-5 py-28 sm:py-40">
        <div className="max-w-4xl mx-auto">
          <SectionLabel>About</SectionLabel>
          <div className="mt-8">
            <ScrollInk text="Orion is a calm window onto the Stellar testnet. Connect a wallet, fund it, send a payment and watch it land, without jargon and without a single made-up number." />
          </div>
        </div>
      </section>

      {/* ───────── Features ───────── */}
      <section id="features" className="px-5 pb-28 sm:pb-40">
        <div className="max-w-5xl mx-auto">
          <SectionLabel>Features</SectionLabel>
          <h2 className="mt-6 font-serif text-[38px] sm:text-[60px] leading-[1] tracking-[-0.02em] max-w-3xl">
            <SplitHeadline text="Everything a testnet payment needs." />
          </h2>
          <div className="mt-14 grid sm:grid-cols-2 gap-x-10 gap-y-14">
            {FEATURES.map((f, i) => {
              const Icon = f.tile.icon;
              return (
                <Reveal key={f.title} delay={(i % 2) * 0.12}>
                  <motion.span
                    initial={{ rotate: -20, scale: 0.6, opacity: 0 }}
                    whileInView={{ rotate: f.tile.rot, scale: 1, opacity: 1 }}
                    viewport={{ once: true }}
                    whileHover={{ rotate: 0, scale: 1.08 }}
                    transition={{ type: 'spring', stiffness: 120, damping: 12, delay: 0.15 + (i % 2) * 0.12 }}
                    className="inline-grid place-items-center w-14 h-14 rounded-[16px] shadow-[0_10px_24px_-12px_rgba(0,0,0,0.4)] ring-1 ring-black/5"
                    style={{ background: f.tile.bg, color: f.tile.fg }}
                  >
                    <Icon size={26} strokeWidth={2.2} />
                  </motion.span>
                  <h3 className="mt-6 font-serif text-[26px] sm:text-[30px] leading-tight">{f.title}</h3>
                  <p className="mt-3 text-[16px] leading-relaxed text-[#5a5955] max-w-md">{f.body}</p>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ───────── How it works: a constellation that draws itself ───────── */}
      <HowItWorks />

      {/* ───────── Preview ───────── */}
      <section className="px-5 py-28 sm:py-40">
        <div className="max-w-5xl mx-auto grid lg:grid-cols-2 gap-14 items-center">
          <div>
            <SectionLabel>The wallet</SectionLabel>
            <h2 className="mt-6 font-serif text-[38px] sm:text-[56px] leading-[1] tracking-[-0.02em]">
              <SplitHeadline text="Ink on paper, numbers that count." />
            </h2>
            <Reveal delay={0.2}>
              <p className="mt-5 text-[16px] leading-relaxed text-[#5a5955] max-w-md">
                The wallet looks just like this page. Your balance is set big in serif, money coming in is Rigel blue, money going out is Betelgeuse orange, and everything else stays out of your way.
              </p>
              <Link to="/terminal" className="mt-7 inline-flex items-center gap-1.5 text-[15px] font-medium border-b border-[#141414] pb-0.5 hover:gap-2.5 transition-all">
                Open the wallet <ArrowUpRight size={16} />
              </Link>
            </Reveal>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 60, rotate: 3 }}
            whileInView={{ opacity: 1, y: 0, rotate: -1.5 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 1.1, ease }}
            className="relative rounded-[28px] bg-white border border-[#e4e2dc] p-6 sm:p-7 shadow-[0_40px_80px_-40px_rgba(20,20,20,0.45)]"
          >
            <div className="flex items-center justify-between text-[13px]">
              <span className="text-[#5a5955]">Testnet balance</span>
              <span className="rounded-full bg-[#efede8] px-2.5 py-0.5 text-[#5a5955]">Example</span>
            </div>
            <p className="font-serif text-[52px] sm:text-[64px] leading-none mt-3 tabular-nums tracking-[-0.03em]">
              <CountUp to={10000} /> <span className="text-2xl text-[#5a5955] tracking-normal">XLM</span>
            </p>
            <ul className="mt-6 divide-y divide-[#e4e2dc]">
              {[
                { inc: true, who: 'GDF7…MHHP', amt: '+250.00', when: 'just now' },
                { inc: false, who: 'GCAK…EYFP', amt: '−1,200.00', when: '2 h ago' },
                { inc: true, who: 'Friendbot', amt: '+10,000.00', when: '2 d ago', fund: true },
              ].map((r, i) => (
                <motion.li
                  key={r.who}
                  initial={{ opacity: 0, x: 24 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.5 + i * 0.15, duration: 0.6, ease }}
                  className="flex items-center gap-3 py-3"
                >
                  <span className={cx('tile w-10 h-10', r.fund ? 'bg-[linear-gradient(160deg,#fff,#eef7f1)] text-[#1f9d5c]' : r.inc ? 'bg-[linear-gradient(160deg,#7cc0ff,#2f7cf0)] text-white' : 'bg-[linear-gradient(160deg,#fff,#f2f0ea)] text-[#e8622f]')}>
                    {r.fund ? <Droplets size={15} /> : r.inc ? <ArrowDownLeft size={15} /> : <ArrowUpRight size={15} />}
                  </span>
                  <span className="flex-1 min-w-0 text-left">
                    <span className="block text-sm">
                      {r.inc ? 'Received from' : 'Sent to'} <span className="font-mono text-[13px]">{r.who}</span>
                    </span>
                    <span className="block text-[12px] text-[#8a8984]">{r.when}</span>
                  </span>
                  <span className={cx('font-serif text-[18px] tabular-nums', r.inc ? 'text-[#2f6fe0]' : '')}>{r.amt}</span>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        </div>
      </section>

      {/* ───────── Playground marquee ───────── */}
      <section className="py-20 sm:py-28 border-y border-black/[0.06] overflow-hidden">
        <div className="flex whitespace-nowrap" aria-hidden="true">
          <motion.div
            className="flex shrink-0 font-serif text-[64px] sm:text-[110px] leading-none tracking-[-0.02em]"
            animate={reduced ? undefined : { x: ['0%', '-50%'] }}
            transition={{ duration: 38, repeat: Infinity, ease: 'linear' }}
          >
            {[0, 1].map((k) => (
              <span key={k} className="flex shrink-0">
                {['Soroban', 'Freighter', 'Horizon', 'Friendbot', 'XLM', 'Testnet'].map((w, i) => (
                  <span key={w} className={cx('px-6 sm:px-10 flex items-center gap-6 sm:gap-10', i % 2 ? 'text-transparent [-webkit-text-stroke:1.5px_#141414]' : '')}>
                    {w}
                    <Belt className="w-10 sm:w-16 text-[#141414]" />
                  </span>
                ))}
              </span>
            ))}
          </motion.div>
        </div>
        <Reveal className="max-w-5xl mx-auto px-5 mt-14 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div className="max-w-xl">
            <p className="flex items-center gap-2 text-[13px] text-[#6b6a66]">
              <FlaskConical size={15} /> Playground
            </p>
            <p className="mt-3 font-serif text-[28px] sm:text-[34px] leading-tight">See how a smart contract goes from code to deploy.</p>
            <p className="mt-3 text-[15px] text-[#5a5955] leading-relaxed">
              Step through Soroban and Solidity templates, contract calls, events and a CI pipeline. It's a guided simulation in your browser, so nothing is deployed.
            </p>
          </div>
          <Link to="/developer" className="shrink-0 inline-flex items-center gap-2 h-11 px-5 rounded-[12px] border border-[#141414] text-[15px] font-medium hover:bg-[#141414] hover:text-white transition-colors">
            Open playground <ArrowRight size={15} />
          </Link>
        </Reveal>
      </section>

      {/* ───────── Final CTA ───────── */}
      <FinalCta />

      <footer className="px-5 pb-10">
        <div className="max-w-5xl mx-auto pt-8 border-t border-black/[0.06] flex flex-col sm:flex-row gap-4 justify-between text-[13px] text-[#6b6a66]">
          <span className="flex items-center gap-2">
            <AnimatedMark className="w-5 h-5 text-[#141414]" inView /> Orion · Built by Arpan Roy · Test networks only, tokens have no real value
          </span>
          <span className="flex gap-5">
            <a href={REPO_URL} target="_blank" rel="noreferrer" className="hover:text-[#141414] inline-flex items-center gap-1">
              <Github size={14} /> GitHub
            </a>
            <a href="https://developers.stellar.org" target="_blank" rel="noreferrer" className="hover:text-[#141414]">
              Stellar docs
            </a>
            <a href="https://www.freighter.app/" target="_blank" rel="noreferrer" className="hover:text-[#141414]">
              Get Freighter
            </a>
          </span>
        </div>
      </footer>
    </div>
  );
}

function HowItWorks() {
  // Three steps = Orion's three belt stars, joined by a line that draws as you scroll in
  const pts = [
    { x: 60, y: 120 },
    { x: 500, y: 80 },
    { x: 940, y: 40 },
  ];
  return (
    <section className="px-5 py-28 sm:py-40 bg-[#efede8]">
      <div className="max-w-5xl mx-auto">
        <SectionLabel>How it works</SectionLabel>
        <h2 className="mt-6 font-serif text-[38px] sm:text-[60px] leading-[1] tracking-[-0.02em] max-w-3xl">
          <SplitHeadline text="Three stars to your first payment." />
        </h2>

        <svg viewBox="0 0 1000 160" className="hidden md:block w-full mt-16 overflow-visible" aria-hidden="true">
          <motion.path
            d={`M${pts[0].x} ${pts[0].y} L${pts[1].x} ${pts[1].y} L${pts[2].x} ${pts[2].y}`}
            fill="none"
            stroke="#141414"
            strokeWidth="1.5"
            strokeDasharray="1 7"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            whileInView={{ pathLength: 1 }}
            viewport={{ once: true, margin: '-120px' }}
            transition={{ duration: 1.8, ease }}
          />
          {pts.map((p, i) => (
            <motion.g
              key={i}
              initial={{ scale: 0, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true, margin: '-120px' }}
              transition={{ delay: 0.2 + i * 0.6, type: 'spring', stiffness: 200, damping: 12 }}
              style={{ transformOrigin: `${p.x}px ${p.y}px` }}
            >
              <circle cx={p.x} cy={p.y} r="22" fill="#141414" opacity="0.06" />
              <circle cx={p.x} cy={p.y} r={i === 1 ? 9 : 7} fill="#141414" />
            </motion.g>
          ))}
        </svg>

        <ol className="mt-12 md:mt-4 grid md:grid-cols-3 gap-10">
          {STEPS.map((s, i) => (
            <Reveal key={s.title} delay={0.3 + i * 0.25}>
              <li className="list-none">
                <span className="font-serif text-[15px] text-[#6b6a66]">Step {i + 1}</span>
                <h3 className="mt-2 font-serif text-[26px] leading-tight">{s.title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-[#5a5955]">{s.body}</p>
              </li>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}

function FinalCta() {
  const reduced = !!useReducedMotion();
  // a small field of twinkling stars, placed deterministically
  const stars = Array.from({ length: 26 }, (_, i) => ({
    x: (i * 37) % 100,
    y: (i * 53) % 100,
    s: 2 + (i % 3),
    d: (i % 7) * 0.4,
  }));
  return (
    <section className="relative px-5 py-32 sm:py-44 text-center overflow-hidden">
      {stars.map((s, i) => (
        <motion.span
          key={i}
          className="absolute rounded-full bg-[#141414]"
          style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.s, height: s.s }}
          initial={{ opacity: 0.15 }}
          animate={reduced ? undefined : { opacity: [0.1, 0.7, 0.1] }}
          transition={{ duration: 3 + (i % 4), repeat: Infinity, delay: s.d }}
          aria-hidden="true"
        />
      ))}
      <div className="relative">
        <AnimatedMark className="w-20 h-20 sm:w-28 sm:h-28 mx-auto mb-10 text-[#141414]" inView />
        <h2 className="font-serif text-[56px] sm:text-[100px] leading-[0.95] tracking-[-0.03em]">
          <SplitHeadline text="Look up," />
          <br />
          <SplitHeadline text="then ship." delay={0.2} />
        </h2>
        <Reveal delay={0.4}>
          <p className="mt-6 text-[16px] text-[#5a5955]">Free, open source and no sign-up. All you need is Freighter set to Testnet.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/terminal" className="inline-flex items-center gap-2 h-12 px-6 rounded-[12px] bg-[#141414] text-white text-[15px] font-medium hover:bg-black transition-colors">
              <Wallet size={17} /> Open wallet
            </Link>
            <a href={REPO_URL} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 h-12 px-6 rounded-[12px] bg-white border border-black/10 text-[15px] font-medium hover:border-black/30 transition-colors">
              <Github size={17} /> View source
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
