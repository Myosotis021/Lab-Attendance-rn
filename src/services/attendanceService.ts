import {
  collection,
  doc,
  setDoc,
  getDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { AttendanceRecord } from '../types/models';

/**
 * Format timestamp Firestore menjadi teks format waktu (contoh: 13:15:30 WIB)
 */
export function formatAttendanceTime(timestamp?: Timestamp | null): string {
  if (!timestamp) return 'Baru saja';
  try {
    const date = timestamp.toDate();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${hours}:${minutes}:${seconds} WIB`;
  } catch {
    return 'Baru saja';
  }
}

/**
 * Menyimpan presensi mahasiswa praktikan
 * ID dokumen deterministik: attendance/{sessionId}_{uid} untuk mencegah presensi ganda
 */
export async function saveAttendance(params: {
  sessionId: string;
  classId: string;
  uid: string;
  studentName: string;
  studentNim: string;
  notes?: string;
}): Promise<AttendanceRecord> {
  const docId = `${params.sessionId}_${params.uid}`;
  const docRef = doc(db, 'attendance', docId);

  // Cek apakah sudah pernah presensi sebelumnya
  const existingSnap = await getDoc(docRef);
  if (existingSnap.exists()) {
    throw new Error('Anda sudah melakukan presensi pada sesi ini.');
  }

  const nowTimestamp = Timestamp.now();
  const payload = {
    sessionId: params.sessionId,
    classId: params.classId || '',
    uid: params.uid,
    studentName: params.studentName,
    studentNim: params.studentNim,
    status: 'Hadir' as const,
    notes: (params.notes || '').trim(),
    createdAt: serverTimestamp(),
  };

  await setDoc(docRef, payload);

  return {
    id: docId,
    sessionId: params.sessionId,
    classId: params.classId || '',
    uid: params.uid,
    studentName: params.studentName,
    studentNim: params.studentNim,
    status: 'Hadir',
    notes: (params.notes || '').trim(),
    createdAt: nowTimestamp,
    timestamp: formatAttendanceTime(nowTimestamp),
  };
}

/**
 * Mendengarkan data presensi satu praktikan pada sesi tertentu
 */
export function listenMyAttendanceForSession(
  sessionId: string,
  uid: string,
  onUpdate: (record: AttendanceRecord | null) => void,
  onError?: (err: unknown) => void
): () => void {
  const docId = `${sessionId}_${uid}`;
  const docRef = doc(db, 'attendance', docId);

  return onSnapshot(
    docRef,
    (snap) => {
      if (!snap.exists()) {
        onUpdate(null);
        return;
      }
      const data = snap.data();
      const createdAt = data.createdAt as Timestamp | undefined;
      onUpdate({
        id: snap.id,
        sessionId: data.sessionId,
        classId: data.classId,
        uid: data.uid,
        studentName: data.studentName,
        studentNim: data.studentNim,
        status: data.status || 'Hadir',
        notes: data.notes || '',
        createdAt: createdAt || Timestamp.now(),
        timestamp: formatAttendanceTime(createdAt),
      });
    },
    (err) => {
      console.error('Error listenMyAttendanceForSession:', err);
      onError?.(err);
    }
  );
}

/**
 * Mendengarkan semua presensi pada suatu sesi (digunakan oleh Asisten)
 * Diurutkan di sisi klien berdasarkan createdAt
 */
export function listenAttendanceBySession(
  sessionId: string,
  onUpdate: (records: AttendanceRecord[]) => void,
  onError?: (err: unknown) => void
): () => void {
  const q = query(collection(db, 'attendance'), where('sessionId', '==', sessionId));

  return onSnapshot(
    q,
    (snapshot) => {
      const records: AttendanceRecord[] = snapshot.docs.map((d) => {
        const data = d.data();
        const createdAt = data.createdAt as Timestamp | undefined;
        return {
          id: d.id,
          sessionId: data.sessionId,
          classId: data.classId,
          uid: data.uid,
          studentName: data.studentName,
          studentNim: data.studentNim,
          status: data.status || 'Hadir',
          notes: data.notes || '',
          createdAt: createdAt || Timestamp.now(),
          timestamp: formatAttendanceTime(createdAt),
        };
      });

      // Urutkan di sisi klien berdasarkan createdAt
      records.sort((a, b) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
        return timeA - timeB;
      });

      onUpdate(records);
    },
    (err) => {
      console.error('Error listenAttendanceBySession:', err);
      onError?.(err);
    }
  );
}

/**
 * Mendengarkan semua riwayat presensi milik seorang praktikan
 */
export function listenMyAttendance(
  uid: string,
  onUpdate: (records: AttendanceRecord[]) => void,
  onError?: (err: unknown) => void
): () => void {
  const q = query(collection(db, 'attendance'), where('uid', '==', uid));

  return onSnapshot(
    q,
    (snapshot) => {
      const records: AttendanceRecord[] = snapshot.docs.map((d) => {
        const data = d.data();
        const createdAt = data.createdAt as Timestamp | undefined;
        return {
          id: d.id,
          sessionId: data.sessionId,
          classId: data.classId,
          uid: data.uid,
          studentName: data.studentName,
          studentNim: data.studentNim,
          status: data.status || 'Hadir',
          notes: data.notes || '',
          createdAt: createdAt || Timestamp.now(),
          timestamp: formatAttendanceTime(createdAt),
        };
      });

      // Urutkan di sisi klien descending (terbaru di atas)
      records.sort((a, b) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
        return timeB - timeA;
      });

      onUpdate(records);
    },
    (err) => {
      console.error('Error listenMyAttendance:', err);
      onError?.(err);
    }
  );
}
