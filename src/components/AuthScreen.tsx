import React from 'react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'motion/react';
import { Shield, Lock, LogIn, Compass, Terminal } from 'lucide-react';
import orionLogo from '../assets/images/orion_logo_1783011957450.jpg';

export default function AuthScreen() {
  const { loginWithGoogle, loginAnonymously } = useAuth();

  return (
    <div className="w-full max-w-md mx-auto p-1 font-mono">
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
              <path d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.113-5.136 4.113-3.41 0-6.19-2.774-6.19-6.19 0-3.41 2.78-6.19 6.19-6.19 1.465 0 2.809.516 3.867 1.378l3.14-3.14C18.91 2.422 15.82 1 12.24 1 6.033 1 1 6.033 1 12.24s5.033 11.24 11.24 11.24c6.478 0 11.753-4.7 11.753-11.24 0-.741-.077-1.442-.218-1.955H12.24z"/>
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
