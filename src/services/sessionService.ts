import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { SessionItem } from '../types/models';
import { INITIAL_SCHEDULES } from '../data/schedules';

const SESSIONS_COLLECTION = 'sessions';

/**
 * Mendengarkan semua sesi praktikum secara real-time
 * Jika Firestore belum memiliki data sesi, fallback ke INITIAL_SCHEDULES
 */
export function listenSessions(
  onUpdate: (sessions: SessionItem[]) => void,
  onError?: (err: unknown) => void
): () => void {
  const collRef = collection(db, SESSIONS_COLLECTION);
  return onSnapshot(
    collRef,
    (snapshot) => {
      if (snapshot.empty) {
        // Fallback ke schedules mock bawaan jika Firestore belum diisi
        onUpdate(INITIAL_SCHEDULES);
        return;
      }

      const list: SessionItem[] = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          classId: data.classId || '',
          courseTitle: data.courseTitle || '',
          moduleName: data.moduleName || '',
          classGroup: data.classGroup || '',
          roomName: data.roomName || '',
          timeSlot: data.timeSlot || '',
          status: data.status || 'BELUM_DIBUKA',
          participantIds: Array.isArray(data.participantIds)
            ? data.participantIds
            : [],
          createdBy: data.createdBy || '',
          createdAt: data.createdAt || Timestamp.now(),
        };
      });

      onUpdate(list);
    },
    (err) => {
      console.error('Error listenSessions, using fallback:', err);
      onUpdate(INITIAL_SCHEDULES);
      onError?.(err);
    }
  );
}

/**
 * Mendengarkan satu sesi praktikum tertentu
 */
export function listenSession(
  sessionId: string,
  onUpdate: (session: SessionItem | null) => void,
  onError?: (err: unknown) => void
): () => void {
  const sessionRef = doc(db, SESSIONS_COLLECTION, sessionId);
  return onSnapshot(
    sessionRef,
    (snap) => {
      if (!snap.exists()) {
        // Cek apakah ada di INITIAL_SCHEDULES
        const mock = INITIAL_SCHEDULES.find((s) => s.id === sessionId);
        onUpdate(mock || null);
        return;
      }
      const data = snap.data();
      onUpdate({
        id: snap.id,
        classId: data.classId || '',
        courseTitle: data.courseTitle || '',
        moduleName: data.moduleName || '',
        classGroup: data.classGroup || '',
        roomName: data.roomName || '',
        timeSlot: data.timeSlot || '',
        status: data.status || 'BELUM_DIBUKA',
        participantIds: Array.isArray(data.participantIds)
          ? data.participantIds
          : [],
        createdBy: data.createdBy || '',
        createdAt: data.createdAt || Timestamp.now(),
      });
    },
    (err) => {
      console.error('Error listenSession:', err);
      const mock = INITIAL_SCHEDULES.find((s) => s.id === sessionId);
      onUpdate(mock || null);
      onError?.(err);
    }
  );
}

/**
 * Mendapatkan satu sesi praktikum sekali fetch
 */
export async function getSessionById(
  sessionId: string
): Promise<SessionItem | null> {
  try {
    const sessionRef = doc(db, SESSIONS_COLLECTION, sessionId);
    const snap = await getDoc(sessionRef);
    if (snap.exists()) {
      const data = snap.data();
      return {
        id: snap.id,
        classId: data.classId || '',
        courseTitle: data.courseTitle || '',
        moduleName: data.moduleName || '',
        classGroup: data.classGroup || '',
        roomName: data.roomName || '',
        timeSlot: data.timeSlot || '',
        status: data.status || 'BELUM_DIBUKA',
        participantIds: Array.isArray(data.participantIds)
          ? data.participantIds
          : [],
        createdBy: data.createdBy || '',
        createdAt: data.createdAt || Timestamp.now(),
      };
    }
  } catch (err) {
    console.warn('getSessionById failed, falling back to mock:', err);
  }

  const mock = INITIAL_SCHEDULES.find((s) => s.id === sessionId);
  return mock || null;
}
