import React, { useState } from 'react';
import { NavLink, Outlet, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence, useScroll, useTransform } from 'motion/react';
import { Wallet, Eye, FlaskConical, LogOut, X, Cloud, ExternalLink } from 'lucide-react';
import { useWallet } from '../context/WalletContext';
import { useAuth } from '../context/AuthContext';
import AuthScreen from './AuthScreen';
import { Badge, Button, Logo, cx, shortAddress } from './ui';
import { ease } from './motion';

const NAV = [
  { to: '/terminal', label: 'Wallet', icon: Wallet },
  { to: '/monitor', label: 'Watchlist', icon: Eye },
  { to: '/developer', label: 'Playground', icon: FlaskConical },
];

/** Floating pill nav with a sliding highlight, as on the landing page. */
function PillNav({ className }: { className?: string }) {
  return (
    <nav className={cx('flex items-center gap-0.5 rounded-[14px] bg-[#e9e8e4]/85 backdrop-blur-md p-1 border border-black/[0.04]', className)} aria-label="Main">
      {NAV.map(({ to, label, icon: Icon }) => (
        <NavLink key={to} to={to} className="relative">
          {({ isActive }) => (
            <span className={cx('relative z-10 flex items-center gap-1.5 h-9 px-3.5 rounded-[10px] text-[14px] transition-colors', isActive ? 'text-ink' : 'text-muted hover:text-ink')}>
              {isActive && (
                <motion.span
                  layoutId="nav-pill"
                  className="absolute inset-0 -z-10 rounded-[10px] bg-card shadow-[0_2px_8px_-2px_rgba(0,0,0,0.15)]"
                  transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                />
              )}
              <Icon size={16} />
              {label}
            </span>
          )}
        </NavLink>
      ))}
    </nav>
  );
}

export default function Layout() {
  const { wallet, connect, disconnect } = useWallet();
  const { user, logout } = useAuth();
  const location = useLocation();
  const [authOpen, setAuthOpen] = useState(false);
  const { scrollY } = useScroll();
  const headerShadow = useTransform(scrollY, [0, 60], ['0 0 0 rgba(0,0,0,0)', '0 10px 30px -20px rgba(0,0,0,0.35)']);
  const headerBg = useTransform(scrollY, [0, 60], ['rgba(246,245,242,0)', 'rgba(246,245,242,0.85)']);

  React.useEffect(() => {
    if (user) setAuthOpen(false);
  }, [user]);

  const connecting = wallet.status === 'connecting';

  return (
    <div className="min-h-screen orion-sky text-ink font-sans">
      {/* Top bar */}
      <motion.header
        style={{ boxShadow: headerShadow, backgroundColor: headerBg }}
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease }}
        className="sticky top-0 z-30 backdrop-blur-md"
      >
        <div className="max-w-6xl mx-auto h-[72px] px-4 sm:px-6 flex justify-between md:grid md:grid-cols-[1fr_auto_1fr] items-center gap-3">
          <Link to="/" aria-label="Orion home" className="justify-self-start">
            <Logo />
          </Link>

          <PillNav className="hidden md:flex" />

          <div className="justify-self-end flex items-center gap-2">
            {wallet.isConnected && wallet.publicKey ? (
              <>
                <span className="hidden lg:inline-flex">
                  <Badge tone={wallet.networkOk ? 'ok' : 'warning'} dot>
                    {wallet.network}
                  </Badge>
                </span>
                <span className="h-10 pl-2 pr-3 rounded-[12px] bg-card border border-line font-mono text-[13px] flex items-center gap-2" title={wallet.publicKey}>
                  <span className={cx('tile w-6 h-6 !rounded-[7px] text-white', wallet.walletType === 'metamask' ? 'bg-[linear-gradient(160deg,#ffb36b,#f07a2a)]' : 'bg-[linear-gradient(160deg,#7cc0ff,#2f7cf0)]')}>
                    <Wallet size={13} />
                  </span>
                  {shortAddress(wallet.publicKey, 4, 4)}
                </span>
                <Button variant="ghost" size="sm" className="h-10 w-10 !px-0" onClick={disconnect} aria-label="Disconnect wallet" title="Disconnect wallet" icon={<LogOut size={16} />} />
              </>
            ) : (
              <Button variant="primary" loading={connecting} onClick={() => connect('freighter')} icon={<Wallet size={16} />}>
                Connect
              </Button>
            )}
            <span className="hidden md:block w-px h-6 bg-line mx-1" />
            <button
              onClick={() => (user ? logout() : setAuthOpen(true))}
              className="hidden md:flex items-center gap-2 h-10 px-3 rounded-[12px] text-[14px] text-muted hover:text-ink hover:bg-black/[0.04]"
              title={user ? 'Signed in: watchlist and receipts sync. Click to sign out.' : 'Sign in to sync your watchlist and receipts'}
            >
              {user ? (
                <>
                  <span className="w-6 h-6 rounded-full bg-ink text-paper grid place-items-center text-[12px] font-semibold">
                    {(user.displayName || user.email || 'G').charAt(0).toUpperCase()}
                  </span>
                  <span className="hidden lg:inline">Sign out</span>
                </>
              ) : (
                <>
                  <Cloud size={16} />
                  <span className="hidden lg:inline">Sync</span>
                </>
              )}
            </button>
          </div>
        </div>
      </motion.header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-4 sm:pt-8 pb-32 md:pb-16">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.35, ease }}
          >
            <Outlet context={{ openSignIn: () => setAuthOpen(true) }} />
          </motion.div>
        </AnimatePresence>
      </main>

      <footer className="hidden md:block">
        <div className="max-w-6xl mx-auto px-6 py-6 border-t border-line flex items-center justify-between text-[13px] text-muted">
          <span>Orion · Test networks only, tokens have no real value</span>
          <span className="flex items-center gap-5">
            <a className="hover:text-ink inline-flex items-center gap-1" href="https://stellar.expert/explorer/testnet" target="_blank" rel="noreferrer">
              Explorer <ExternalLink size={12} />
            </a>
            <a className="hover:text-ink inline-flex items-center gap-1" href="https://developers.stellar.org" target="_blank" rel="noreferrer">
              Stellar docs <ExternalLink size={12} />
            </a>
          </span>
        </div>
      </footer>

      {/* Floating pill tab bar (mobile) */}
      <div className="md:hidden fixed bottom-4 inset-x-0 z-40 flex justify-center px-4 pb-[env(safe-area-inset-bottom)]">
        <nav className="flex items-center gap-0.5 rounded-[18px] bg-[#e9e8e4]/90 backdrop-blur-md p-1 border border-black/[0.05] shadow-[0_12px_30px_-12px_rgba(0,0,0,0.3)]" aria-label="Main">
          {NAV.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className="relative">
              {({ isActive }) => (
                <span className={cx('relative z-10 flex flex-col items-center justify-center gap-0.5 w-[74px] h-14 rounded-[14px] text-[11px]', isActive ? 'text-ink' : 'text-muted')}>
                  {isActive && <motion.span layoutId="tab-pill" className="absolute inset-0 -z-10 rounded-[14px] bg-card shadow-sm" transition={{ type: 'spring', stiffness: 380, damping: 32 }} />}
                  <Icon size={19} />
                  {label}
                </span>
              )}
            </NavLink>
          ))}
          <button onClick={() => (user ? logout() : setAuthOpen(true))} className="flex flex-col items-center justify-center gap-0.5 w-[74px] h-14 rounded-[14px] text-[11px] text-muted">
            <Cloud size={19} className={user ? 'text-ok' : ''} />
            {user ? 'Sign out' : 'Sync'}
          </button>
        </nav>
      </div>

      {/* Sign-in sheet */}
      <AnimatePresence>
        {authOpen && (
          <motion.div
            className="fixed inset-0 z-50 bg-ink/30 backdrop-blur-sm grid place-items-end sm:place-items-center p-0 sm:p-6"
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
              initial={{ y: 40, scale: 0.98 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: 40 }}
              transition={{ duration: 0.4, ease }}
              onClick={(e) => e.stopPropagation()}
            >
              <button onClick={() => setAuthOpen(false)} className="absolute right-4 top-4 z-10 p-2 rounded-lg text-muted hover:text-ink hover:bg-black/[0.04]" aria-label="Close">
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
