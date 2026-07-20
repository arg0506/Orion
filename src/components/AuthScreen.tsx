import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Compass, AlertCircle, Copy, CheckCircle2, ChevronRight, RefreshCw, Eye } from 'lucide-react';
import orionLogo from '../assets/images/orion_logo_1783011957450.jpg';

export default function AuthScreen() {
  const { loginWithGoogle, loginAnonymously, authError, clearAuthError } = useAuth();
  const [copiedDomain, setCopiedDomain] = useState(false);

  const currentDomain = typeof window !== 'undefined' ? window.location.hostname : '';

  const handleCopyDomain = () => {
    if (!currentDomain) return;
    navigator.clipboard.writeText(currentDomain);
    setCopiedDomain(true);
    setTimeout(() => setCopiedDomain(false), 2000);
  };

  const isUnauthorizedDomain = authError?.includes('unauthorized-domain') || authError?.includes('unauthorized');
  const isAnonymousDisabled = authError?.includes('admin-restricted-operation') || authError?.includes('restricted');

  return (
    <div className="w-full max-w-lg mx-auto p-1 font-sans">
      {/* Outer Glow Container */}
      <motion.div
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, cubicBezier: [0.16, 1, 0.3, 1] }}
        className="relative overflow-hidden rounded-[28px] border border-zinc-800 bg-zinc-950/80 backdrop-blur-3xl p-8 sm:p-10 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.85)]"
        id="auth-card"
      >
        {/* Tech Corner Accents (Silver-plated look) */}
        <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-zinc-600 rounded-tl" />
        <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-zinc-600 rounded-tr" />
        <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-zinc-600 rounded-bl" />
        <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-zinc-600 rounded-br" />

        {/* Header Branding */}
        <div className="flex flex-col items-center text-center space-y-5">
          <div className="relative">
            <div className="absolute -inset-2 rounded-full bg-white/5 blur-md animate-pulse" />
            <img
              src={orionLogo}
              alt="Orion Logo"
              className="relative w-16 h-16 rounded-full border border-zinc-600 object-cover shadow-[0_0_15px_rgba(255,255,255,0.2)]"
            />
          </div>

          <div>
            <div className="flex items-center justify-center gap-1.5 text-[9px] text-zinc-500 font-bold uppercase tracking-widest font-mono">
              <Shield size={10} className="text-zinc-400" />
              <span>ORION COGNITIVE HUB</span>
            </div>
            <h2 className="text-xl font-extrabold text-white uppercase tracking-wider font-display mt-1.5">
              VOYAGER GATEWAY
            </h2>
            <p className="text-[11px] text-zinc-400 mt-2.5 max-w-[320px] mx-auto leading-relaxed font-sans font-light tracking-wide">
              Unlock cross-device cloud synchronization. Monitor multiple on-chain nodes and persist real-time receipts safely.
            </p>
          </div>
        </div>

        {/* Dynamic Warning Alerts & Setup Troubleshooting guides */}
        <AnimatePresence mode="wait">
          {authError && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-6 mb-2 overflow-hidden"
            >
              <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-950/20 text-rose-200 text-xs space-y-3">
                <div className="flex items-start gap-2">
                  <AlertCircle size={16} className="text-rose-400 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-bold uppercase tracking-wider text-[10px] font-mono">
                      {isUnauthorizedDomain ? 'UNAUTHORIZED HOST DETECTED' : isAnonymousDisabled ? 'ANONYMOUS LOGIN DISABLED' : 'GATEWAY REJECTED'}
                    </p>
                    <p className="text-[10px] text-rose-300/80 mt-1 leading-relaxed">
                      {isUnauthorizedDomain 
                        ? 'Your Firebase project does not authorize this browser host domain yet.'
                        : isAnonymousDisabled 
                          ? 'Anonymous user authorization has not been enabled in your Firebase console settings.'
                          : `Firebase Service Error: ${authError}`}
                    </p>
                  </div>
                </div>

                {/* Steps to resolve Unauthorized Domain */}
                {isUnauthorizedDomain && (
                  <div className="p-3 bg-black/60 border border-zinc-900 rounded-lg space-y-2.5 text-[10px] text-zinc-400">
                    <p className="font-bold text-white uppercase text-[8px] tracking-widest border-b border-zinc-900 pb-1 font-mono">
                      ACTION REQUIRED: ADD AUTHORIZED DOMAIN
                    </p>
                    <ol className="list-decimal list-inside space-y-1 text-zinc-400 leading-relaxed font-sans">
                      <li>Go to your <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer" className="text-white hover:underline underline-offset-2">Firebase Console</a>.</li>
                      <li>Navigate to Authentication &gt; Settings &gt; Authorized domains.</li>
                      <li>Click Add domain and paste the host below:</li>
                    </ol>

                    <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-white/5 border border-zinc-800 font-mono text-[9px] text-white font-semibold">
                      <span className="truncate select-all text-zinc-300">{currentDomain}</span>
                      <button
                        onClick={handleCopyDomain}
                        className="p-1 rounded hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer shrink-0"
                        title="Copy Domain Hostname"
                      >
                        {copiedDomain ? <CheckCircle2 size={12} className="text-emerald-400" /> : <Copy size={12} />}
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-1 border-t border-rose-500/10">
                  <button
                    onClick={clearAuthError}
                    className="px-2 py-1 bg-white/10 hover:bg-white/20 rounded text-[9px] uppercase tracking-wider font-bold text-white transition-all cursor-pointer font-mono"
                  >
                    Clear Warning
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Terminal Line Indicator */}
        <div className="my-6 border-t border-zinc-900 relative">
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 px-3.5 bg-zinc-950 text-[8px] text-zinc-500 uppercase tracking-widest font-black font-mono">
            GATEWAY ACCESS
          </span>
        </div>

        {/* Buttons Stack */}
        <div className="space-y-3">
          {/* Google Sign-In with premium metallic button style */}
          <button
            onClick={loginWithGoogle}
            className="w-full flex items-center justify-center gap-2.5 py-3.5 px-5 rounded-full btn-metallic text-xs font-bold uppercase tracking-wider cursor-pointer font-mono shadow-[0_4px_12px_rgba(255,255,255,0.1)] hover:shadow-[0_8px_20px_rgba(255,255,255,0.2)]"
            id="auth-google-btn"
          >
            <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
              <path d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.113-5.136 4.113-3.41 0-6.19-2.774-6.19-6.19 0-3.41 2.78-6.19 6.19-6.19 1.465 0 2.809.516 3.867 1.378l3.14-3.14C18.91 2.422 15.82 1 12.24 1 6.033 1 12.24s5.033 11.24 11.24 11.24c6.478 0 11.753-4.7 11.753-11.24 0-.741-.077-1.442-.218-1.955H12.24z"/>
            </svg>
            Google Sign-in
          </button>

          {/* Guest Voyager Mode */}
          <button
            onClick={loginAnonymously}
            className="w-full flex items-center justify-center gap-2.5 py-3.5 px-5 rounded-full border border-zinc-800 bg-zinc-900/40 text-zinc-300 hover:text-white hover:border-zinc-700 active:scale-[0.99] transition-all text-xs font-bold uppercase tracking-wider cursor-pointer font-mono backdrop-blur-md"
            id="auth-guest-btn"
          >
            <Compass size={14} className="shrink-0 text-zinc-500" />
            Guest Session (Offline)
          </button>
        </div>

        {/* Extra System Metadata */}
        <div className="mt-7 pt-4 border-t border-zinc-900 flex items-center justify-between text-[8px] text-zinc-500 font-bold tracking-widest font-mono">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-ping" />
            <span>SECURE SYSTEM CHANNEL</span>
          </div>
          <span>ORION.V3</span>
        </div>
      </motion.div>
    </div>
  );
}
