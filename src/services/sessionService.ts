import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  onSnapshot,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { SessionItem, SessionStatus } from '../types/models';
import { isSessionTimeReached, formatJakartaTime } from '../utils/timeUtils';
import { sendPushToUsers } from './notificationService';

/**
 * Update status sesi praktikum (SRS-06, BUG-02)
 * Disertai validasi waktu mulai (scheduledAt) dan push notification trigger.
 */
export async function setSessionStatus(
  id: string,
  newStatus: SessionStatus
): Promise<void> {
  const sessionRef = doc(db, 'sessions', id);
  const snap = await getDoc(sessionRef);

  if (!snap.exists()) {
    // Jika dokumen belum ada di Firestore (misalnya data mock lokal),
    // simulasikan error jika mencoba buka sesi mock yang belum waktunya
    console.warn(`Sesi dengan ID ${id} tidak ditemukan di Firestore.`);
    return;
  }

  const sessionData = snap.data();

  // Validasi waktu saat membuka sesi: hanya bisa dibuka jika waktu sudah tiba (toleransi 5 menit)
  if (newStatus === 'BERJALAN') {
    const scheduledAt = sessionData.scheduledAt as Timestamp | undefined;
    if (scheduledAt && !isSessionTimeReached(scheduledAt)) {
      const formatted = formatJakartaTime(scheduledAt);
      throw new Error(`Sesi belum dapat dibuka. Jadwal dimulai: ${formatted}`);
    }
  }

  const updates: Record<string, any> = {
    status: newStatus,
    updatedAt: serverTimestamp(),
  };

  if (newStatus === 'BERJALAN') {
    updates.openedAt = serverTimestamp();
  } else if (newStatus === 'SELESAI') {
    updates.closedAt = serverTimestamp();
  }

  await updateDoc(sessionRef, updates);

  // Trigger push notification ke semua praktikan terdaftar (participantIds)
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
    timeSlot: string; // label tampilan yang diperbarui
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

  // Validasi: scheduledAt harus di masa depan
  if (data.scheduledAt.toDate() <= new Date()) {
    throw new Error('Waktu mulai sesi harus di masa yang akan datang.');
  }

  await updateDoc(sessionRef, {
    scheduledAt: data.scheduledAt,
    scheduledEndAt: data.scheduledEndAt,
    timeSlot: data.timeSlot,
    updatedAt: serverTimestamp(),
  });

  // Trigger notifikasi perubahan jadwal ke semua peserta kelas
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
 * Buat sesi praktikum baru
 */
export async function createSession(
  session: Omit<SessionItem, 'id'> & { id?: string }
): Promise<string> {
  const colRef = collection(db, 'sessions');
  const sessionDoc = session.id ? doc(db, 'sessions', session.id) : doc(colRef);

  await setDoc(sessionDoc, {
    ...session,
    id: sessionDoc.id,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return sessionDoc.id;
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
