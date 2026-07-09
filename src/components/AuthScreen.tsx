import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Lock, LogIn, Compass, Terminal, AlertCircle, Copy, CheckCircle2, ChevronRight, RefreshCw, Eye } from 'lucide-react';
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
    <div className="w-full max-w-lg mx-auto p-1 font-mono">
      {/* Outer Glow Container */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative overflow-hidden rounded border border-white/10 bg-black/40 backdrop-blur-md p-6 lg:p-8"
        id="auth-card"
      >
        {/* Tech Corner Accents */}
        <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-white/30" />
        <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-white/30" />
        <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-white/30" />
        <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-white/30" />

        {/* Header Branding */}
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="relative">
            <div className="absolute -inset-1.5 rounded-full bg-white/5 blur animate-pulse" />
            <img
              src={orionLogo}
              alt="Orion Logo"
              className="relative w-16 h-16 rounded-full border border-white/10 object-cover"
            />
          </div>

          <div>
            <div className="flex items-center justify-center gap-1.5 text-[9px] text-gray-500 font-bold uppercase tracking-widest">
              <Shield size={10} className="text-white" />
              <span>ORION COGNITIVE HUB</span>
            </div>
            <h2 className="text-lg font-black text-white uppercase tracking-widest mt-1">
              VOYAGER SECURE GATEWAY
            </h2>
            <p className="text-[10px] text-gray-400 mt-2 max-w-[280px] mx-auto leading-relaxed">
              Unlock cross-device cloud synchronization. Monitor multiple Stellar testnet ledger nodes and persist real-time receipts safely.
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
              <div className="p-4 rounded border border-rose-500/30 bg-rose-950/20 text-rose-200 text-xs space-y-3">
                <div className="flex items-start gap-2">
                  <AlertCircle size={16} className="text-rose-400 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-bold uppercase tracking-wider text-[10px]">
                      {isUnauthorizedDomain ? 'UNAUTHORIZED HOST DETECTED' : isAnonymousDisabled ? 'ANONYMOUS LOGIN DISABLED' : 'GATEWAY REJECTED'}
                    </p>
                    <p className="text-[10px] text-rose-300/80 mt-1 leading-relaxed">
                      {isUnauthorizedDomain 
                        ? 'Your Firebase project (orion-c4ee4) does not authorize this browser host domain yet.'
                        : isAnonymousDisabled 
                          ? 'Anonymous user authorization has not been enabled in your Firebase console settings.'
                          : `Firebase Service Error: ${authError}`}
                    </p>
                  </div>
                </div>

                {/* Steps to resolve Unauthorized Domain */}
                {isUnauthorizedDomain && (
                  <div className="p-3 bg-black/60 border border-white/5 rounded space-y-2.5 text-[10px] text-gray-300">
                    <p className="font-bold text-white uppercase text-[8px] tracking-widest border-b border-white/5 pb-1">
                      ACTION REQUIRED: ADD AUTHORIZED DOMAIN
                    </p>
                    <ol className="list-decimal list-inside space-y-1 text-gray-400 leading-relaxed">
                      <li>Go to your <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer" className="text-white hover:underline underline-offset-2">Firebase Console</a>.</li>
                      <li>Navigate to <strong className="text-white font-normal">Authentication</strong> &gt; <strong className="text-white font-normal">Settings</strong> &gt; <strong className="text-white font-normal">Authorized domains</strong>.</li>
                      <li>Click <strong className="text-white font-normal">Add domain</strong> and paste the host below:</li>
                    </ol>

                    <div className="flex items-center justify-between gap-2 p-1.5 rounded bg-white/5 border border-white/10 font-mono text-[9px] text-white font-semibold">
                      <span className="truncate select-all text-emerald-400">{currentDomain}</span>
                      <button
                        onClick={handleCopyDomain}
                        className="p-1 rounded hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer shrink-0"
                        title="Copy Domain Hostname"
                      >
                        {copiedDomain ? <CheckCircle2 size={12} className="text-emerald-400" /> : <Copy size={12} />}
                      </button>
                    </div>
                  </div>
                )}

                {/* Steps to resolve Anonymous login disabled */}
                {isAnonymousDisabled && (
                  <div className="p-3 bg-black/60 border border-white/5 rounded space-y-2.5 text-[10px] text-gray-300">
                    <p className="font-bold text-white uppercase text-[8px] tracking-widest border-b border-white/5 pb-1">
                      ACTION REQUIRED: ENABLE ANONYMOUS AUTH
                    </p>
                    <ol className="list-decimal list-inside space-y-1 text-gray-400 leading-relaxed">
                      <li>Go to your <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer" className="text-white hover:underline underline-offset-2">Firebase Console</a>.</li>
                      <li>Navigate to <strong className="text-white font-normal">Authentication</strong> &gt; <strong className="text-white font-normal">Sign-in method</strong>.</li>
                      <li>Under the <strong className="text-white font-normal">Sign-in providers</strong> list, locate <strong className="text-white font-normal">Anonymous</strong>.</li>
                      <li>Click edit, toggle to <strong className="text-white font-normal">Enable</strong>, and press <strong className="text-white font-normal">Save</strong>.</li>
                    </ol>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-1 border-t border-rose-500/10">
                  <button
                    onClick={clearAuthError}
                    className="px-2 py-1 bg-white/10 hover:bg-white/20 rounded text-[9px] uppercase tracking-wider font-bold text-white transition-all cursor-pointer"
                  >
                    Clear Warning
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Terminal Line Indicator */}
        <div className="my-6 border-t border-dashed border-white/10 relative">
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 px-2.5 bg-[#0a0712] text-[8px] text-gray-500 uppercase tracking-widest font-black">
            AUTHENTICATION METHOD
          </span>
        </div>

        {/* Buttons Stack */}
        <div className="space-y-3">
          {/* Google Sign-In */}
          <button
            onClick={loginWithGoogle}
            className="w-full flex items-center justify-center gap-2.5 py-3 px-4 rounded border border-white/20 bg-white text-black hover:bg-gray-200 active:scale-[0.99] transition-all text-xs font-bold uppercase tracking-wider cursor-pointer"
            id="auth-google-btn"
          >
            <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
              <path d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.113-5.136 4.113-3.41 0-6.19-2.774-6.19-6.19 0-3.41 2.78-6.19 6.19-6.19 1.465 0 2.809.516 3.867 1.378l3.14-3.14C18.91 2.422 15.82 1 12.24 1 6.033 1 12.24s5.033 11.24 11.24 11.24c6.478 0 11.753-4.7 11.753-11.24 0-.741-.077-1.442-.218-1.955H12.24z"/>
            </svg>
            Google Authorized Sign-in
          </button>

          {/* Guest Voyager Mode */}
          <button
            onClick={loginAnonymously}
            className="w-full flex items-center justify-center gap-2.5 py-3 px-4 rounded border border-white/10 bg-white/[0.02] text-white hover:bg-white/[0.06] active:scale-[0.99] transition-all text-xs font-bold uppercase tracking-wider cursor-pointer"
            id="auth-guest-btn"
          >
            <Compass size={14} className="shrink-0 text-gray-400" />
            Launch Guest Session (Offline)
          </button>
        </div>

        {/* Extra System Metadata */}
        <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-[8px] text-gray-500 font-bold tracking-widest">
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
            <span>SECURE CRYPTO CHANNEL</span>
          </div>
          <span>STELLAR L4-NODE V3</span>
        </div>
      </motion.div>
    </div>
  );
}
