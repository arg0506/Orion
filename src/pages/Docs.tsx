import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, useReducedMotion } from 'motion/react';
import { AlertTriangle, ArrowUpRight, Check, Copy, Github, Info, Menu, Search, X } from 'lucide-react';
import { Astrolabe, Constellation, Medallion, Stipple } from '../components/art/Engraving';
import { Belt, OrionMark, cx } from '../components/ui';

const REPO_URL = 'https://github.com/arg0506/Orion';
const ease = [0.22, 1, 0.36, 1] as const;

/* ───────────────────────── building blocks ───────────────────────── */

function Code({ children, lang }: { children: string; lang?: string }) {
  const [done, setDone] = useState(false);
  return (
    <div className="my-5 rounded-[16px] bg-[#141414] text-[#eceae4] overflow-hidden">
      <div className="flex items-center justify-between px-4 h-9 border-b border-white/10 text-[12px] text-white/50">
        <span className="font-mono">{lang ?? 'code'}</span>
        <button
          onClick={() => {
            navigator.clipboard.writeText(children);
            setDone(true);
            setTimeout(() => setDone(false), 1200);
          }}
          className="inline-flex items-center gap-1.5 hover:text-white"
          aria-label="Copy code"
        >
          {done ? <Check size={13} /> : <Copy size={13} />}
          {done ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="p-4 text-[13px] leading-relaxed font-mono overflow-x-auto">{children}</pre>
    </div>
  );
}

const C = ({ children }: { children: React.ReactNode }) => <code className="font-mono text-[0.86em] bg-[#ebe9e4] rounded-[6px] px-1.5 py-0.5">{children}</code>;
const P = ({ children }: { children: React.ReactNode }) => <p className="text-[16px] leading-[1.75] text-[#3a3a37] my-4">{children}</p>;
const H3 = ({ children, id }: { children: React.ReactNode; id?: string }) => (
  <h3 id={id} className="font-serif text-[24px] leading-tight mt-10 mb-2 scroll-mt-24">
    {children}
  </h3>
);
const UL = ({ children }: { children: React.ReactNode }) => <ul className="my-4 space-y-2 text-[16px] leading-[1.7] text-[#3a3a37] list-disc pl-5 marker:text-[#8a8984]">{children}</ul>;
const OL = ({ children }: { children: React.ReactNode }) => <ol className="my-4 space-y-2 text-[16px] leading-[1.7] text-[#3a3a37] list-decimal pl-5 marker:font-serif">{children}</ol>;

function Table({ head, rows }: { head: string[]; rows: React.ReactNode[][] }) {
  return (
    <div className="my-6 overflow-x-auto rounded-[16px] border border-[#e4e2dc] bg-white">
      <table className="w-full text-[14px] border-collapse">
        <thead>
          <tr className="text-left">
            {head.map((h) => (
              <th key={h} className="px-4 py-3 font-medium text-[#5a5955] border-b border-[#e4e2dc] whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="align-top">
              {r.map((cell, j) => (
                <td key={j} className="px-4 py-3 border-b border-[#efede8] leading-relaxed">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Callout({ tone = 'info', title, children }: { tone?: 'info' | 'warn'; title: string; children: React.ReactNode }) {
  const Icon = tone === 'warn' ? AlertTriangle : Info;
  return (
    <div className={cx('my-6 rounded-[16px] border p-4 flex gap-3', tone === 'warn' ? 'border-[#b7791f]/30 bg-[#b7791f]/[0.06]' : 'border-[#2f6fe0]/25 bg-[#2f6fe0]/[0.05]')}>
      <Icon size={18} className={cx('shrink-0 mt-0.5', tone === 'warn' ? 'text-[#b7791f]' : 'text-[#2f6fe0]')} />
      <div>
        <p className="font-serif text-[18px]">{title}</p>
        <div className="text-[15px] leading-relaxed text-[#3a3a37] mt-1">{children}</div>
      </div>
    </div>
  );
}

function Section({ id, eyebrow, title, children, art }: { id: string; eyebrow: string; title: string; children: React.ReactNode; art?: React.ReactNode }) {
  return (
    <section id={id} data-doc-section className="scroll-mt-24 pt-14 first:pt-0 border-t border-[#e4e2dc] first:border-0">
      <div className="flex items-start justify-between gap-6">
        <div>
          <p className="flex items-center gap-2 text-[13px] text-[#8a8984]">
            <Belt className="w-5 text-[#141414]" />
            {eyebrow}
          </p>
          <h2 className="font-serif text-[36px] sm:text-[44px] leading-[1.02] tracking-[-0.01em] mt-3">{title}</h2>
        </div>
        {art && <div className="hidden md:block shrink-0">{art}</div>}
      </div>
      {children}
    </section>
  );
}

/* ───────────────────────── table of contents ───────────────────────── */

const TOC: { group: string; items: { id: string; label: string }[] }[] = [
  { group: 'Start', items: [{ id: 'introduction', label: 'Introduction' }, { id: 'install', label: 'Install' }, { id: 'quickstart', label: 'Quickstart' }] },
  {
    group: 'Using Orion',
    items: [
      { id: 'accounts', label: 'Accounts & recovery phrase' },
      { id: 'networks', label: 'Networks' },
      { id: 'sending', label: 'Sending' },
      { id: 'cancel', label: 'Cancel & speed up' },
      { id: 'sites', label: 'Sites & approvals' },
    ],
  },
  {
    group: 'Developers',
    items: [
      { id: 'integrate', label: 'Dapp integration' },
      { id: 'api-evm', label: 'EVM provider API' },
      { id: 'api-solana', label: 'Solana wallet API' },
      { id: 'api-stellar', label: 'Stellar wallet API' },
      { id: 'errors', label: 'Errors' },
      { id: 'local', label: 'Local development' },
      { id: 'devtools', label: 'Request log & simulation' },
    ],
  },
  {
    group: 'Internals',
    items: [
      { id: 'security', label: 'Security model' },
      { id: 'architecture', label: 'Architecture' },
      { id: 'testing', label: 'Testing' },
      { id: 'troubleshooting', label: 'Troubleshooting' },
      { id: 'roadmap', label: 'Roadmap' },
    ],
  },
];

/* ───────────────────────── page ───────────────────────── */

export default function Docs() {
  const location = useLocation();
  const reduced = useReducedMotion();
  const [active, setActive] = useState('introduction');
  const [query, setQuery] = useState('');
  const [menu, setMenu] = useState(false);
  const mainRef = useRef<HTMLDivElement | null>(null);

  const go = (id: string) => {
    setMenu(false);
    document.getElementById(id)?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
  };

  // Deep links: #/docs?s=install
  useEffect(() => {
    const s = new URLSearchParams(location.search).get('s');
    if (s) setTimeout(() => go(s), 120);
    else window.scrollTo(0, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  // Scrollspy
  useEffect(() => {
    const sections = Array.from(document.querySelectorAll<HTMLElement>('[data-doc-section]'));
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: '-80px 0px -65% 0px' }
    );
    sections.forEach((s) => obs.observe(s));
    return () => obs.disconnect();
  }, []);

  const filtered = useMemo(
    () =>
      TOC.map((g) => ({ ...g, items: g.items.filter((i) => !query || i.label.toLowerCase().includes(query.toLowerCase()) || i.id.includes(query.toLowerCase())) })).filter((g) => g.items.length),
    [query]
  );

  const Sidebar = (
    <nav aria-label="Documentation">
      <label className="relative block mb-6">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8a8984]" />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search docs" className="w-full h-10 rounded-[12px] bg-white border border-[#e4e2dc] pl-9 pr-3 text-[14px] focus:outline-none focus:border-[#141414]" />
      </label>
      {filtered.map((g) => (
        <div key={g.group} className="mb-6">
          <p className="text-[12px] font-medium text-[#8a8984] mb-2 px-3">{g.group}</p>
          <ul>
            {g.items.map((i) => (
              <li key={i.id}>
                <button onClick={() => go(i.id)} className={cx('relative w-full text-left h-9 px-3 rounded-[10px] text-[14px] transition-colors', active === i.id ? 'text-[#141414]' : 'text-[#5a5955] hover:text-[#141414]')}>
                  {active === i.id && <motion.span layoutId="doc-active" className="absolute inset-0 rounded-[10px] bg-white shadow-[0_2px_8px_-3px_rgba(0,0,0,0.15)]" transition={{ type: 'spring', stiffness: 380, damping: 32 }} />}
                  <span className="relative">{i.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ))}
      {!filtered.length && <p className="px-3 text-[14px] text-[#8a8984]">Nothing matches “{query}”.</p>}
    </nav>
  );

  return (
    <div className="min-h-screen bg-[#f6f5f2] text-[#141414] font-sans">
      <header className="sticky top-0 z-40 bg-[#f6f5f2]/85 backdrop-blur-md border-b border-[#e4e2dc]">
        <div className="max-w-7xl mx-auto h-16 px-4 sm:px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-black/5" onClick={() => setMenu(!menu)} aria-label="Open contents">
              {menu ? <X size={18} /> : <Menu size={18} />}
            </button>
            <Link to="/" className="flex items-center gap-2">
              <OrionMark className="w-7 h-7" />
              <span className="font-serif text-[21px] leading-none">Orion</span>
            </Link>
            <span className="text-[#cfccc4]">/</span>
            <span className="text-[15px] text-[#5a5955]">Docs</span>
          </div>
          <div className="flex items-center gap-1 text-[14px]">
            <Link to="/" className="hidden sm:inline-flex h-9 px-3 items-center rounded-[10px] text-[#5a5955] hover:text-[#141414] hover:bg-black/5">Home</Link>
            <a href={REPO_URL} target="_blank" rel="noreferrer" className="inline-flex h-9 px-3 items-center gap-1.5 rounded-[10px] text-[#5a5955] hover:text-[#141414] hover:bg-black/5">
              <Github size={15} /> GitHub
            </a>
          </div>
        </div>
      </header>

      {menu && (
        <motion.div className="lg:hidden fixed inset-x-0 top-16 bottom-0 z-30 bg-[#f6f5f2] overflow-y-auto p-5" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
          {Sidebar}
        </motion.div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 grid lg:grid-cols-[250px_1fr] gap-10">
        <aside className="hidden lg:block sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto py-8 pr-2">{Sidebar}</aside>

        <motion.main ref={mainRef} className="min-w-0 max-w-[760px] py-10 sm:py-14 pb-32" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease }}>
          {/* ── Introduction ── */}
          <Section id="introduction" eyebrow="Start" title="Orion documentation" art={<Constellation size={150} />}>
            <P>
              Orion is a browser-extension wallet for developers who build on more than one chain. One recovery phrase gives you accounts on <strong>Ethereum and EVM chains</strong>, <strong>Solana</strong> and <strong>Stellar</strong>. Dapps find Orion through each ecosystem's standard discovery mechanism, sending is fast by default, and pending transactions can be cancelled or sped up wherever the chain makes that possible.
            </P>
            <div className="my-8 grid sm:grid-cols-3 gap-3">
              {(['evm', 'solana', 'stellar'] as const).map((f) => (
                <div key={f} className="rounded-[18px] border border-[#e4e2dc] bg-white p-4 flex items-center gap-3">
                  <Medallion family={f} size={44} />
                  <div>
                    <p className="font-serif text-[18px] leading-tight">{f === 'evm' ? 'EVM' : f === 'solana' ? 'Solana' : 'Stellar'}</p>
                    <p className="text-[12px] text-[#8a8984]">{f === 'evm' ? 'EIP-6963' : f === 'solana' ? 'Wallet Standard' : 'SEP-43'}</p>
                  </div>
                </div>
              ))}
            </div>
            <Callout tone="warn" title="v0.1, testnet-first">
              Orion has not been security-audited. Mainnets are hidden by default. Don't keep real funds in it yet.
            </Callout>
            <P>This repository also contains Orion's web dashboard for the Stellar testnet, which you can open from the site's footer. These docs cover the extension.</P>
          </Section>

          {/* ── Install ── */}
          <Section id="install" eyebrow="Start" title="Install">
            <P>Orion isn't on the Chrome Web Store yet. Install it as an unpacked extension, either from a prebuilt zip or by building it yourself.</P>
            <H3>From a build zip</H3>
            <OL>
              <li>Download and unzip the Orion build.</li>
              <li>Open <C>chrome://extensions</C> and switch on <strong>Developer mode</strong> (top right).</li>
              <li>Click <strong>Load unpacked</strong> and choose the unzipped folder (the one containing <C>manifest.json</C>).</li>
              <li>Pin Orion from the puzzle-piece menu so it's always one click away.</li>
            </OL>
            <H3>From source</H3>
            <Code lang="bash">{`git clone https://github.com/arg0506/Orion
cd Orion/extension
npm install
npm run build        # outputs .output/chrome-mv3
# or, with live reload while you work:
npm run dev`}</Code>
            <P>Then load <C>extension/.output/chrome-mv3</C> with <strong>Load unpacked</strong>. Orion targets Chromium browsers (Chrome, Brave, Edge, Arc).</P>
          </Section>

      </div>
    </div>
  );
}
