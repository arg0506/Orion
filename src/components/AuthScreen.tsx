import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, Mail, Lock, User as UserIcon, RefreshCw, Sparkles, Globe, Terminal, ArrowRight } from 'lucide-react';
import orionLogo from '../assets/images/orion_logo_1783011957450.jpg';

export default function AuthScreen() {
  const { signInWithEmail, signUpWithEmail, signInAnonymously, signInWithGoogle } = useAuth();
  
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (isSignUp) {
        await signUpWithEmail(email, password, displayName || 'Pilot Voyager');
      } else {
        await signInWithEmail(email, password);
      }
    } catch (err) {
      // toast is already fired inside AuthContext
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestSignIn = async () => {
    setIsLoading(true);
    try {
      await signInAnonymously();
    } catch (err) {
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      await signInWithGoogle();
    } catch (err) {
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md w-full mx-auto p-8 rounded bg-white/[0.02] border border-white/10 shadow-2xl backdrop-blur-2xl relative overflow-hidden font-mono text-xs text-gray-400">
      {/* Subtle background glow */}
      <div className="absolute top-0 right-0 -translate-y-8 translate-x-8 w-24 h-24 rounded-full bg-white/[0.02] blur-xl pointer-events-none"></div>

      {/* Header Info */}
      <div className="text-center space-y-3 mb-8">
        <div className="w-16 h-16 mx-auto rounded-full overflow-hidden border border-white/20 shadow-[0_0_20px_rgba(255,255,255,0.3)] flex items-center justify-center bg-black">
          <img 
            src={orionLogo} 
            alt="Orion Logo" 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
        <div>
          <span className="text-[9px] font-bold text-white uppercase tracking-widest block mb-1">Orion Secure Terminal</span>
          <h3 className="font-display font-extrabold text-base text-white uppercase tracking-wider">
            {isSignUp ? 'REGISTER COMMAND PASS' : 'SECURE DECRYPT LOGIN'}
          </h3>
          <p className="text-[11px] text-gray-500 mt-1 max-w-xs mx-auto leading-relaxed">
            {isSignUp 
              ? 'Establish a secure account to save watchlists, record node sequences, and transmit signed payloads.' 
              : 'Authenticate your cryptographic session keys to access the Orion voyager cockpit.'
            }
          </p>
        </div>
      </div>

      {/* Main Authentication Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {isSignUp && (
          <div className="space-y-1.5">
            <label className="block text-[9px] font-bold text-gray-500 uppercase tracking-widest">
              Voyager Callsign (Name)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600">
                <UserIcon size={12} />
              </span>
              <input
                type="text"
                required
                disabled={isLoading}
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="PILOT_ONE"
                className="w-full bg-black/60 border border-white/10 focus:border-white rounded pl-10 pr-4 py-3 focus:outline-none transition-all placeholder:text-gray-700 text-white"
              />
            </div>
          </div>
        )}

        <div className="space-y-1.5">
          <label className="block text-[9px] font-bold text-gray-500 uppercase tracking-widest">
            Security Email
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600">
              <Mail size={12} />
            </span>
            <input
              type="email"
              required
              disabled={isLoading}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="pilot@stellarvoyager.org"
              className="w-full bg-black/60 border border-white/10 focus:border-white rounded pl-10 pr-4 py-3 focus:outline-none transition-all placeholder:text-gray-700 text-white"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-[9px] font-bold text-gray-500 uppercase tracking-widest">
            Cryptographic Password
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600">
              <Lock size={12} />
            </span>
            <input
              type="password"
              required
              disabled={isLoading}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full bg-black/60 border border-white/10 focus:border-white rounded pl-10 pr-4 py-3 focus:outline-none transition-all placeholder:text-gray-700 text-white"
            />
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded font-bold text-xs bg-white text-black hover:bg-gray-200 transition-all cursor-pointer uppercase tracking-widest disabled:opacity-40"
        >
          {isLoading ? (
            <>
              <RefreshCw size={12} className="animate-spin" />
              AUTHENTICATING...
            </>
          ) : (
            <>
              <Terminal size={12} />
              {isSignUp ? 'REGISTER SECURITY GATE' : 'AUTHORIZE COCKPIT'}
            </>
          )}
        </button>
      </form>

      {/* Alternative Credentials Sign-In options */}
      <div className="mt-6 pt-5 border-t border-white/5 space-y-4">
        <span className="block text-center text-[9px] text-gray-600 uppercase tracking-widest">
          Alternative Secure Entry
        </span>

        <div className="grid grid-cols-2 gap-3">
          {/* Guest Pass */}
          <button
            onClick={handleGuestSignIn}
            disabled={isLoading}
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded border border-white/10 bg-white/[0.01] hover:border-white hover:bg-white/5 text-gray-300 hover:text-white transition-all cursor-pointer text-[10px] uppercase tracking-wider"
          >
            <Globe size={11} />
            GUEST PASS
          </button>

          {/* Google Entry */}
          <button
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded border border-white/10 bg-white/[0.01] hover:border-white hover:bg-white/5 text-gray-300 hover:text-white transition-all cursor-pointer text-[10px] uppercase tracking-wider"
          >
            <Sparkles size={11} />
            GOOGLE ID
          </button>
        </div>

        {/* Toggle Mode button */}
        <div className="text-center pt-2">
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            disabled={isLoading}
            className="text-[10px] text-gray-500 hover:text-white transition-colors uppercase tracking-wider underline decoration-dashed"
          >
            {isSignUp ? 'Already registered? Access cockpit' : 'Create new security credentials'}
          </button>
        </div>
      </div>
    </div>
  );
}
