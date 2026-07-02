import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { 
  User, 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInAnonymously as firebaseSignInAnonymously,
  signOut,
  signInWithPopup,
  updateProfile
} from 'firebase/auth';
import { auth, googleProvider } from '../services/firebase';
import { toast } from 'react-hot-toast';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, displayName: string) => Promise<void>;
  signInAnonymously: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    }, (error) => {
      console.error('Auth state change error:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithEmail = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast.success('Signed in successfully!');
    } catch (error: any) {
      console.error('Sign in error:', error);
      let message = 'Failed to sign in. Please check your credentials.';
      if (error.code === 'auth/invalid-credential') {
        message = 'Invalid email or password.';
      } else if (error.code === 'auth/user-not-found') {
        message = 'No account found with this email.';
      } else if (error.code === 'auth/wrong-password') {
        message = 'Incorrect password.';
      } else if (error.code === 'auth/invalid-email') {
        message = 'Please provide a valid email address.';
      }
      toast.error(message);
      throw error;
    }
  };

  const signUpWithEmail = async (email: string, password: string, displayName: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      if (userCredential.user) {
        await updateProfile(userCredential.user, { displayName });
        // Force state update by cloning user
        setUser({ ...userCredential.user, displayName });
      }
      toast.success('Account created successfully!');
    } catch (error: any) {
      console.error('Sign up error:', error);
      let message = 'Failed to create account.';
      if (error.code === 'auth/email-already-in-use') {
        message = 'This email is already registered.';
      } else if (error.code === 'auth/weak-password') {
        message = 'Password must be at least 6 characters.';
      } else if (error.code === 'auth/invalid-email') {
        message = 'Please provide a valid email address.';
      }
      toast.error(message);
      throw error;
    }
  };

  const signInAnonymously = async () => {
    try {
      await firebaseSignInAnonymously(auth);
      toast.success('Logged in as Guest Voyager!');
    } catch (error: any) {
      console.error('Anonymous auth error:', error);
      toast.error('Failed to sign in as guest.');
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      toast.success('Signed in with Google!');
    } catch (error: any) {
      console.error('Google auth error:', error);
      
      let message = 'Google login failed. Please try again.';
      if (error.code === 'auth/popup-closed-by-user') {
        message = 'Google login window closed. (Tip: If inside the preview sandbox, open the app in a new tab or use the Email/Guest fallback).';
        toast.error(message, { duration: 6000 });
      } else if (error.code === 'auth/popup-blocked') {
        message = 'Google login popup was blocked by your browser. Please allow popups or use the Email/Guest fallback.';
        toast.error(message, { duration: 6000 });
      } else if (error.code === 'auth/operation-not-allowed') {
        message = 'Google Sign-In is not enabled in Firebase Console.';
        toast.error(message);
      } else {
        toast.error(message);
      }
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      toast.success('Signed out successfully.');
    } catch (error) {
      console.error('Sign out error:', error);
      toast.error('Failed to sign out.');
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      signInWithEmail,
      signUpWithEmail,
      signInAnonymously,
      signInWithGoogle,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
