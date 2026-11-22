import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { Platform } from 'react-native';
import { db } from './firebase';

/**
 * Simpan push token pengguna ke Firestore
 * Dokumen: fcmTokens/{uid}
 */
export async function saveFcmToken(uid: string, token: string): Promise<void> {
  if (!uid || !token) return;

  try {
    const docRef = doc(db, 'fcmTokens', uid);
    await setDoc(
      docRef,
      {
        uid,
        token,
        platform: Platform.OS === 'ios' ? 'ios' : 'android',
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (error) {
    console.warn('Gagal menyimpan FCM token:', error);
  }
}

/**
 * Ambil token pengguna berdasarkan UID
 */
export async function getFcmToken(uid: string): Promise<string | null> {
  if (!uid) return null;

  try {
    const docRef = doc(db, 'fcmTokens', uid);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return (snap.data().token as string) || null;
    }
  } catch (error) {
    console.warn('Gagal mengambil FCM token untuk user:', uid, error);
  }
  return null;
}

/**
 * Ambil token dari banyak pengguna
 */
export async function getFcmTokensForUsers(uids: string[]): Promise<string[]> {
  if (!uids || uids.length === 0) return [];

  const tokens: string[] = [];
  try {
    const promises = uids.map(async (uid) => {
      const token = await getFcmToken(uid);
      if (token) {
        tokens.push(token);
      }
    });
    await Promise.all(promises);
  } catch (error) {
    console.warn('Gagal mengambil daftar FCM token:', error);
  }

  return tokens;
}
