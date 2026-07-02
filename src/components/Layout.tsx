import React from 'react';
import { NavLink, Outlet, Link } from 'react-router-dom';
import { useWallet } from '../context/WalletContext';
import { useAuth } from '../context/AuthContext';
import AuthScreen from './AuthScreen';
import { Wallet, Activity, AlertTriangle, ExternalLink, Compass, Monitor, LogOut, Loader2 } from 'lucide-react';
import orionLogo from '../assets/images/orion_logo_1783011957450.jpg';

export default function Layout() {
  const { wallet, connect, disconnect } = useWallet();
  const { user, loading, logout } = useAuth();

  const shortenAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-6)}`;
  };

  return (
    <div className="min-h-screen text-gray-100 immersive-bg font-sans flex flex-col md:flex-row relative overflow-hidden selection:bg-white selection:text-black">
      
      {/* Subtle Monochrome Ambient Halo */}
      <div className="absolute top-[-100px] right-[-100px] w-[400px] h-[400px] bg-white/5 rounded-full blur-[120px] pointer-events-none z-0"></div>

      {/* Sidebar Nav (Desktop Only) */}
      <aside className="hidden md:flex w-68 border-r border-white/10 bg-black/80 backdrop-blur-xl flex-col p-6 shrink-0 z-10 justify-between">
        <div className="space-y-8">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
            <img 
              src={orionLogo} 
              alt="Orion Logo" 
              className="w-8 h-8 rounded-full border border-white/20 object-cover shadow-[0_0_15px_rgba(255,255,255,0.35)]"
              referrerPolicy="no-referrer"
            />
            <span className="text-lg font-bold tracking-widest text-white font-display uppercase">
              ORION<span className="text-gray-400 font-light"> TERMINAL</span>
            </span>
          </Link>

          {/* Navigation Links */}
          <nav className="space-y-1.5 font-mono text-xs uppercase tracking-widest">
            <NavLink
              to="/terminal"
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded font-medium transition-all ${
                  isActive
                    ? 'bg-white/10 text-white border border-white/20 shadow-[0_0_15px_rgba(255,255,255,0.05)]'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-white/5 border border-transparent'
                }`
              }
            >
              <Activity className="w-4 h-4 shrink-0" />
              <span>Dashboard</span>
            </NavLink>
            
            <NavLink
              to="/monitor"
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded font-medium transition-all ${
                  isActive
                    ? 'bg-white/10 text-white border border-white/20 shadow-[0_0_15px_rgba(255,255,255,0.05)]'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-white/5 border border-transparent'
                }`
              }
            >
              <Monitor className="w-4 h-4 shrink-0" />
              <span>Multi-Monitor</span>
            </NavLink>
          </nav>
        </div>

        {/* Sidebar Footer Indicators */}
        <div className="space-y-3">
          {/* Firebase User Indicator */}
          {user && (
            <div className="p-4 rounded bg-white/[0.02] border border-white/5 space-y-2 font-mono">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-bold uppercase tracking-widest text-gray-500">VOYAGER ID</span>
                <button
                  onClick={logout}
                  className="text-[9px] text-white hover:underline uppercase tracking-wider font-bold"
                  title="Sign out of Firebase Auth"
                >
                  LOGOUT
                </button>
              </div>
              <div>
                <p className="text-[10px] text-white font-bold truncate">{user.displayName || 'Pilot Voyager'}</p>
                <p className="text-[8px] text-gray-500 truncate">{user.email || 'Anonymous Session'}</p>
              </div>
            </div>
          )}

          {/* Wallet connection indicator */}
          <div className="p-4 rounded bg-white/[0.02] border border-white/5 space-y-1.5 font-mono">
            <div className="flex items-center gap-2">
              <div className={`w-1.5 h-1.5 rounded-full ${wallet.isConnected ? 'bg-white animate-pulse' : 'bg-gray-700'}`}></div>
              <span className="text-[9px] font-bold uppercase tracking-widest text-white">
                {wallet.isConnected ? 'TESTNET_ONLINE' : 'OFFLINE'}
              </span>
            </div>
            {wallet.isConnected && wallet.publicKey ? (
              <p className="text-[9px] text-gray-400 font-mono break-all leading-normal">{shortenAddress(wallet.publicKey)}</p>
            ) : (
              <p className="text-[9px] text-gray-500 font-mono leading-normal">NO ACTIVE SESSION</p>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 z-10">
        
        {/* Top Header */}
        <header className="h-20 border-b border-white/10 flex items-center justify-between px-6 lg:px-8 bg-black/60 backdrop-blur-md">
          {/* Mobile Brand / Welcome Message */}
          <div className="flex items-center gap-3 md:gap-0">
            {/* Mobile-only logo */}
            <Link to="/" className="flex md:hidden items-center gap-2 mr-4 hover:opacity-90 transition-opacity">
              <img 
                src={orionLogo} 
                alt="Orion Logo" 
                className="w-7 h-7 rounded-full border border-white/20 object-cover shadow-[0_0_10px_rgba(255,255,255,0.35)]"
                referrerPolicy="no-referrer"
              />
              <span className="text-sm font-bold tracking-widest text-white font-display uppercase">
                ORION<span className="text-gray-400 font-light"> TERMINAL</span>
              </span>
            </Link>

            <div className="hidden sm:block font-mono">
              <h1 className="text-[9px] font-medium text-gray-500 uppercase tracking-widest">GATEWAY AUTHORIZED</h1>
              <p className="text-xs font-bold text-white uppercase tracking-widest truncate max-w-[180px]">
                {user ? `PILOT: ${(user.displayName || user.email?.split('@')[0] || 'VOYAGER').toUpperCase()}` : 'PILOT: GUEST'}
              </p>
            </div>
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-4">
            {wallet.isConnected && wallet.publicKey ? (
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex flex-col items-end font-mono">
                  <span className="text-[9px] text-gray-500 uppercase tracking-wider">FREIGHTER AGENT</span>
                  <span className="text-[10px] text-white flex items-center gap-1.5">
                    CONNECTED <span className="w-1 h-1 rounded-full bg-white animate-ping"></span>
                  </span>
                </div>
                
                {/* Public Key Display */}
                <div className="px-3 py-1.5 rounded bg-white/5 border border-white/10 text-xs font-mono text-gray-300">
                  {shortenAddress(wallet.publicKey)}
                </div>

                {/* Disconnect Button */}
                <button
                  onClick={disconnect}
                  className="p-2.5 rounded bg-white/5 border border-white/10 hover:bg-white/10 text-white transition-all cursor-pointer"
                  title="Disconnect Session"
                >
                  <LogOut size={14} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => connect()}
                className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-200 text-black text-xs font-mono font-bold tracking-widest uppercase transition-all"
              >
                <Wallet size={12} />
                CONNECT FREIGHTER
              </button>
            )}
          </div>
        </header>

        {/* Mobile Nav Bar */}
        <div className="md:hidden flex items-center justify-around border-b border-white/10 bg-black/80 py-2.5 z-10 font-mono text-xs uppercase tracking-widest">
          <NavLink
            to="/terminal"
            className={({ isActive }) =>
              `flex items-center gap-1.5 px-3 py-1.5 rounded transition-all ${
                isActive ? 'text-white bg-white/10 border border-white/20' : 'text-gray-400'
              }`
            }
          >
            <Activity className="w-3.5 h-3.5" />
            Dashboard
          </NavLink>
          <NavLink
            to="/monitor"
            className={({ isActive }) =>
              `flex items-center gap-1.5 px-3 py-1.5 rounded transition-all ${
                isActive ? 'text-white bg-white/10 border border-white/20' : 'text-gray-400'
              }`
            }
          >
            <Monitor className="w-3.5 h-3.5" />
            Multi-Monitor
          </NavLink>
        </div>

        {/* Main Content Viewport */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8 z-10 flex flex-col justify-start">
          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center py-20 font-mono text-gray-500 text-xs">
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
                <div className="mb-8 p-5 rounded border border-white/20 bg-white/[0.02] text-white flex flex-col md:flex-row md:items-center justify-between gap-4 backdrop-blur-md">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="text-white shrink-0 mt-0.5 animate-pulse" size={18} />
                    <div className="font-mono">
                      <h4 className="font-bold text-xs text-white uppercase tracking-widest">Freighter Wallet Extension Required</h4>
                      <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">
                        A secure cryptographic connection is required to transmit signed transaction payloads. You may monitor on-chain addresses read-only, but injecting transactions demands Freighter.
                      </p>
                    </div>
                  </div>
                  <a
                    href="https://www.freighter.app/"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-[10px] font-mono font-bold bg-white text-black hover:bg-gray-200 transition-all shrink-0 self-start md:self-center"
                  >
                    INSTALL EXTENSION
                    <ExternalLink size={10} />
                  </a>
                </div>
              )}

              {/* Actual Route Contents */}
              <Outlet />
            </>
          )}
        </main>

        {/* Universal Footer */}
        <footer className="border-t border-white/5 bg-black/40 py-5 px-6 lg:px-8 text-[9px] text-gray-600 font-mono flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="uppercase tracking-widest">© 2026 STELLAR VOYAGER SYSTEM LOGS. MONOCHROME GATEWAY.</p>
          <div className="flex items-center gap-4 text-gray-500">
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
