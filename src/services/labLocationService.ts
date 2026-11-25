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
import { LAB_LOCATIONS_SEED } from '../data/labLocations';

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
      radiusMeters: Number(data.radiusMeters) || 100,
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
    radiusMeters: Number(data.radiusMeters) || 100,
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
          radiusMeters: Number(data.radiusMeters) || 100,
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
    // Jika belum ada dokumen, buat baru dengan seed awal jika cocok
    const seed = LAB_LOCATIONS_SEED.find((s) => s.id === labId);
    await setDoc(labRef, {
      id: labId,
      name: data.name || seed?.name || labId,
      building: data.building || seed?.building || '',
      latitude: data.latitude ?? seed?.latitude ?? 0,
      longitude: data.longitude ?? seed?.longitude ?? 0,
      radiusMeters: data.radiusMeters ?? seed?.radiusMeters ?? 100,
      description: data.description ?? seed?.description ?? '',
      createdBy: 'asisten',
      updatedAt: serverTimestamp(),
    });
  }
}

/**
 * Helper: Mengisi data awal laboratorium jika koleksi di Firestore masih kosong
 */
export async function seedLabLocationsIfEmpty(): Promise<void> {
  try {
    const existing = await getAllLabLocations();
    if (existing.length === 0) {
      for (const item of LAB_LOCATIONS_SEED) {
        const labRef = doc(db, LABS_COLLECTION, item.id);
        await setDoc(labRef, {
          name: item.name,
          building: item.building,
          latitude: item.latitude,
          longitude: item.longitude,
          radiusMeters: item.radiusMeters,
          description: item.description,
          createdBy: 'system_seed',
          updatedAt: serverTimestamp(),
        });
      }
    }
  } catch (err) {
    console.warn('seedLabLocationsIfEmpty skipped or failed:', err);
  }
}
