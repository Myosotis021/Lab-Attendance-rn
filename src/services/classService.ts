import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  onSnapshot,
  writeBatch,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { ClassItem, UserProfile } from '../types/models';

export const SEED_STUDENTS: UserProfile[] = [
  {
    uid: 'mhs-220101001',
    name: 'Ahmad Fauzi',
    nim: '220101001',
    role: 'praktikan',
    email: 'ahmad@mhs.ac.id',
  },
  {
    uid: 'mhs-220101015',
    name: 'Siti Rahma',
    nim: '220101015',
    role: 'praktikan',
    email: 'siti@mhs.ac.id',
  },
  {
    uid: 'mhs-220101032',
    name: 'Dimas Pratama',
    nim: '220101032',
    role: 'praktikan',
    email: 'dimas@mhs.ac.id',
  },
  {
    uid: 'mhs-220101048',
    name: 'Putri Ayu',
    nim: '220101048',
    role: 'praktikan',
    email: 'putri@mhs.ac.id',
  },
];

/**
 * Mendapatkan daftar praktikan untuk pemilihan peserta kelas
 */
export async function getStudents(): Promise<UserProfile[]> {
  try {
    const q = query(collection(db, 'users'), where('role', '==', 'praktikan'));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      return snapshot.docs.map((d) => ({
        uid: d.id,
        ...(d.data() as Omit<UserProfile, 'uid'>),
      }));
    }
  } catch (err) {
    console.warn('Gagal memuat pengguna praktikan dari Firestore, menggunakan fallback seed:', err);
  }
  return SEED_STUDENTS;
}

/**
 * Mendengarkan daftar kelas secara real-time
 */
export function listenClasses(
  onUpdate: (classes: ClassItem[]) => void,
  onError?: (err: unknown) => void
): () => void {
  const classesCol = collection(db, 'classes');
  return onSnapshot(
    classesCol,
    (snapshot) => {
      const items = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          courseTitle: data.courseTitle || '',
          classGroup: data.classGroup || '',
          roomName: data.roomName || '',
          participantIds: Array.isArray(data.participantIds) ? data.participantIds : [],
          createdBy: data.createdBy || '',
          createdAt: data.createdAt || Timestamp.now(),
        } as ClassItem;
      });
      onUpdate(items);
    },
    (err) => {
      console.error('Error listenClasses:', err);
      onError?.(err);
    }
  );
}

/**
 * Menambah kelas baru
 */
export async function createClass(data: {
  courseTitle: string;
  classGroup: string;
  roomName: string;
  participantIds: string[];
  createdBy: string;
}): Promise<string> {
  const docRef = await addDoc(collection(db, 'classes'), {
    courseTitle: data.courseTitle.trim(),
    classGroup: data.classGroup.trim(),
    roomName: data.roomName.trim(),
    participantIds: data.participantIds,
    createdBy: data.createdBy,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

/**
 * Mengubah data kelas & menyinkronkan participantIds ke semua sesi terkait
 */
export async function updateClass(
  id: string,
  data: {
    courseTitle?: string;
    classGroup?: string;
    roomName?: string;
    participantIds?: string[];
  }
): Promise<void> {
  const classRef = doc(db, 'classes', id);

  // Jika participantIds diperbarui, sinkronkan ke semua sesi milik kelas ini dalam 1 writeBatch
  if (data.participantIds) {
    const batch = writeBatch(db);

    // 1. Update data kelas
    batch.update(classRef, {
      ...(data.courseTitle ? { courseTitle: data.courseTitle.trim() } : {}),
      ...(data.classGroup ? { classGroup: data.classGroup.trim() } : {}),
      ...(data.roomName ? { roomName: data.roomName.trim() } : {}),
      participantIds: data.participantIds,
      updatedAt: serverTimestamp(),
    });

    // 2. Query semua sesi dengan classId == id
    const sessionsQuery = query(collection(db, 'sessions'), where('classId', '==', id));
    const sessionSnap = await getDocs(sessionsQuery);
    sessionSnap.forEach((sessDoc) => {
      batch.update(sessDoc.ref, {
        participantIds: data.participantIds,
        ...(data.courseTitle ? { courseTitle: data.courseTitle.trim() } : {}),
        ...(data.classGroup ? { classGroup: data.classGroup.trim() } : {}),
        ...(data.roomName ? { roomName: data.roomName.trim() } : {}),
        updatedAt: serverTimestamp(),
      });
    });

    await batch.commit();
  } else {
    await updateDoc(classRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  }
}

/**
 * Menghapus kelas (wajib dicek apakah masih ada sesi terkait)
 */
export async function deleteClass(id: string): Promise<void> {
  // Cek apakah ada sesi terkait
  const sessionsQuery = query(collection(db, 'sessions'), where('classId', '==', id));
  const sessionSnap = await getDocs(sessionsQuery);

  if (!sessionSnap.empty) {
    throw new Error('Kelas tidak dapat dihapus karena masih memiliki sesi praktikum.');
  }

  await deleteDoc(doc(db, 'classes', id));
}
