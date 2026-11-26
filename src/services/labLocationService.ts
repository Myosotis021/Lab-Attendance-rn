import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { LabLocation } from '../types/models';
import {
  PREDEFINED_LABS,
  DEFAULT_ATTENDANCE_RADIUS_METERS,
} from '../data/labLocations';

const LABS_COLLECTION = 'labLocations';

/**
 * Mendapatkan semua lokasi laboratorium dari Firestore (sekali fetch)
 */
export async function getAllLabLocations(): Promise<LabLocation[]> {
  const querySnapshot = await getDocs(collection(db, LABS_COLLECTION));
  return querySnapshot.docs.map((docSnap) => {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      name: data.name || '',
      building: data.building || '',
      latitude: Number(data.latitude) || 0,
      longitude: Number(data.longitude) || 0,
      radiusMeters: Number(data.radiusMeters) || DEFAULT_ATTENDANCE_RADIUS_METERS,
      description: data.description || '',
      createdBy: data.createdBy || '',
      updatedAt: data.updatedAt || null,
    };
  });
}

/**
 * Mendapatkan satu data laboratorium berdasarkan ID
 */
export async function getLabLocationById(
  labId: string
): Promise<LabLocation | null> {
  const docRef = doc(db, LABS_COLLECTION, labId);
  const snap = await getDoc(docRef);
  if (!snap.exists()) {
    return null;
  }
  const data = snap.data();
  return {
    id: snap.id,
    name: data.name || '',
    building: data.building || '',
    latitude: Number(data.latitude) || 0,
    longitude: Number(data.longitude) || 0,
    radiusMeters: Number(data.radiusMeters) || DEFAULT_ATTENDANCE_RADIUS_METERS,
    description: data.description || '',
    createdBy: data.createdBy || '',
    updatedAt: data.updatedAt || null,
  };
}

/**
 * Real-time listener untuk semua lokasi laboratorium
 */
export function listenLabLocations(
  onUpdate: (labs: LabLocation[]) => void,
  onError?: (err: any) => void
): () => void {
  const collRef = collection(db, LABS_COLLECTION);
  return onSnapshot(
    collRef,
    (snapshot) => {
      const labs: LabLocation[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          name: data.name || '',
          building: data.building || '',
          latitude: Number(data.latitude) || 0,
          longitude: Number(data.longitude) || 0,
          radiusMeters: Number(data.radiusMeters) || DEFAULT_ATTENDANCE_RADIUS_METERS,
          description: data.description || '',
          createdBy: data.createdBy || '',
          updatedAt: data.updatedAt || null,
        };
      });

      // Urutkan berdasarkan nama
      labs.sort((a, b) => a.name.localeCompare(b.name));
      onUpdate(labs);
    },
    (err) => {
      console.error('Error listenLabLocations:', err);
      onError?.(err);
    }
  );
}

/**
 * Asisten: update koordinat, radius, dan deskripsi laboratorium
 */
export async function updateLabLocation(
  labId: string,
  data: {
    latitude?: number;
    longitude?: number;
    radiusMeters?: number;
    description?: string;
    name?: string;
    building?: string;
  }
): Promise<void> {
  const labRef = doc(db, LABS_COLLECTION, labId);
  const snap = await getDoc(labRef);

  const payload: any = {
    updatedAt: serverTimestamp(),
  };

  if (typeof data.latitude === 'number') payload.latitude = data.latitude;
  if (typeof data.longitude === 'number') payload.longitude = data.longitude;
  if (typeof data.radiusMeters === 'number')
    payload.radiusMeters = data.radiusMeters;
  if (data.description !== undefined) payload.description = data.description;
  if (data.name) payload.name = data.name;
  if (data.building) payload.building = data.building;

  if (snap.exists()) {
    await updateDoc(labRef, payload);
  } else {
    // Jika belum ada dokumen, buat baru dengan data resmi jika cocok
    const seed = PREDEFINED_LABS.find((s) => s.id === labId);
    await setDoc(labRef, {
      id: labId,
      name: data.name || seed?.name || labId,
      building: data.building || seed?.building || '',
      latitude: data.latitude ?? seed?.latitude ?? 0,
      longitude: data.longitude ?? seed?.longitude ?? 0,
      radiusMeters:
        data.radiusMeters ??
        seed?.radiusMeters ??
        DEFAULT_ATTENDANCE_RADIUS_METERS,
      description: data.description ?? seed?.description ?? '',
      createdBy: 'asisten',
      updatedAt: serverTimestamp(),
    });
  }
}

/**
 * Helper: Memastikan 4 lab resmi (Lab B, Lab C, Lab D, Lab AP) tersedia & sinkron di Firestore
 * dengan koordinat resmi & radius 100m.
 */
export async function seedLabLocationsIfEmpty(): Promise<void> {
  try {
    const existing = await getAllLabLocations();
    const existingMap = new Map(existing.map((l) => [l.id, l]));
    for (const item of PREDEFINED_LABS) {
      const current = existingMap.get(item.id);
      const needsSync =
        !current ||
        current.latitude !== item.latitude ||
        current.longitude !== item.longitude ||
        current.radiusMeters !== item.radiusMeters;

      if (needsSync) {
        const labRef = doc(db, LABS_COLLECTION, item.id);
        await setDoc(labRef, {
          name: item.name,
          building: item.building,
          latitude: item.latitude,
          longitude: item.longitude,
          radiusMeters: item.radiusMeters,
          description: item.description,
          createdBy: current?.createdBy || 'system_seed',
          updatedAt: serverTimestamp(),
        });
      }
    }
  } catch (err) {
    console.warn('seedLabLocationsIfEmpty skipped or failed:', err);
  }
}
