import React, { useState } from 'react';
import { NavLink, Outlet, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Wallet, Eye, FlaskConical, LogOut, X, Cloud, ExternalLink, Loader2 } from 'lucide-react';
import { useWallet } from '../context/WalletContext';
import { useAuth } from '../context/AuthContext';
import AuthScreen from './AuthScreen';
import { Belt, Badge, Button, Logo, cx, shortAddress } from './ui';

const NAV = [
  { to: '/terminal', label: 'Wallet', icon: Wallet },
  { to: '/monitor', label: 'Watchlist', icon: Eye },
  { to: '/developer', label: 'Playground', icon: FlaskConical },
];

export default function Layout() {
  const { wallet, connect, disconnect } = useWallet();
  const { user, logout } = useAuth();
  const location = useLocation();
  const [authOpen, setAuthOpen] = useState(false);

  // Close the sign-in sheet as soon as sign-in succeeds
  React.useEffect(() => {
    if (user) setAuthOpen(false);
  }, [user]);

  const connecting = wallet.status === 'connecting';

  return (
    <div className="min-h-screen orion-sky text-starlight font-sans flex">
      {/* Sidebar (desktop) */}
      <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-line bg-night/70 backdrop-blur-md sticky top-0 h-screen p-5">
        <Link to="/" className="mb-8 px-1" aria-label="Orion home">
          <Logo />
        </Link>

        <nav className="space-y-1" aria-label="Main">
          {NAV.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cx(
                  'group flex items-center gap-3 h-11 px-3 rounded-xl text-[15px] font-medium transition-colors',
                  isActive ? 'bg-deep text-starlight border border-line' : 'text-mist hover:text-starlight hover:bg-white/[0.03] border border-transparent'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={18} className={isActive ? 'text-rigel' : ''} />
                  <span className="flex-1">{label}</span>
                  {isActive && <Belt className="w-5 text-rigel" />}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto space-y-3">
          <AccountPanel onSignIn={() => setAuthOpen(true)} />
          <p className="px-1 text-[12px] text-haze flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-warn" />
            Test networks only. Tokens have no real value.
          </p>
        </div>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-30 h-16 border-b border-line bg-night/80 backdrop-blur-md flex items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          <Link to="/" className="md:hidden" aria-label="Orion home">
            <Logo />
          </Link>
          <div className="hidden md:block" />

          {wallet.isConnected && wallet.publicKey ? (
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline-flex">
                <Badge tone={wallet.networkOk ? 'ok' : 'warning'} dot>
                  {wallet.walletType === 'metamask' ? 'MetaMask' : 'Freighter'} · {wallet.network}
                </Badge>
              </span>
              <span className="h-9 px-3 rounded-xl bg-deep border border-line font-mono text-[13px] text-starlight flex items-center">
                {shortAddress(wallet.publicKey, 4, 4)}
              </span>
              <Button variant="ghost" size="sm" onClick={disconnect} aria-label="Disconnect wallet" icon={<LogOut size={16} />}>
                <span className="hidden lg:inline">Disconnect</span>
              </Button>
            </div>
          ) : (
            <Button variant="primary" size="sm" loading={connecting} onClick={() => connect('freighter')} icon={<Wallet size={15} />}>
              Connect wallet
            </Button>
          )}
        </header>

        <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-28 md:pb-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              <Outlet context={{ openSignIn: () => setAuthOpen(true) }} />
            </motion.div>
          </AnimatePresence>
        </main>

        <footer className="hidden md:flex border-t border-line px-8 py-5 text-[13px] text-haze items-center justify-between">
          <span>Orion · Stellar testnet wallet</span>
          <span className="flex items-center gap-4">
            <a className="hover:text-starlight inline-flex items-center gap-1" href="https://stellar.expert/explorer/testnet" target="_blank" rel="noreferrer">
              Explorer <ExternalLink size={12} />
            </a>
            <a className="hover:text-starlight inline-flex items-center gap-1" href="https://developers.stellar.org" target="_blank" rel="noreferrer">
              Stellar docs <ExternalLink size={12} />
            </a>
          </span>
        </footer>
      </div>

      {/* Bottom tabs (mobile) */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-line bg-night/95 backdrop-blur-md grid grid-cols-4 pb-[env(safe-area-inset-bottom)]" aria-label="Main">
        {NAV.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => cx('flex flex-col items-center justify-center gap-1 h-16 text-[12px] font-medium', isActive ? 'text-rigel' : 'text-mist')}
          >
            <Icon size={20} />
            {label}
          </NavLink>
        ))}
        <button
          onClick={() => (user ? logout() : setAuthOpen(true))}
          className="flex flex-col items-center justify-center gap-1 h-16 text-[12px] font-medium text-mist"
        >
          <Cloud size={20} className={user ? 'text-ok' : ''} />
          {user ? 'Sign out' : 'Sync'}
        </button>
      </nav>

      {/* Sign-in sheet */}
      <AnimatePresence>
        {authOpen && (
          <motion.div
            className="fixed inset-0 z-50 bg-night/80 backdrop-blur-sm grid place-items-end sm:place-items-center p-0 sm:p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setAuthOpen(false)}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Sign in"
              className="relative w-full sm:max-w-md"
              initial={{ y: 24 }}
              animate={{ y: 0 }}
              exit={{ y: 24 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setAuthOpen(false)}
                className="absolute right-4 top-4 z-10 p-2 rounded-lg text-mist hover:text-starlight hover:bg-white/5"
                aria-label="Close"
              >
                <X size={18} />
              </button>
              <AuthScreen />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function AccountPanel({ onSignIn }: { onSignIn: () => void }) {
  const { user, loading, logout } = useAuth();

  if (loading) {
    return (
      <div className="rounded-xl border border-line bg-deep/60 p-3.5 text-sm text-mist flex items-center gap-2">
        <Loader2 size={14} className="animate-spin" /> Checking sign-in…
      </div>
    );
  }

  if (!user) {
    return (
      <div className="rounded-xl border border-line bg-deep/60 p-3.5">
        <p className="text-sm font-medium text-starlight">Not signed in</p>
        <p className="text-[13px] text-mist mt-0.5 leading-snug">Your watchlist and receipts are saved in this browser only.</p>
        <Button size="sm" className="mt-3 w-full" icon={<Cloud size={14} />} onClick={onSignIn}>
          Sign in to sync
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-line bg-deep/60 p-3.5 flex items-center gap-3">
      <span className="w-8 h-8 rounded-full bg-rigel/15 text-rigel grid place-items-center text-sm font-semibold shrink-0">
        {(user.displayName || user.email || 'G').charAt(0).toUpperCase()}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-starlight truncate">{user.displayName || (user.isAnonymous ? 'Guest' : user.email)}</p>
        <p className="text-[12px] text-ok">Syncing</p>
      </div>
      <button onClick={logout} className="p-2 rounded-lg text-mist hover:text-starlight hover:bg-white/5" aria-label="Sign out" title="Sign out">
        <LogOut size={15} />
      </button>
    </div>
  );
}
