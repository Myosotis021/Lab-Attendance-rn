import * as Location from 'expo-location';
import { LabLocation } from '../types/models';

export interface LocationCoords {
  latitude: number;
  longitude: number;
  accuracy: number | null;
}

export interface LocationResult {
  coords: LocationCoords | null;
  error: 'DENIED' | 'UNAVAILABLE' | 'TIMEOUT' | null;
  errorMessage?: string;
}

/**
 * Formula Haversine: menghitung jarak antara 2 koordinat (WGS-84) dalam satuan meter
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Radius bumi dalam meter
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) ** 2 +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Memeriksa apakah koordinat pengguna berada dalam radius laboratorium
 */
export function isWithinLabRadius(
  userLat: number,
  userLon: number,
  lab: LabLocation
): {
  withinRadius: boolean;
  distanceMeters: number;
} {
  const distance = calculateDistance(
    userLat,
    userLon,
    lab.latitude,
    lab.longitude
  );
  const distanceMeters = Math.round(distance);
  const withinRadius = distanceMeters <= lab.radiusMeters;
  return {
    withinRadius,
    distanceMeters,
  };
}

/**
 * Meminta izin lokasi dan mengambil posisi perangkat saat ini (sekali panggil)
 */
export async function getCurrentPosition(): Promise<LocationResult> {
  try {
    // 1. Periksa dan minta izin lokasi foreground
    const permission = await Location.requestForegroundPermissionsAsync();
    if (permission.status !== 'granted') {
      return {
        coords: null,
        error: 'DENIED',
        errorMessage:
          'Akses lokasi diperlukan untuk presensi. Aktifkan di pengaturan.',
      };
    }

    // 2. Periksa apakah GPS / layanan lokasi perangkat aktif
    const servicesEnabled = await Location.hasServicesEnabledAsync();
    if (!servicesEnabled) {
      return {
        coords: null,
        error: 'UNAVAILABLE',
        errorMessage:
          'Layanan lokasi tidak aktif. Nyalakan GPS perangkat Anda.',
      };
    }

    // 3. Ambil posisi dengan akurasi tinggi
    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });

    return {
      coords: {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy ?? null,
      },
      error: null,
    };
  } catch (err: any) {
    const message = err?.message || '';
    if (message.toLowerCase().includes('timeout')) {
      return {
        coords: null,
        error: 'TIMEOUT',
        errorMessage:
          'Lokasi belum tersedia. Pindah ke tempat dengan sinyal GPS lebih baik.',
      };
    }

    return {
      coords: null,
      error: 'UNAVAILABLE',
      errorMessage:
        'Lokasi belum tersedia. Pindah ke tempat dengan sinyal GPS lebih baik.',
    };
  }
}
