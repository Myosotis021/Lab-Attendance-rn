import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyC-5ZuIdgPGcJMPVY3ejuuIGUVtm9SoB_c',
  authDomain: 'mobile-app1-2e227.firebaseapp.com',
  projectId: 'mobile-app1-2e227',
  storageBucket: 'mobile-app1-2e227.firebasestorage.app',
  messagingSenderId: '1913853248',
  appId: '1:1913853248:android:6274ff01fac9039c8356a5',
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
export default app;

