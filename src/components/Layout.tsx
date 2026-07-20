import React from 'react';
import { NavLink, Outlet, Link, useLocation } from 'react-router-dom';
import { useWallet } from '../context/WalletContext';
import { useAuth } from '../context/AuthContext';
import AuthScreen from './AuthScreen';
import { motion, AnimatePresence } from 'motion/react';
import { Wallet, Activity, AlertTriangle, ExternalLink, Compass, Monitor, LogOut, Loader2, Code } from 'lucide-react';
import orionLogo from '../assets/images/orion_logo_1783011957450.jpg';

export default function Layout() {
  const { wallet, connect, disconnect } = useWallet();
  const { user, loading, logout } = useAuth();
  const location = useLocation();

  const shortenAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-6)}`;
  };

  return (
    <div className="min-h-screen text-zinc-100 immersive-bg space-stardust font-sans flex flex-col md:flex-row relative overflow-hidden selection:bg-white selection:text-black">
      
      {/* Subtle Monochrome Ambient Halo (Deep Silver Glow) */}
      <div className="absolute top-[-100px] right-[-100px] w-[500px] h-[500px] bg-white/[0.03] rounded-full blur-[140px] pointer-events-none z-0"></div>
      <div className="absolute bottom-[-100px] left-[-100px] w-[400px] h-[400px] bg-zinc-800/[0.04] rounded-full blur-[120px] pointer-events-none z-0"></div>

      {/* Sidebar Nav (Desktop Only) with rich silver borders & blur */}
      <aside className="hidden md:flex w-72 border-r border-zinc-800/80 bg-black/90 backdrop-blur-3xl flex-col p-7 shrink-0 z-10 justify-between">
        <div className="space-y-10">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-all active:scale-98">
            <img 
              src={orionLogo} 
              alt="Orion Logo" 
              className="w-9 h-9 rounded-full border border-zinc-500 object-cover shadow-[0_0_12px_rgba(255,255,255,0.2)]"
              referrerPolicy="no-referrer"
            />
            <span className="text-lg font-extrabold tracking-widest text-white font-display uppercase">
              ORION<span className="text-zinc-500 font-light ml-0.5"> TERMINAL</span>
            </span>
          </Link>

          {/* Navigation Links with custom high contrast styling */}
          <nav className="space-y-2 font-mono text-xs uppercase tracking-widest">
            <NavLink
              to="/"
              className={({ isActive }) =>
                `flex items-center gap-3.5 px-4.5 py-3.5 rounded-2xl font-bold transition-all ${
                  isActive
                    ? 'bg-zinc-100 text-black shadow-[0_4px_15px_rgba(255,255,255,0.15)] scale-[1.02]'
                    : 'text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent'
                }`
              }
            >
              <Compass className="w-4 h-4 shrink-0" />
              <span>Portal Home</span>
            </NavLink>

            <NavLink
              to="/terminal"
              className={({ isActive }) =>
                `flex items-center gap-3.5 px-4.5 py-3.5 rounded-2xl font-bold transition-all ${
                  isActive
                    ? 'bg-zinc-100 text-black shadow-[0_4px_15px_rgba(255,255,255,0.15)] scale-[1.02]'
                    : 'text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent'
                }`
              }
            >
              <Activity className="w-4 h-4 shrink-0" />
              <span>Dashboard</span>
            </NavLink>
            
            <NavLink
              to="/monitor"
              className={({ isActive }) =>
                `flex items-center gap-3.5 px-4.5 py-3.5 rounded-2xl font-bold transition-all ${
                  isActive
                    ? 'bg-zinc-100 text-black shadow-[0_4px_15px_rgba(255,255,255,0.15)] scale-[1.02]'
                    : 'text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent'
                }`
              }
            >
              <Monitor className="w-4 h-4 shrink-0" />
              <span>Multi-Monitor</span>
            </NavLink>

            <NavLink
              to="/developer"
              className={({ isActive }) =>
                `flex items-center gap-3.5 px-4.5 py-3.5 rounded-2xl font-bold transition-all ${
                  isActive
                    ? 'bg-zinc-100 text-black shadow-[0_4px_15px_rgba(255,255,255,0.15)] scale-[1.02]'
                    : 'text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent'
                }`
              }
            >
              <Code className="w-4 h-4 shrink-0" />
              <span>Developer Hub</span>
            </NavLink>
          </nav>
        </div>

        {/* Sidebar Footer Indicators */}
        <div className="space-y-4">
          {/* Firebase User Indicator */}
          {user && (
            <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-900 space-y-2.5 font-mono">
              <div className="flex items-center justify-between">
                <span className="text-[8px] font-black uppercase tracking-widest text-zinc-500">VOYAGER ID</span>
                <button
                  onClick={logout}
                  className="text-[9px] text-zinc-300 hover:text-white hover:underline uppercase tracking-wider font-bold cursor-pointer"
                  title="Sign out of Firebase Auth"
                >
                  LOGOUT
                </button>
              </div>
              <div className="space-y-0.5">
                <p className="text-[11px] text-zinc-200 font-bold truncate">{user.displayName || 'Pilot Voyager'}</p>
                <p className="text-[8px] text-zinc-500 truncate">{user.email || 'Anonymous Session'}</p>
              </div>
            </div>
          )}

          {/* Wallet connection indicator */}
          <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-900 space-y-2 font-mono">
            <div className="flex items-center gap-2">
              <div className={`w-1.5 h-1.5 rounded-full ${wallet.isConnected ? 'bg-zinc-100 animate-ping' : 'bg-zinc-700'}`}></div>
              <span className="text-[9px] font-black uppercase tracking-widest text-zinc-200">
                {wallet.isConnected ? (wallet.walletType === 'metamask' ? 'EVM_CONNECTED' : 'SDF_CONNECTED') : 'OFFLINE'}
              </span>
            </div>
            {wallet.isConnected && wallet.publicKey ? (
              <p className="text-[9px] text-zinc-400 font-mono break-all leading-normal">
                <span className="text-[8px] text-zinc-500 block font-bold uppercase tracking-wider mb-0.5">
                  {wallet.walletType === 'metamask' ? 'METAMASK:' : 'STELLAR:'}
                </span>
                {shortenAddress(wallet.publicKey)}
              </p>
            ) : (
              <p className="text-[9px] text-zinc-500 font-mono leading-normal">NO ACTIVE SESSION</p>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 z-10">
        
        {/* Top Header */}
        <header className="h-20 border-b border-zinc-800/80 flex items-center justify-between px-6 lg:px-8 bg-black/70 backdrop-blur-3xl">
          {/* Mobile Brand / Welcome Message */}
          <div className="flex items-center gap-3 md:gap-0">
            {/* Mobile-only logo */}
            <Link to="/" className="flex md:hidden items-center gap-2 mr-4 hover:opacity-85 transition-opacity">
              <img 
                src={orionLogo} 
                alt="Orion Logo" 
                className="w-8 h-8 rounded-full border border-zinc-500 object-cover shadow-[0_0_10px_rgba(255,255,255,0.25)]"
                referrerPolicy="no-referrer"
              />
              <span className="text-sm font-extrabold tracking-widest text-white font-display uppercase">
                ORION<span className="text-zinc-500 font-light ml-0.5"> TERMINAL</span>
              </span>
            </Link>

            <div className="hidden sm:block font-mono">
              <h1 className="text-[8px] font-black text-zinc-500 uppercase tracking-widest mb-0.5">GATEWAY SECURED</h1>
              <p className="text-xs font-bold text-white uppercase tracking-widest truncate max-w-[200px]">
                {user ? `PILOT: ${(user.displayName || user.email?.split('@')[0] || 'VOYAGER').toUpperCase()}` : 'PILOT: GUEST'}
              </p>
            </div>
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-4">
            {wallet.isConnected && wallet.publicKey ? (
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex flex-col items-end font-mono">
                  <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-bold">
                    {wallet.walletType === 'metamask' ? 'EVM AGENT' : 'SDF AGENT'}
                  </span>
                  <span className="text-[10px] text-zinc-300 flex items-center gap-1.5 font-bold">
                    CONNECTED <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
                  </span>
                </div>
                
                {/* Public Key Display */}
                <div className="px-3.5 py-2 rounded-xl bg-white/5 border border-zinc-800 text-xs font-mono text-zinc-300">
                  {shortenAddress(wallet.publicKey)}
                </div>

                {/* Disconnect Button */}
                <button
                  onClick={disconnect}
                  className="p-2.5 rounded-xl bg-white/5 border border-zinc-800 hover:bg-white/10 hover:border-zinc-700 text-zinc-400 hover:text-white transition-all cursor-pointer"
                  title="Disconnect Session"
                >
                  <LogOut size={14} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 sm:gap-2.5">
                <button
                  id="connect-freighter-btn"
                  onClick={() => connect('freighter')}
                  className="flex items-center gap-1 px-2.5 py-2 sm:px-4 sm:py-2.5 rounded-full bg-zinc-100 hover:bg-white text-black text-[9px] sm:text-[10px] font-mono font-bold tracking-widest uppercase transition-all cursor-pointer shadow-md"
                >
                  <Wallet size={11} />
                  <span className="hidden sm:inline">FREIGHTER</span>
                  <span className="sm:hidden">SDF</span>
                </button>
                <button
                  id="connect-metamask-btn"
                  onClick={() => connect('metamask')}
                  className="flex items-center gap-1 px-2.5 py-2 sm:px-4 sm:py-2.5 rounded-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-white text-[9px] sm:text-[10px] font-mono font-bold tracking-widest uppercase transition-all cursor-pointer"
                >
                  <Wallet size={11} />
                  <span className="hidden sm:inline">METAMASK</span>
                  <span className="sm:hidden">EVM</span>
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Mobile Nav Bar */}
        <div className="md:hidden flex items-center justify-around border-b border-zinc-800/80 bg-black/95 py-3 z-10 font-mono text-xs uppercase tracking-widest">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `flex items-center gap-1 px-2 py-1.5 rounded-full transition-all text-[10px] ${
                isActive ? 'text-black bg-zinc-100 border border-zinc-200' : 'text-zinc-400'
              }`
            }
          >
            <Compass className="w-3.5 h-3.5" />
            Home
          </NavLink>
          <NavLink
            to="/terminal"
            className={({ isActive }) =>
              `flex items-center gap-1 px-2 py-1.5 rounded-full transition-all text-[10px] ${
                isActive ? 'text-black bg-zinc-100 border border-zinc-200' : 'text-zinc-400'
              }`
            }
          >
            <Activity className="w-3.5 h-3.5" />
            Dashboard
          </NavLink>
          <NavLink
            to="/monitor"
            className={({ isActive }) =>
              `flex items-center gap-1 px-2 py-1.5 rounded-full transition-all text-[10px] ${
                isActive ? 'text-black bg-zinc-100 border border-zinc-200' : 'text-zinc-400'
              }`
            }
          >
            <Monitor className="w-3.5 h-3.5" />
            Monitor
          </NavLink>
          <NavLink
            to="/developer"
            className={({ isActive }) =>
              `flex items-center gap-1 px-2 py-1.5 rounded-full transition-all text-[10px] ${
                isActive ? 'text-black bg-zinc-100 border border-zinc-200' : 'text-zinc-400'
              }`
            }
          >
            <Code className="w-3.5 h-3.5" />
            Dev
          </NavLink>
        </div>

        {/* Main Content Viewport */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8 z-10 flex flex-col justify-start relative">
          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center py-24 font-mono text-zinc-500 text-xs">
              <Loader2 className="w-8 h-8 animate-spin text-white mb-3" />
              <span>SYNCHRONIZING VOYAGER SECURE GATEWAY...</span>
            </div>
          ) : !user ? (
            <div className="flex-1 flex items-center justify-center py-10">
              <AuthScreen />
            </div>
          ) : (
            <>
              {/* Extension Warning Banner (Stark Gray instead of Amber) */}
              {!wallet.isInstalled && (
                <div className="mb-8 p-5 rounded-2xl border border-zinc-800 bg-zinc-950/40 text-white flex flex-col md:flex-row md:items-center justify-between gap-4 backdrop-blur-md">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="text-zinc-400 shrink-0 mt-0.5 animate-pulse" size={18} />
                    <div className="font-mono">
                      <h4 className="font-bold text-xs text-white uppercase tracking-widest font-display">Wallet Connection Pre-Requisite</h4>
                      <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
                        A secure cryptographic extension is required to transmit signed transaction payloads. You may monitor on-chain addresses read-only, but injecting transactions demands Freighter or MetaMask.
                      </p>
                    </div>
                  </div>
                  <a
                    href="https://www.freighter.app/"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-[9px] font-mono font-bold rounded-full bg-zinc-100 hover:bg-white text-black transition-all shrink-0 self-start md:self-center shadow-md"
                  >
                    INSTALL EXTENSION
                    <ExternalLink size={10} />
                  </a>
                </div>
              )}

              {/* Animated Route Viewport Transition */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={location.pathname}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.4, cubicBezier: [0.16, 1, 0.3, 1] }}
                  className="flex-1 flex flex-col"
                >
                  <Outlet />
                </motion.div>
              </AnimatePresence>
            </>
          )}
        </main>

        {/* Universal Footer */}
        <footer className="border-t border-zinc-900 bg-black/60 py-6 px-6 lg:px-8 text-[9px] text-zinc-500 font-mono flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="uppercase tracking-widest">© 2026 ORION COSMIC TERMINAL LOGS. MONOCHROME EDITION.</p>
          <div className="flex items-center gap-4 text-zinc-400">
            <a
              href="https://horizon-testnet.stellar.org"
              target="_blank"
              rel="noreferrer"
              className="hover:text-white flex items-center gap-1 transition-colors"
            >
              Horizon Node
              <ExternalLink size={8} />
            </a>
            <span>•</span>
            <a
              href="https://stellar.org"
              target="_blank"
              rel="noreferrer"
              className="hover:text-white flex items-center gap-1 transition-colors"
            >
              Stellar Network
              <ExternalLink size={8} />
            </a>
          </div>
        </footer>
      </div>
    </div>
  );
}
