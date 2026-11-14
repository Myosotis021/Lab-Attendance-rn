import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  onSnapshot,
  runTransaction,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { SessionItem, SessionStatus } from '../types/models';

/**
 * Menambahkan sesi praktikum baru
 * Status awal selalu 'BELUM_DIBUKA'
 */
export async function createSession(data: {
  classId: string;
  courseTitle: string;
  moduleName: string;
  classGroup: string;
  roomName: string;
  timeSlot: string;
  participantIds: string[];
  createdBy: string;
}): Promise<string> {
  const docRef = await addDoc(collection(db, 'sessions'), {
    classId: data.classId,
    courseTitle: data.courseTitle.trim(),
    moduleName: data.moduleName.trim(),
    classGroup: data.classGroup.trim(),
    roomName: data.roomName.trim(),
    timeSlot: data.timeSlot.trim(),
    status: 'BELUM_DIBUKA' as SessionStatus,
    participantIds: data.participantIds || [],
    createdBy: data.createdBy,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

/**
 * Mengubah sesi praktikum (Hanya boleh jika status BELUM_DIBUKA)
 */
export async function updateSession(
  id: string,
  data: {
    moduleName?: string;
    timeSlot?: string;
    courseTitle?: string;
    classGroup?: string;
    roomName?: string;
    participantIds?: string[];
  }
): Promise<void> {
  const sessionRef = doc(db, 'sessions', id);
  const snap = await getDoc(sessionRef);

  if (!snap.exists()) {
    throw new Error('Sesi tidak ditemukan.');
  }

  const currentData = snap.data();
  if (currentData.status !== 'BELUM_DIBUKA') {
    throw new Error('Sesi hanya dapat diubah jika status masih BELUM DIBUKA.');
  }

  await updateDoc(sessionRef, {
    ...(data.moduleName ? { moduleName: data.moduleName.trim() } : {}),
    ...(data.timeSlot ? { timeSlot: data.timeSlot.trim() } : {}),
    ...(data.courseTitle ? { courseTitle: data.courseTitle.trim() } : {}),
    ...(data.classGroup ? { classGroup: data.classGroup.trim() } : {}),
    ...(data.roomName ? { roomName: data.roomName.trim() } : {}),
    ...(data.participantIds ? { participantIds: data.participantIds } : {}),
    updatedAt: serverTimestamp(),
  });
}

/**
 * Menghapus sesi praktikum (Hanya boleh jika status BELUM_DIBUKA)
 */
export async function deleteSession(id: string): Promise<void> {
  const sessionRef = doc(db, 'sessions', id);
  const snap = await getDoc(sessionRef);

  if (!snap.exists()) {
    throw new Error('Sesi tidak ditemukan.');
  }

  const currentData = snap.data();
  if (currentData.status !== 'BELUM_DIBUKA') {
    throw new Error('Sesi hanya dapat dihapus jika status masih BELUM DIBUKA.');
  }

  await deleteDoc(sessionRef);
}

/**
 * Mengubah status sesi praktikum secara berurutan dan atomik
 * BELUM_DIBUKA -> BERJALAN
 * BERJALAN -> SELESAI
 * Sesi SELESAI tidak dapat dibuka lagi
 */
export async function setSessionStatus(
  id: string,
  newStatus: SessionStatus
): Promise<void> {
  const sessionRef = doc(db, 'sessions', id);

  await runTransaction(db, async (transaction) => {
    const sessionDoc = await transaction.get(sessionRef);
    if (!sessionDoc.exists()) {
      throw new Error('Dokumen sesi tidak ditemukan.');
    }

    const currentStatus = sessionDoc.data().status as SessionStatus;

    if (currentStatus === 'SELESAI') {
      throw new Error('Sesi telah selesai dan tidak dapat diubah statusnya lagi.');
    }

    if (newStatus === 'BERJALAN') {
      if (currentStatus !== 'BELUM_DIBUKA') {
        throw new Error(
          `Tidak dapat membuka sesi. Status saat ini adalah: ${currentStatus}`
        );
      }
    } else if (newStatus === 'SELESAI') {
      if (currentStatus !== 'BERJALAN') {
        throw new Error(
          `Tidak dapat menutup sesi. Status saat ini adalah: ${currentStatus}`
        );
      }
    } else {
      throw new Error(`Transisi ke status ${newStatus} tidak diperbolehkan.`);
    }

    transaction.update(sessionRef, {
      status: newStatus,
      updatedAt: serverTimestamp(),
    });
  });
}

/**
 * Mendengarkan perubahan data sesi tertentu secara real-time
 */
export function listenSession(
  id: string,
  onUpdate: (session: SessionItem | null) => void,
  onError?: (err: unknown) => void
): () => void {
  const sessionRef = doc(db, 'sessions', id);
  return onSnapshot(
    sessionRef,
    (snap) => {
      if (!snap.exists()) {
        onUpdate(null);
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
        participantIds: Array.isArray(data.participantIds) ? data.participantIds : [],
        createdBy: data.createdBy || '',
        createdAt: data.createdAt || Timestamp.now(),
      } as SessionItem);
    },
    (err) => {
      console.error('Error listenSession:', err);
      onError?.(err);
    }
  );
}
