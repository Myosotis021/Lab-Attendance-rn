import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  initializeAuth,
  getAuth,
  // @ts-ignore -- getReactNativePersistence is available in React Native environment
  getReactNativePersistence,
  Auth,
} from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { getFirestore, Firestore } from 'firebase/firestore';

export const firebaseConfig = {
  apiKey:
    process.env.EXPO_PUBLIC_FIREBASE_API_KEY ||
    'AIzaSyAxKLvMrCcIgzIky64TiRozAsYVyQCYDWI',
  authDomain:
    process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ||
    'lab-attendance-41997.firebaseapp.com',
  projectId:
    process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || 'lab-attendance-41997',
  storageBucket:
    process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ||
    'lab-attendance-41997.firebasestorage.app',
  messagingSenderId:
    process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '358775145791',
  appId:
    process.env.EXPO_PUBLIC_FIREBASE_APP_ID ||
    '1:358775145791:android:cdc121b25d9574efe8bf8a',
};

// Inisialisasi Firebase App (singleton)
const app: FirebaseApp =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Inisialisasi Firebase Auth
let auth: Auth;
try {
  if (Platform.OS === 'web') {
    auth = getAuth(app);
  } else {
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  }
} catch {
  auth = getAuth(app);
}

// Inisialisasi Cloud Firestore
export const db: Firestore = getFirestore(app);

export { app, auth };
export default app;
