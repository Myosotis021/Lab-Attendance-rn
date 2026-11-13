import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

export const firebaseConfig = {
  apiKey: 'AIzaSyAxKLvMrCcIgzIky64TiRozAsYVyQCYDWI',
  projectId: 'lab-attendance-41997',
  storageBucket: 'lab-attendance-41997.firebasestorage.app',
  appId: '1:358775145791:android:cdc121b25d9574efe8bf8a',
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app);

export default app;
