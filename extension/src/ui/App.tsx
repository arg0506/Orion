import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Wallet, Globe, ScrollText, Settings as Cog, Lock } from 'lucide-react';
import { call } from './api';
import { OrionMark, cx, ease } from './kit';
import type { WalletView } from '../lib/messages';
import type { Family } from '../lib/networks';
import Onboarding from './screens/Onboarding';
import Unlock from './screens/Unlock';
import Home from './screens/Home';
import Sites from './screens/Sites';
import DevLog from './screens/DevLog';
import Settings from './screens/Settings';

type Tab = 'wallet' | 'sites' | 'log' | 'settings';
const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'wallet', label: 'Wallet', icon: Wallet },
  { id: 'sites', label: 'Sites', icon: Globe },
  { id: 'log', label: 'Log', icon: ScrollText },
  { id: 'settings', label: 'Settings', icon: Cog },
];

export default function App() {
  const [view, setView] = useState<WalletView | null>(null);
  const [tab, setTab] = useState<Tab>('wallet');
  const [family, setFamilyState] = useState<Family>(() => (localStorage.getItem('orion:family') as Family) || 'evm');
  const setFamily = (f: Family) => {
    localStorage.setItem('orion:family', f);
    setFamilyState(f);
  };

  useEffect(() => {
    call<WalletView>({ type: 'ui:state' }).then(setView);
  }, []);

  if (!view) return <div className="h-full grid place-items-center"><OrionMark className="w-10 h-10 animate-pulse" /></div>;
  if (!view.hasVault) return <Onboarding onDone={setView} />;
  if (!view.unlocked) return <Unlock onDone={setView} />;

  return (
    <div className="h-full flex flex-col">
      <header className="h-12 px-4 flex items-center justify-between shrink-0">
        <span className="flex items-center gap-2">
          <OrionMark className="w-6 h-6" />
          <span className="font-serif text-[19px] leading-none">Orion</span>
        </span>
        <button onClick={async () => setView(await call({ type: 'ui:lock' }))} className="p-1.5 rounded-lg text-muted hover:text-ink hover:bg-black/[0.04]" aria-label="Lock" title="Lock">
          <Lock size={15} />
        </button>
      </header>

      <main className="flex-1 min-h-0 relative overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div key={tab} className="absolute inset-0 overflow-y-auto" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25, ease }}>
            {tab === 'wallet' && <Home view={view} setView={setView} family={family} setFamily={setFamily} />}
            {tab === 'sites' && <Sites />}
            {tab === 'log' && <DevLog />}
            {tab === 'settings' && <Settings view={view} setView={setView} />}
          </motion.div>
        </AnimatePresence>
      </main>

      <nav className="shrink-0 px-3 pb-3 pt-1">
        <div className="flex p-1 rounded-[16px] bg-[#e9e8e4]/90 border border-black/[0.04]">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setTab(id)} className={cx('relative flex-1 h-12 rounded-[12px] flex flex-col items-center justify-center gap-0.5 text-[11px]', tab === id ? 'text-ink' : 'text-muted')}>
              {tab === id && <motion.span layoutId="tab-pill" className="absolute inset-0 rounded-[12px] bg-card shadow-[0_2px_8px_-2px_rgba(0,0,0,0.15)]" transition={{ type: 'spring', stiffness: 380, damping: 32 }} />}
              <Icon size={17} className="relative" />
              <span className="relative">{label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
