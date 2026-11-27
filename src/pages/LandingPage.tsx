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
    <motion.div className={className} initial={{ opacity: 0, y }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-80px' }} transition={{ duration: 0.8, ease, delay }}>
      {children}
    </motion.div>
  );
}

function SplitHeadline({ text, delay = 0 }: { text: string; delay?: number }) {
  const words = text.split(' ');
  return (
    <span aria-label={text}>
      {words.map((w, i) => (
        <span key={i} className="inline-block overflow-hidden align-bottom pb-[0.08em] -mb-[0.08em]" aria-hidden="true">
          <motion.span className="inline-block" initial={{ y: '105%' }} whileInView={{ y: '0%' }} viewport={{ once: true }} transition={{ duration: 0.9, ease, delay: delay + i * 0.08 }}>
            {w}
            {i < words.length - 1 ? ' ' : ''}
          </motion.span>
        </span>
      ))}
    </span>
  );
}

function ScrollInk({ text }: { text: string }) {
  const ref = useRef<HTMLParagraphElement | null>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 0.85', 'end 0.45'] });
  const words = text.split(' ');
  return (
    <p ref={ref} className="font-serif text-[30px] sm:text-[44px] lg:text-[52px] leading-[1.12] tracking-[-0.01em]">
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

function Label({ children, center = false }: { children: React.ReactNode; center?: boolean }) {
  return (
    <Reveal y={12}>
      <p className={cx('flex items-center gap-2 text-[13px] text-[#6b6a66]', center && 'justify-center')}>
        <Belt className="w-5 text-[#141414]" />
        {children}
      </p>
    </Reveal>
  );
}

function AnimatedMark({ className, delay = 0, inView = false }: { className?: string; delay?: number; inView?: boolean }) {
  const reduced = !!useReducedMotion();
  const trigger = inView ? 'whileInView' : 'animate';
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
      <motion.path d={ORION_RING_PATH} fill="currentColor" fillRule="evenodd" style={{ transformOrigin: '50px 50px' }}
        initial={reduced ? false : { scale: 0.6, opacity: 0, rotate: -40 }} {...{ [trigger]: { scale: 1, opacity: 1, rotate: 0 } }} viewport={{ once: true }} transition={{ delay, duration: 0.9, ease }} />
      {ORION_STAR_PATHS.map((d, i) => (
        <motion.path key={i} d={d} fill="currentColor" style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
          initial={reduced ? false : { scale: 0, opacity: 0, x: -8, y: 8 }} {...{ [trigger]: { scale: 1, opacity: 1, x: 0, y: 0 } }} viewport={{ once: true }}
          transition={{ delay: delay + 0.45 + i * 0.14, type: 'spring', stiffness: 260, damping: 14 }} />
      ))}
    </svg>
  );
}

function CodeBlock({ code, lang }: { code: string; lang?: string }) {
  const [done, setDone] = useState(false);
  return (
    <div className="relative rounded-[18px] bg-[#141414] text-[#eceae4] overflow-hidden">
      <div className="flex items-center justify-between px-4 h-10 border-b border-white/10 text-[12px] text-white/50">
        <span className="font-mono">{lang}</span>
        <button
          onClick={() => {
            navigator.clipboard.writeText(code);
            setDone(true);
            setTimeout(() => setDone(false), 1200);
          }}
          className="inline-flex items-center gap-1.5 hover:text-white"
        >
          {done ? <Check size={13} /> : <Copy size={13} />}
          {done ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="p-4 sm:p-5 text-[13px] leading-relaxed font-mono overflow-x-auto">{code}</pre>
    </div>
  );
}

/* ───────────────────────── content ───────────────────────── */

const CHAINS: { family: Family; name: string; nets: string; standard: string; path: string }[] = [
  { family: 'evm', name: 'Ethereum & EVM', nets: 'Sepolia, Base, Arbitrum and OP Sepolia, Anvil / Hardhat, custom chains', standard: 'EIP-1193 + EIP-6963', path: "m/44'/60'/0'/0/0" },
  { family: 'solana', name: 'Solana', nets: 'Devnet, Testnet, solana-test-validator', standard: 'Wallet Standard', path: "m/44'/501'/0'/0'" },
  { family: 'stellar', name: 'Stellar', nets: 'Testnet, Quickstart (local)', standard: 'SEP-43 + SEP-53', path: "m/44'/148'/0'" },
];

const SNIPPETS: Record<Family, { lang: string; code: string }> = {
  evm: {
    lang: 'EIP-6963 · works with wagmi, RainbowKit, Web3Modal',
    code: `window.addEventListener('eip6963:announceProvider', (e) => {
  if (e.detail.info.rdns === 'app.orion.wallet') {
    const orion = e.detail.provider;
    orion.request({ method: 'eth_requestAccounts' });
  }
});
window.dispatchEvent(new Event('eip6963:requestProvider'));`,
  },
  solana: {
    lang: 'Wallet Standard · nothing to install',
    code: `// Orion registers itself through the Wallet Standard, so
// @solana/wallet-adapter lists it as "Orion" automatically.
const { wallets } = useWallet();
const orion = wallets.find((w) => w.adapter.name === 'Orion');
await orion.adapter.connect();`,
  },
  stellar: {
    lang: 'SEP-43 · errors are returned, not thrown',
    code: `const { address } = await window.orion.stellar.getAddress();
const { networkPassphrase } = await window.orion.stellar.getNetwork();
const { signedTxXdr, error } = await window.orion.stellar
  .signTransaction(xdr, { networkPassphrase });`,
  },
};

const TOOLS = [
  { icon: Server, title: 'Local nodes, one click', body: 'Anvil / Hardhat on :8545, solana-test-validator on :8899, Stellar Quickstart on :8000. Orion tells you when a node is down.' },
  { icon: Droplets, title: 'Faucets built in', body: 'Friendbot for Stellar, airdrops on Solana devnet, and anvil_setBalance on local EVM. Links for public EVM testnets.' },
  { icon: FlaskConical, title: 'Simulated before you sign', body: 'EVM transactions run through eth_estimateGas first. Reverts, unlimited approvals and setApprovalForAll are called out.' },
  { icon: ScrollText, title: 'Request log', body: 'Every call a dapp made, with params, result, errors and timing. The fastest way to debug a wallet integration.' },
  { icon: Network, title: 'Custom chains', body: 'Dapps can add and switch EVM chains with wallet_addEthereumChain. Mainnets stay hidden until you turn them on.' },
  { icon: ShieldCheck, title: 'Honest by default', body: 'No fake balances, no simulated wallets. If a node is unreachable, Orion says so.' },
];

/* ───────────────────────── page ───────────────────────── */

export default function LandingPage() {
  const reduced = !!useReducedMotion();
  const { scrollY } = useScroll();
  const navShadow = useTransform(scrollY, [0, 80], ['0 0 0 rgba(0,0,0,0)', '0 8px 30px -12px rgba(0,0,0,0.25)']);
  const heroArtY = useTransform(scrollY, [0, 700], [0, reduced ? 0 : -60]);
  const [tab, setTab] = useState<Family>('evm');
  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });

  return (
    <div className="landing min-h-screen bg-[#f6f5f2] text-[#141414] font-sans overflow-x-hidden selection:bg-[#141414] selection:text-white">
      {/* Nav pill */}
      <motion.nav
        initial={{ y: -24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.7, ease }}
        style={{ boxShadow: navShadow }}
        className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-0.5 rounded-[14px] bg-[#e9e8e4]/85 backdrop-blur-md px-1.5 py-1.5 border border-black/[0.04]"
        aria-label="Main"
      >
        <Link to="/" aria-label="Orion home" className="h-8 pl-1.5 pr-2.5 flex items-center gap-1.5 rounded-lg hover:bg-black/5">
          <AnimatedMark className="w-[22px] h-[22px] text-[#141414]" delay={0.3} />
          <span className="font-serif text-[17px] leading-none">Orion</span>
        </Link>
        <button onClick={() => scrollTo('chains')} className="hidden sm:block h-8 px-2.5 rounded-lg text-[13px] text-[#3a3a37] hover:bg-black/5">Chains</button>
        <button onClick={() => scrollTo('tools')} className="hidden sm:block h-8 px-2.5 rounded-lg text-[13px] text-[#3a3a37] hover:bg-black/5">Tools</button>
        <Link to="/docs" className="h-8 px-2.5 rounded-lg text-[13px] text-[#3a3a37] hover:bg-black/5 inline-flex items-center">Docs</Link>
        <a href={REPO_URL} target="_blank" rel="noreferrer" className="h-8 px-2.5 rounded-lg text-[13px] text-[#3a3a37] hover:bg-black/5 inline-flex items-center">Source</a>
      </motion.nav>

      {/* ───────── Hero ───────── */}
      <section className="relative pt-28 sm:pt-32 text-center px-5">
        <h1 className="font-serif text-[52px] sm:text-[84px] lg:text-[96px] leading-[0.95] tracking-[-0.02em]">
          <SplitHeadline text="Meet Orion," delay={0.15} />
        </h1>
        <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55, duration: 0.7, ease }} className="mt-4 text-[15px] sm:text-base text-[#3a3a37]">
          the wallet for every chain you build on.
        </motion.p>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7, duration: 0.7, ease }} className="mt-6 flex flex-wrap justify-center gap-2.5">
          <Link to="/docs?s=install" className="group inline-flex items-center gap-2 h-11 px-5 rounded-[12px] bg-[#141414] text-white text-[15px] font-medium shadow-[0_8px_20px_-10px_rgba(0,0,0,0.6)] hover:bg-black transition-colors">
            <Puzzle size={17} />
            Get the extension
          </Link>
          <Link to="/docs" className="inline-flex items-center gap-2 h-11 px-5 rounded-[12px] bg-white border border-black/10 text-[15px] font-medium hover:border-black/30 transition-colors">
            <BookOpen size={16} />
            Read the docs
          </Link>
        </motion.div>
        <motion.div style={{ y: heroArtY }} className="mt-8 sm:mt-10">
          <HeroArt />
        </motion.div>
      </section>

      {/* ───────── About ───────── */}
      <section id="about" className="px-5 py-28 sm:py-40">
        <div className="max-w-4xl mx-auto">
          <Label>About</Label>
          <div className="mt-8">
            <ScrollInk text="Orion is a browser wallet for people who build on more than one chain. One recovery phrase takes you from Ethereum to Solana to Stellar, with fast sends, real cancels, and tools that tell you the truth." />
          </div>
        </div>
      </section>

      {/* ───────── Chains ───────── */}
      <section id="chains" className="px-5 pb-28 sm:pb-40">
        <div className="max-w-5xl mx-auto">
          <Label>Chains</Label>
          <h2 className="mt-6 font-serif text-[38px] sm:text-[60px] leading-[1] tracking-[-0.02em] max-w-3xl">
            <SplitHeadline text="Three families, one phrase." />
          </h2>
          <Reveal delay={0.1}>
            <p className="mt-5 text-[16px] text-[#5a5955] max-w-2xl leading-relaxed">
              Orion derives the standard address for every chain, so importing your phrase shows the same accounts as MetaMask, Phantom and Freighter.
            </p>
          </Reveal>
          <div className="mt-14 grid md:grid-cols-3 gap-6">
            {CHAINS.map((c, i) => (
              <Reveal key={c.family} delay={i * 0.12}>
                <div className="h-full rounded-[24px] border border-[#e4e2dc] bg-white p-6">
                  <motion.div initial={{ rotate: -30, opacity: 0 }} whileInView={{ rotate: 0, opacity: 1 }} viewport={{ once: true }} transition={{ duration: 1, ease, delay: 0.2 + i * 0.12 }}>
                    <Medallion family={c.family} size={64} />
                  </motion.div>
                  <h3 className="mt-5 font-serif text-[26px] leading-tight">{c.name}</h3>
                  <p className="mt-2 text-[14px] text-[#5a5955] leading-relaxed">{c.nets}</p>
                  <dl className="mt-5 space-y-2 text-[13px]">
                    <div className="flex justify-between gap-3 border-t border-[#e4e2dc] pt-2">
                      <dt className="text-[#8a8984]">Dapp standard</dt>
                      <dd className="text-right">{c.standard}</dd>
                    </div>
                    <div className="flex justify-between gap-3 border-t border-[#e4e2dc] pt-2">
                      <dt className="text-[#8a8984]">Path</dt>
                      <dd className="font-mono text-[12px]">{c.path}</dd>
                    </div>
                  </dl>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── Cancel & speed-up ───────── */}
      <CancelStory />

      {/* ───────── Tools ───────── */}
      <section id="tools" className="px-5 py-28 sm:py-40">
        <div className="max-w-5xl mx-auto">
          <div className="grid lg:grid-cols-[1fr_auto] gap-10 items-end">
            <div>
              <Label>For developers</Label>
              <h2 className="mt-6 font-serif text-[38px] sm:text-[60px] leading-[1] tracking-[-0.02em] max-w-2xl">
                <SplitHeadline text="Built for the testnet you're on today." />
              </h2>
            </div>
            <Reveal className="hidden lg:block">
              <Astrolabe size={160} />
            </Reveal>
          </div>
          <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-12">
            {TOOLS.map((t, i) => {
              const Icon = t.icon;
              return (
                <Reveal key={t.title} delay={(i % 3) * 0.1}>
                  <span className="inline-grid place-items-center w-12 h-12 rounded-full border border-[#141414]">
                    <Icon size={20} strokeWidth={1.6} />
                  </span>
                  <h3 className="mt-5 font-serif text-[24px] leading-tight">{t.title}</h3>
                  <p className="mt-2 text-[15px] leading-relaxed text-[#5a5955]">{t.body}</p>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ───────── Integrate ───────── */}
      <section className="px-5 py-28 sm:py-32 bg-[#efede8]">
        <div className="max-w-5xl mx-auto grid lg:grid-cols-[0.8fr_1.2fr] gap-12 items-start">
          <div className="min-w-0">
            <Label>Integrate</Label>
            <h2 className="mt-6 font-serif text-[38px] sm:text-[52px] leading-[1] tracking-[-0.02em]">
              <SplitHeadline text="Speaks every dapp's language." />
            </h2>
            <Reveal delay={0.15}>
              <p className="mt-5 text-[16px] text-[#5a5955] leading-relaxed">
                Orion announces itself the standard way on each chain, so it sits next to MetaMask or Phantom instead of fighting them for <span className="font-mono text-[14px]">window.ethereum</span>.
              </p>
              <Link to="/docs?s=integrate" className="mt-6 inline-flex items-center gap-1.5 text-[15px] font-medium border-b border-[#141414] pb-0.5 hover:gap-2.5 transition-all">
                Provider API reference <ArrowUpRight size={16} />
              </Link>
            </Reveal>
          </div>
          <Reveal delay={0.1} className="min-w-0">
            <div className="inline-flex p-1 rounded-[14px] bg-[#e2e0da] mb-4">
              {(['evm', 'solana', 'stellar'] as Family[]).map((f) => (
                <button key={f} onClick={() => setTab(f)} className={cx('relative h-9 px-4 rounded-[10px] text-[14px] flex items-center gap-2', tab === f ? 'text-[#141414]' : 'text-[#5a5955]')}>
                  {tab === f && <motion.span layoutId="code-tab" className="absolute inset-0 rounded-[10px] bg-white shadow-sm" transition={{ type: 'spring', stiffness: 380, damping: 32 }} />}
                  <span className="relative">{f === 'evm' ? 'EVM' : f === 'solana' ? 'Solana' : 'Stellar'}</span>
                </button>
              ))}
            </div>
            <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease }}>
              <CodeBlock code={SNIPPETS[tab].code} lang={SNIPPETS[tab].lang} />
            </motion.div>
          </Reveal>
        </div>
      </section>

      {/* ───────── Preview ───────── */}
      <section className="px-5 py-28 sm:py-40 overflow-hidden">
        <div className="max-w-5xl mx-auto text-center">
          <Label center>The extension</Label>
          <h2 className="mt-6 font-serif text-[38px] sm:text-[60px] leading-[1] tracking-[-0.02em]">
            <SplitHeadline text="Ink on paper, in your toolbar." />
          </h2>
          <div className="relative mt-16 h-[440px] sm:h-[520px]">
            {[
              { src: '/screens/04-home-local.png', rot: -9, x: '-118%', d: 0.1 },
              { src: '/screens/05-pending.png', rot: 0, x: '-50%', d: 0 },
              { src: '/screens/07-cancelled.png', rot: 9, x: '18%', d: 0.2 },
            ].map((s, i) => (
              <motion.img
                key={s.src}
                src={s.src}
                alt={['The wallet on a local chain', 'A pending payment with Speed up and Cancel', 'The cancellation confirmed'][i]}
                className="absolute left-1/2 top-0 w-[240px] sm:w-[300px] rounded-[22px] border border-[#e4e2dc] shadow-[0_40px_80px_-40px_rgba(20,20,20,0.45)] bg-white"
                style={{ zIndex: i === 1 ? 2 : 1 }}
                initial={{ x: '-50%', rotate: 0, y: 60, opacity: 0 }}
                whileInView={{ x: s.x, rotate: s.rot, y: i === 1 ? 0 : 30, opacity: 1 }}
                viewport={{ once: true, margin: '-100px' }}
                transition={{ duration: 1.1, ease, delay: s.d }}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ───────── Final CTA ───────── */}
      <section className="relative px-5 py-32 sm:py-44 text-center overflow-hidden border-t border-black/[0.06]">
        <div className="absolute left-[6%] top-16 opacity-60 hidden md:block">
          <Constellation size={170} />
        </div>
        <div className="absolute right-[8%] bottom-14 opacity-90 hidden md:block">
          <Stipple kind="crescent" size={120} seed={5} />
        </div>
        <div className="relative">
          <AnimatedMark className="w-20 h-20 sm:w-28 sm:h-28 mx-auto mb-10 text-[#141414]" inView />
          <h2 className="font-serif text-[56px] sm:text-[100px] leading-[0.95] tracking-[-0.03em]">
            <SplitHeadline text="Look up," />
            <br />
            <SplitHeadline text="then ship." delay={0.2} />
          </h2>
          <Reveal delay={0.4}>
            <p className="mt-6 text-[16px] text-[#5a5955]">Open source. Testnet-first. Free.</p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link to="/docs?s=install" className="inline-flex items-center gap-2 h-12 px-6 rounded-[12px] bg-[#141414] text-white text-[15px] font-medium hover:bg-black transition-colors">
                <Puzzle size={17} /> Get the extension
              </Link>
              <a href={REPO_URL} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 h-12 px-6 rounded-[12px] bg-white border border-black/10 text-[15px] font-medium hover:border-black/30 transition-colors">
                <Github size={17} /> View source
              </a>
            </div>
          </Reveal>
        </div>
      </section>

      <footer className="px-5 pb-10">
        <div className="max-w-5xl mx-auto pt-8 border-t border-black/[0.06] flex flex-col sm:flex-row gap-4 justify-between text-[13px] text-[#6b6a66]">
          <span className="flex items-center gap-2">
            <AnimatedMark className="w-5 h-5 text-[#141414]" inView /> Orion · Built by Arpan Roy · Not audited, testnets first
          </span>
          <span className="flex flex-wrap gap-5">
            <Link to="/docs" className="hover:text-[#141414]">Docs</Link>
            <Link to="/terminal" className="hover:text-[#141414]">Web dashboard</Link>
            <a href={REPO_URL} target="_blank" rel="noreferrer" className="hover:text-[#141414] inline-flex items-center gap-1">
              <Github size={14} /> GitHub
            </a>
          </span>
        </div>
      </footer>
    </div>
  );
}

/** The cancel race, drawn as a timeline: the replacement overtakes the original and lands first. */
function CancelStory() {
  const ref = useRef<HTMLDivElement | null>(null);
  const inView = useInView(ref, { margin: '-120px' });
  const reduced = !!useReducedMotion();
  const [cycle, setCycle] = useState(0);
  useEffect(() => {
    if (!inView || reduced) return;
    const id = setInterval(() => setCycle((c) => c + 1), 5200);
    return () => clearInterval(id);
  }, [inView, reduced]);
  const run = inView || reduced;

  const rows = [
    { chain: 'EVM', speed: 'Same nonce, fees up 12.5%+', cancel: '0-value self-transfer on the same nonce' },
    { chain: 'Stellar', speed: 'Fee-bump transaction at 10x', cancel: 'Same-sequence no-op at 10x the fee' },
    { chain: 'Solana', speed: 'Priority fee + rebroadcast', cancel: "Can't be cancelled: Orion shows when its blockhash expires" },
  ];

  return (
    <section className="px-5 py-28 sm:py-40 bg-[#141414] text-[#f6f5f2]">
      <div className="max-w-5xl mx-auto">
        <p className="flex items-center gap-2 text-[13px] text-white/50">
          <Belt className="w-5 text-white" />
          Fast, and reversible where the chain allows
        </p>
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
