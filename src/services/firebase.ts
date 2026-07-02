import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCNicshhTJ2b-p8hyd2HBqfDlZ_xj_gx9Q",
  authDomain: "gen-lang-client-0677309845.firebaseapp.com",
  projectId: "gen-lang-client-0677309845",
  storageBucket: "gen-lang-client-0677309845.firebasestorage.app",
  messagingSenderId: "495394948986",
  appId: "1:495394948986:web:e2e375399bfd1e2589b8c3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

export default app;
