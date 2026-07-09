import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics, isSupported } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: "AIzaSyCusBksTq7c93EpIjiHueviY-KFFmAgN18",
  authDomain: "orion-c4ee4.firebaseapp.com",
  projectId: "orion-c4ee4",
  storageBucket: "orion-c4ee4.firebasestorage.app",
  messagingSenderId: "768506762758",
  appId: "1:768506762758:web:c4f47827b07447a29f1587",
  measurementId: "G-CYWXRJLT8T"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

// Initialize Analytics optionally if supported in the user browser environment
export let analytics: any = null;
if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  });
}

export default app;
