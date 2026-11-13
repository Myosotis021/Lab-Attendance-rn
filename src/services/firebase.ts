import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  initializeAuth,
  getAuth,
  Auth,
  // @ts-ignore -- AsyncStorage persistence tersedia di react-native bundle firebase/auth
  AsyncLocalStorage,
} from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Konfigurasi Firebase dari environment variables (awalan EXPO_PUBLIC_)
// Fallback dummy disediakan agar aplikasi tetap dapat di-build/test jika .env belum diisi
const firebaseConfig = {
  apiKey:
    process.env.EXPO_PUBLIC_FIREBASE_API_KEY ||
    'AIzaSyDummyKeyForDevelopmentTestingOnly123',
  authDomain:
    process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ||
    'lab-attendance-dev.firebaseapp.com',
  projectId:
    process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || 'lab-attendance-dev',
  storageBucket:
    process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ||
    'lab-attendance-dev.firebasestorage.app',
  messagingSenderId:
    process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '123456789012',
  appId:
    process.env.EXPO_PUBLIC_FIREBASE_APP_ID ||
    '1:123456789012:web:abcdef1234567890abcdef',
};

// Inisialisasi Firebase App (singleton)
const app: FirebaseApp =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Inisialisasi Firebase Auth
// Pada React Native, firebase/auth secara otomatis menggunakan AsyncStorage
// bila diinisialisasi tanpa opsi persistence eksplisit (firebase ≥ v10.x).
let auth: Auth;
try {
  auth = initializeAuth(app);
} catch {
  // Sudah diinisialisasi sebelumnya (misal saat fast-refresh)
  auth = getAuth(app);
}

// Inisialisasi Cloud Firestore
const db: Firestore = getFirestore(app);

export { app, auth, db };
export default app;
