import React from 'react';
import { UserRound, Cloud } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button, CopyButton, Notice, OrionMark } from './ui';

export default function AuthScreen() {
  const { loginWithGoogle, loginAnonymously, authError, clearAuthError, busy } = useAuth();
  const currentDomain = typeof window !== 'undefined' ? window.location.hostname : '';

  const isUnauthorizedDomain = authError?.includes('unauthorized');
  const isAnonymousDisabled = authError?.includes('admin-restricted-operation') || authError?.includes('restricted');

  return (
    <div className="rounded-t-3xl sm:rounded-3xl border border-line bg-deep p-6 sm:p-8 shadow-2xl">
      <div className="text-starlight mb-5">
        <OrionMark className="w-11 h-11" />
      </div>
      <h2 className="font-display font-bold text-2xl text-starlight">Sync across devices</h2>
      <p className="text-[15px] text-mist mt-2 leading-relaxed">
        Signing in is optional. It saves your watchlist and payment receipts to your account so they follow you to other
        browsers. Your wallet keys always stay in Freighter or MetaMask.
      </p>

      {authError && (
        <div className="mt-5 space-y-3">
          <Notice
            tone="bad"
            title={isUnauthorizedDomain ? 'This site is not allowed to sign in yet' : isAnonymousDisabled ? 'Guest sign-in is turned off' : 'Sign-in failed'}
            action={
              <Button size="sm" variant="ghost" onClick={clearAuthError}>
                Dismiss
              </Button>
            }
          >
            {isUnauthorizedDomain ? (
              <>
                Add this domain under Firebase Console → Authentication → Settings → Authorized domains:
                <span className="mt-2 flex items-center justify-between gap-2 rounded-lg bg-night/60 border border-line px-3 py-1.5">
                  <span className="font-mono text-[13px] text-starlight truncate">{currentDomain}</span>
                  <CopyButton value={currentDomain} toastText="Domain copied" />
                </span>
              </>
            ) : isAnonymousDisabled ? (
              'Enable the Anonymous provider in Firebase Console → Authentication → Sign-in method, or sign in with Google.'
            ) : (
              authError
            )}
          </Notice>
        </div>
      )}

      <div className="mt-6 space-y-3">
        <Button variant="primary" size="lg" className="w-full" loading={busy} onClick={loginWithGoogle} id="auth-google-btn"
          icon={
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.113-5.136 4.113-3.41 0-6.19-2.774-6.19-6.19 0-3.41 2.78-6.19 6.19-6.19 1.465 0 2.809.516 3.867 1.378l3.14-3.14C18.91 2.422 15.82 1 12.24 1 6.033 1 1 6.033 1 12.24s5.033 11.24 11.24 11.24c6.478 0 11.753-4.7 11.753-11.24 0-.741-.077-1.442-.218-1.955H12.24z" />
            </svg>
          }
        >
          Continue with Google
        </Button>
        <Button size="lg" className="w-full" disabled={busy} onClick={loginAnonymously} id="auth-guest-btn" icon={<UserRound size={16} />}>
          Continue as guest
        </Button>
      </div>
      <p className="text-[13px] text-haze mt-4 flex items-start gap-2">
        <Cloud size={14} className="shrink-0 mt-0.5" />
        A guest account syncs on this device only, and is lost if you sign out.
      </p>
    </div>
  );
}
