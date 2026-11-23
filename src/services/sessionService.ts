import {
  collection,
  doc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  query,
  onSnapshot,
  runTransaction,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { SessionItem, SessionStatus } from '../types/models';
import { isSessionTimeReached, formatJakartaTime } from '../utils/timeUtils';
import { sendPushToUsers } from './notificationService';

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
  scheduledAt?: Timestamp;
  scheduledEndAt?: Timestamp;
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
    ...(data.scheduledAt ? { scheduledAt: data.scheduledAt } : {}),
    ...(data.scheduledEndAt ? { scheduledEndAt: data.scheduledEndAt } : {}),
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
 * Mengubah status sesi praktikum.
 * Disertai validasi waktu mulai (scheduledAt) dan push notification trigger.
 * BELUM_DIBUKA -> BERJALAN
 * BERJALAN -> SELESAI
 * Sesi SELESAI tidak dapat dibuka lagi
 */
export async function setSessionStatus(
  id: string,
  newStatus: SessionStatus
): Promise<void> {
  const sessionRef = doc(db, 'sessions', id);

  // Ambil data sesi untuk validasi waktu dan notification
  const snap = await getDoc(sessionRef);
  if (!snap.exists()) {
    throw new Error('Dokumen sesi tidak ditemukan.');
  }

  const sessionData = snap.data();

  // Validasi waktu saat membuka sesi (toleransi 5 menit lebih awal)
  if (newStatus === 'BERJALAN') {
    const scheduledAt = sessionData.scheduledAt as Timestamp | undefined;
    if (scheduledAt && !isSessionTimeReached(scheduledAt)) {
      const formatted = formatJakartaTime(scheduledAt);
      throw new Error(`Sesi belum dapat dibuka. Jadwal dimulai: ${formatted}`);
    }
  }

  // Update status dengan transaksi (atomik)
  await runTransaction(db, async (transaction) => {
    const sessionDoc = await transaction.get(sessionRef);
    if (!sessionDoc.exists()) {
      throw new Error('Dokumen sesi tidak ditemukan.');
    }

    const currentStatus = sessionDoc.data().status as SessionStatus;

    if (currentStatus === 'SELESAI') {
      throw new Error('Sesi telah selesai dan tidak dapat diubah statusnya lagi.');
    }

    if (newStatus === 'BERJALAN' && currentStatus !== 'BELUM_DIBUKA') {
      throw new Error(`Tidak dapat membuka sesi. Status saat ini: ${currentStatus}`);
    }

    if (newStatus === 'SELESAI' && currentStatus !== 'BERJALAN') {
      throw new Error(`Tidak dapat menutup sesi. Status saat ini: ${currentStatus}`);
    }

    const updates: Record<string, any> = {
      status: newStatus,
      updatedAt: serverTimestamp(),
    };
    if (newStatus === 'BERJALAN') updates.openedAt = serverTimestamp();
    if (newStatus === 'SELESAI') updates.closedAt = serverTimestamp();

    transaction.update(sessionRef, updates);
  });

  // Kirim push notification ke peserta
  const participantIds = (sessionData.participantIds as string[]) || [];
  const courseTitle = sessionData.courseTitle || 'Praktikum';

  if (participantIds.length > 0) {
    if (newStatus === 'BERJALAN') {
      await sendPushToUsers(
        participantIds,
        `Sesi ${courseTitle} Telah Dibuka!`,
        `Segera lakukan presensi sebelum sesi berakhir.`,
        { type: 'SESSION_OPENED', sessionId: id }
      );
    } else if (newStatus === 'SELESAI') {
      await sendPushToUsers(
        participantIds,
        `Sesi Ditutup`,
        `Sesi ${courseTitle} telah ditutup oleh asisten.`,
        { type: 'SESSION_CLOSED', sessionId: id }
      );
    }
  }
}

/**
 * Ganti jadwal sesi praktikum (BUG-03)
 * Hanya dapat diubah saat status masih BELUM_DIBUKA dan waktu di masa depan.
 */
export async function rescheduleSession(
  id: string,
  data: {
    scheduledAt: Timestamp;
    scheduledEndAt: Timestamp;
    timeSlot: string;
  }
): Promise<void> {
  const sessionRef = doc(db, 'sessions', id);
  const snap = await getDoc(sessionRef);

  if (!snap.exists()) {
    throw new Error('Sesi tidak ditemukan.');
  }

  const sessionData = snap.data();
  if (sessionData.status !== 'BELUM_DIBUKA') {
    throw new Error('Jadwal hanya dapat diubah selama sesi belum dibuka.');
  }

  if (data.scheduledAt.toDate() <= new Date()) {
    throw new Error('Waktu mulai sesi harus di masa yang akan datang.');
  }

  await updateDoc(sessionRef, {
    scheduledAt: data.scheduledAt,
    scheduledEndAt: data.scheduledEndAt,
    timeSlot: data.timeSlot,
    updatedAt: serverTimestamp(),
  });

  // Kirim notifikasi perubahan jadwal
  const participantIds = (sessionData.participantIds as string[]) || [];
  const courseTitle = sessionData.courseTitle || 'Praktikum';

  if (participantIds.length > 0) {
    await sendPushToUsers(
      participantIds,
      `Perubahan Jadwal Sesi`,
      `Jadwal ${courseTitle} diubah ke ${data.timeSlot}.`,
      { type: 'SCHEDULE_CHANGED', sessionId: id }
    );
  }
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
        scheduledAt: data.scheduledAt,
        scheduledEndAt: data.scheduledEndAt,
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

/**
 * Real-time listener untuk daftar sesi
 */
export function listenSessions(
  onUpdate: (sessions: SessionItem[]) => void,
  onError?: (err: any) => void
): () => void {
  const q = query(collection(db, 'sessions'));
  return onSnapshot(
    q,
    (snap) => {
      const items: SessionItem[] = [];
      snap.forEach((d) => {
        items.push({ id: d.id, ...d.data() } as SessionItem);
      });
      onUpdate(items);
    },
    (err) => {
      if (onError) onError(err);
    }
  );
}
