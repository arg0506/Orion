import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  onAuthStateChanged, 
  signOut, 
  signInWithPopup, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signInAnonymously
} from 'firebase/auth';
import { auth, googleProvider } from '../services/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { toast } from 'react-hot-toast';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  busy: boolean;
  authError: string | null;
  clearAuthError: () => void;
  loginWithGoogle: () => Promise<void>;
  loginAnonymously: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setLoading(false);

      if (currentUser) {
        setAuthError(null);
        // Sync or register user profile document in Firestore
        try {
          const userDocRef = doc(db, 'users', currentUser.uid);
          await setDoc(userDocRef, {
            uid: currentUser.uid,
            email: currentUser.email || 'anonymous',
            displayName: currentUser.displayName || 'Orion user',
            lastLogin: new Date().toISOString(),
          }, { merge: true });
        } catch (err) {
          console.error('Error auto-syncing user details to Firestore:', err);
        }
      }
    });

    return unsubscribe;
  }, []);

  const loginWithGoogle = async () => {
    try {
      setBusy(true);
      setAuthError(null);
      await signInWithPopup(auth, googleProvider);
      toast.success('Signed in with Google');
    } catch (error: any) {
      console.error('Google Sign-In Error:', error);
      setAuthError(error.code || error.message || 'auth/unauthorized-domain');
      toast.error(error.message || 'Failed to authenticate via Google.');
    } finally {
      setBusy(false);
    }
  };

  const loginAnonymously = async () => {
    try {
      setBusy(true);
      setAuthError(null);
      await signInAnonymously(auth);
      toast.success('Signed in as a guest');
    } catch (error: any) {
      console.error('Anonymous Sign-In Error:', error);
      setAuthError(error.code || error.message || 'auth/admin-restricted-operation');
      toast.error(error.message || 'Failed to sign in anonymously.');
    } finally {
      setBusy(false);
    }
  };

  const logout = async () => {
    try {
      setBusy(true);
      setAuthError(null);
      await signOut(auth);
      toast.success('Signed out');
    } catch (error: any) {
      console.error('Sign-Out Error:', error);
      toast.error('Failed to log out.');
    } finally {
      setBusy(false);
    }
  };

  const clearAuthError = () => setAuthError(null);

  return (
    <AuthContext.Provider value={{ user, loading, busy, authError, clearAuthError, loginWithGoogle, loginAnonymously, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
