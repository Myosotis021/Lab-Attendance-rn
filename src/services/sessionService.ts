import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  onSnapshot,
  runTransaction,
  writeBatch,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { SessionItem, SessionStatus, SessionType } from '../types/models';
import {
  isSessionTimeReached,
  formatJakartaTime,
  getDefaultSessionSchedule,
} from '../utils/timeUtils';
import { sendPushToUsers } from './notificationService';
import { INITIAL_SCHEDULES } from '../data/schedules';
import { isOnlineRoom } from '../data/labLocations';

const SESSIONS_COLLECTION = 'sessions';

export function generateSessionQrToken(sessionId: string): string {
  const rand = Math.random().toString(36).substring(2, 10).toUpperCase();
  const ts = Date.now().toString(36).toUpperCase();
  return `PPK-QR:${sessionId}:${ts}:${rand}`;
}

export function mapSessionDocToItem(id: string, data: Record<string, any>): SessionItem {
  const hasPickerTime = Boolean(data.usesDateTimePicker && data.scheduledAt && data.scheduledEndAt);
  const fallbackSchedule = hasPickerTime ? null : getDefaultSessionSchedule();
  const resolvedRoom = data.roomName || '';
  const resolvedType: SessionType =
    data.sessionType === 'ONLINE' || isOnlineRoom(resolvedRoom, data.sessionType)
      ? 'ONLINE'
      : 'OFFLINE';

  return {
    id,
    classId: data.classId || '',
    courseTitle: data.courseTitle || '',
    moduleName: data.moduleName || '',
    classGroup: data.classGroup || '',
    roomName: resolvedRoom,
    timeSlot: hasPickerTime ? data.timeSlot || '' : fallbackSchedule!.timeSlot,
    scheduledAt: hasPickerTime ? data.scheduledAt : fallbackSchedule!.scheduledAt,
    scheduledEndAt: hasPickerTime ? data.scheduledEndAt : fallbackSchedule!.scheduledEndAt,
    status: (data.status as SessionStatus) || 'BELUM_DIBUKA',
    sessionType: resolvedType,
    qrToken: data.qrToken || undefined,
    assistantLat: typeof data.assistantLat === 'number' ? data.assistantLat : undefined,
    assistantLng: typeof data.assistantLng === 'number' ? data.assistantLng : undefined,
    usesDateTimePicker: hasPickerTime,
    participantIds: Array.isArray(data.participantIds) ? data.participantIds : [],
    createdBy: data.createdBy || '',
    createdAt: data.createdAt || Timestamp.now(),
  };
}

/**
 * Migrasi otomatis sesi lama yang waktunya masih tercatat sebagai string manual:
 * Menghapus data waktu string lama dan menggantinya dengan waktu default (DateTimePicker).
 */
export async function migrateLegacySessionTimesToDefault(): Promise<number> {
  try {
    const snap = await getDocs(collection(db, SESSIONS_COLLECTION));
    const legacyDocs = snap.docs.filter((d) => {
      const data = d.data();
      return !data.usesDateTimePicker;
    });

    if (legacyDocs.length === 0) return 0;

    const def = getDefaultSessionSchedule();
    const batch = writeBatch(db);
    legacyDocs.forEach((d) => {
      batch.update(d.ref, {
        scheduledAt: def.scheduledAt,
        scheduledEndAt: def.scheduledEndAt,
        timeSlot: def.timeSlot,
        usesDateTimePicker: true,
        updatedAt: serverTimestamp(),
      });
    });

    await batch.commit();
    return legacyDocs.length;
  } catch (err) {
    console.warn('migrateLegacySessionTimesToDefault skipped/failed:', err);
    return 0;
  }
}

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
  sessionType?: SessionType;
}): Promise<string> {
  const resolvedType: SessionType =
    data.sessionType || (isOnlineRoom(data.roomName) ? 'ONLINE' : 'OFFLINE');
  const def = getDefaultSessionSchedule();

  const docRef = await addDoc(collection(db, SESSIONS_COLLECTION), {
    classId: data.classId,
    courseTitle: data.courseTitle.trim(),
    moduleName: data.moduleName.trim(),
    classGroup: data.classGroup.trim(),
    roomName: resolvedType === 'ONLINE' ? 'Online' : data.roomName.trim(),
    timeSlot: data.timeSlot.trim() || def.timeSlot,
    scheduledAt: data.scheduledAt || def.scheduledAt,
    scheduledEndAt: data.scheduledEndAt || def.scheduledEndAt,
    usesDateTimePicker: true,
    sessionType: resolvedType,
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
    scheduledAt?: Timestamp;
    scheduledEndAt?: Timestamp;
    sessionType?: SessionType;
  }
): Promise<void> {
  const sessionRef = doc(db, SESSIONS_COLLECTION, id);
  const snap = await getDoc(sessionRef);

  if (!snap.exists()) {
    throw new Error('Sesi tidak ditemukan.');
  }

  const currentData = snap.data();
  if (currentData.status !== 'BELUM_DIBUKA') {
    throw new Error('Sesi hanya dapat diubah jika status masih BELUM DIBUKA.');
  }

  const resolvedType = data.sessionType || (data.roomName ? (isOnlineRoom(data.roomName) ? 'ONLINE' : 'OFFLINE') : undefined);

  await updateDoc(sessionRef, {
    ...(data.moduleName ? { moduleName: data.moduleName.trim() } : {}),
    ...(data.timeSlot ? { timeSlot: data.timeSlot.trim() } : {}),
    ...(data.scheduledAt ? { scheduledAt: data.scheduledAt } : {}),
    ...(data.scheduledEndAt ? { scheduledEndAt: data.scheduledEndAt } : {}),
    ...(data.scheduledAt || data.scheduledEndAt ? { usesDateTimePicker: true } : {}),
    ...(data.courseTitle ? { courseTitle: data.courseTitle.trim() } : {}),
    ...(data.classGroup ? { classGroup: data.classGroup.trim() } : {}),
    ...(data.roomName
      ? {
          roomName:
            resolvedType === 'ONLINE' ? 'Online' : data.roomName.trim(),
        }
      : {}),
    ...(resolvedType ? { sessionType: resolvedType } : {}),
    ...(data.participantIds ? { participantIds: data.participantIds } : {}),
    updatedAt: serverTimestamp(),
  });
}

/**
 * Menghapus sesi praktikum (Hanya boleh jika status BELUM_DIBUKA)
 */
export async function deleteSession(id: string): Promise<void> {
  const sessionRef = doc(db, SESSIONS_COLLECTION, id);
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
 * Disertai validasi waktu mulai (scheduledAt), koordinat/QR token, dan push notification trigger.
 */
export async function setSessionStatus(
  id: string,
  newStatus: SessionStatus,
  options?: {
    qrToken?: string;
    assistantLat?: number;
    assistantLng?: number;
    sessionType?: SessionType;
  }
): Promise<void> {
  const sessionRef = doc(db, SESSIONS_COLLECTION, id);

  const snap = await getDoc(sessionRef);
  if (!snap.exists()) {
    throw new Error('Dokumen sesi tidak ditemukan.');
  }

  const sessionData = snap.data();

  if (newStatus === 'BERJALAN') {
    const scheduledAt = sessionData.scheduledAt as Timestamp | undefined;
    if (scheduledAt && !isSessionTimeReached(scheduledAt)) {
      const formatted = formatJakartaTime(scheduledAt);
      throw new Error(`Sesi belum dapat dibuka. Jadwal dimulai: ${formatted}`);
    }
  }

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
    if (newStatus === 'BERJALAN') {
      updates.openedAt = serverTimestamp();
      if (options?.sessionType) {
        updates.sessionType = options.sessionType;
      }
      if (options?.qrToken) {
        updates.qrToken = options.qrToken;
      }
      if (
        typeof options?.assistantLat === 'number' &&
        typeof options?.assistantLng === 'number'
      ) {
        updates.assistantLat = options.assistantLat;
        updates.assistantLng = options.assistantLng;
      }
    }
    if (newStatus === 'SELESAI') {
      updates.closedAt = serverTimestamp();
    }

    transaction.update(sessionRef, updates);
  });

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
 * Regenerate QR token untuk sesi Online yang sedang BERJALAN
 */
export async function regenerateSessionQrToken(id: string): Promise<string> {
  const newToken = generateSessionQrToken(id);
  const sessionRef = doc(db, SESSIONS_COLLECTION, id);
  await updateDoc(sessionRef, {
    qrToken: newToken,
    updatedAt: serverTimestamp(),
  });
  return newToken;
}

/**
 * Memperbarui koordinat device asprak pada sesi offline custom yang sedang berjalan
 */
export async function updateSessionAssistantLocation(
  id: string,
  assistantLat: number,
  assistantLng: number
): Promise<void> {
  const sessionRef = doc(db, SESSIONS_COLLECTION, id);
  await updateDoc(sessionRef, {
    assistantLat,
    assistantLng,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Ganti jadwal sesi praktikum
 */
export async function rescheduleSession(
  id: string,
  data: {
    scheduledAt: Timestamp;
    scheduledEndAt: Timestamp;
    timeSlot: string;
  }
): Promise<void> {
  const sessionRef = doc(db, SESSIONS_COLLECTION, id);
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
    usesDateTimePicker: true,
    updatedAt: serverTimestamp(),
  });

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
  const sessionRef = doc(db, SESSIONS_COLLECTION, id);
  return onSnapshot(
    sessionRef,
    (snap) => {
      if (!snap.exists()) {
        const mock = INITIAL_SCHEDULES.find((s) => s.id === id);
        onUpdate(mock || null);
        return;
      }
      onUpdate(mapSessionDocToItem(snap.id, snap.data()));
    },
    (err) => {
      console.error('Error listenSession:', err);
      const mock = INITIAL_SCHEDULES.find((s) => s.id === id);
      onUpdate(mock || null);
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
  const q = query(collection(db, SESSIONS_COLLECTION));
  return onSnapshot(
    q,
    (snap) => {
      if (snap.empty) {
        onUpdate(INITIAL_SCHEDULES);
        return;
      }
      const items: SessionItem[] = snap.docs.map((d) =>
        mapSessionDocToItem(d.id, d.data())
      );
      onUpdate(items);
    },
    (err) => {
      console.error('Error listenSessions, using fallback:', err);
      onUpdate(INITIAL_SCHEDULES);
      if (onError) onError(err);
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
      return mapSessionDocToItem(snap.id, snap.data());
    }
  } catch (err) {
    console.warn('getSessionById failed, falling back to mock:', err);
  }

  const mock = INITIAL_SCHEDULES.find((s) => s.id === sessionId);
  return mock || null;
}
