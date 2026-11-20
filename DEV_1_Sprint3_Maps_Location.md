# Panduan Tugas Pengembang (Developer 1)
## Modul: Peta Laboratorium, Lokasi & Halaman Presensi Berbasis Lokasi
**Sprint 3: Maps, Geolocation & Location-Aware Attendance (Android React Native)**

---

### 1. Informasi Fitur & Berkas

- **Penanggung Jawab:** Developer 1
- **Requirement yang Dicakup:** Kebutuhan 1, 2, 3, 4, 5, 7 (sebagian)
- **Target Branch:** `feat/sprint3-maps-location`
- **Target Platform:** Android (React Native)
- **Referensi Maps:** https://medium.com/@silverskytechnology/implementing-google-maps-and-routes-tracking-in-react-native-a-starter-guide-9768282594b8

**Bergantung pada:** `src/types/models.ts`, `src/services/firebase.ts`, `src/hooks/useAuth.ts`, `src/services/sessionService.ts`

**Berkas Baru yang Dibuat:**
- `src/types/models.ts` — tambahkan tipe `LabLocation`, `LabScheduleInfo`
- `src/services/labLocationService.ts` — CRUD lokasi laboratorium di Firestore
- `src/services/locationService.ts` — geolocation + kalkulasi radius Haversine
- `src/services/attendanceService.ts` — tambahkan parameter koordinat pada `submitAttendance`
- `src/hooks/useCurrentLocation.ts` — hook real-time posisi perangkat
- `src/hooks/useLabLocations.ts` — hook listener Firestore lokasi lab
- `src/screens/MapScreen.tsx` — halaman peta interaktif
- `src/screens/AttendanceScreen.tsx` — halaman presensi terpisah (dengan validasi lokasi)
- `src/components/LocationStatusCard.tsx` — komponen status lokasi & radius
- `src/components/LabInfoBottomSheet.tsx` — info lab saat marker dipilih
- `src/app/lab-map.tsx` — route Expo Router untuk peta
- `src/app/attendance.tsx` — route Expo Router untuk presensi

**Berkas yang Dimodifikasi:**
- `src/types/models.ts` — tambah tipe baru
- `src/app/_layout.tsx` — daftarkan rute baru
- `.expo/types/router.d.ts` — daftarkan rute baru

---

### 2. Spesifikasi Kebutuhan Fitur

#### 2.1 Ekstensi Tipe Data (`src/types/models.ts`)

Tambahkan pada `src/types/models.ts` (jangan ganti yang sudah ada):

```typescript
// Dokumen: labLocations/{labId}
export interface LabLocation {
  id: string;
  name: string;           // "Lab Komputer 1"
  building: string;       // "Gedung Informatika Lt.2"
  latitude: number;       // koordinat WGS-84
  longitude: number;
  radiusMeters: number;   // radius presensi (default 100m)
  description?: string;
  createdBy: string;
  updatedAt: any;         // Firestore Timestamp
}

// Digunakan pada MapScreen untuk info aktivitas lab
export interface LabScheduleInfo {
  labId: string;
  currentSession: SessionItem | null;   // sesi BERJALAN saat ini
  nextSession: SessionItem | null;      // sesi BELUM_DIBUKA terdekat
}

// Disimpan pada AttendanceRecord (extend existing)
export interface LocationSnapshot {
  latitude: number;
  longitude: number;
  accuracy: number | null;  // meter
  distanceToLab: number;    // jarak ke pusat lab dalam meter
  withinRadius: boolean;
}
```

> **Penting:** `LocationSnapshot` ditambahkan sebagai field opsional pada `AttendanceRecord` yang sudah ada: `locationSnapshot?: LocationSnapshot`.

---

#### 2.2 Data Seed Lokasi Laboratorium

Simpan dokumen ini ke koleksi `labLocations` di Firestore (seeding manual atau via script):

```typescript
// src/data/labLocations.ts (hanya untuk seeding / referensi)
export const LAB_LOCATIONS_SEED = [
  {
    id: 'lab-komputer-1',
    name: 'Lab Komputer 1',
    building: 'Gedung IF Lt.2',
    latitude: -6.9733,
    longitude: 107.6306,
    radiusMeters: 100,
    description: 'Lab umum mata kuliah pemrograman',
  },
  {
    id: 'lab-jaringan',
    name: 'Lab Jaringan',
    building: 'Gedung IF Lt.3',
    latitude: -6.9731,
    longitude: 107.6308,
    radiusMeters: 100,
    description: 'Lab khusus mata kuliah jaringan komputer',
  },
  {
    id: 'lab-komputer-2',
    name: 'Lab Komputer 2',
    building: 'Gedung IF Lt.2',
    latitude: -6.9735,
    longitude: 107.6304,
    radiusMeters: 100,
    description: 'Lab pendukung kelas besar',
  },
];
```

Koordinat **harus** diisi sesuai koordinat asli kampus. Gunakan koordinat di atas hanya sebagai placeholder awal, lalu asisten lab memperbaiki via fitur edit lokasi (2.3).

---

#### 2.3 Layanan Lokasi Lab (`src/services/labLocationService.ts`)

```typescript
// Fungsi yang harus diimplementasi:

// Mendapatkan semua lokasi lab (sekali fetch)
export async function getAllLabLocations(): Promise<LabLocation[]>

// Real-time listener semua lokasi lab
export function listenLabLocations(
  onUpdate: (labs: LabLocation[]) => void,
  onError: (err: any) => void
): () => void

// Asisten: update koordinat & radius lab
export async function updateLabLocation(
  labId: string,
  data: {
    latitude?: number;
    longitude?: number;
    radiusMeters?: number;
    description?: string;
  }
): Promise<void>

// Ambil satu lab by ID
export async function getLabLocationById(labId: string): Promise<LabLocation | null>
```

---

#### 2.4 Layanan Geolokasi & Kalkulasi Radius (`src/services/locationService.ts`)

```typescript
import * as Location from 'expo-location';

export interface LocationResult {
  coords: {
    latitude: number;
    longitude: number;
    accuracy: number | null;
  } | null;
  error: 'DENIED' | 'UNAVAILABLE' | 'TIMEOUT' | null;
}

// Minta izin & ambil posisi sekali
export async function getCurrentPosition(): Promise<LocationResult>

// Kalkulasi jarak Haversine (meter)
export function calculateDistance(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number

// Periksa apakah dalam radius lab
export function isWithinLabRadius(
  userLat: number, userLon: number,
  lab: LabLocation
): {
  withinRadius: boolean;
  distanceMeters: number;
}
```

**Formula Haversine:**
```typescript
export function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000; // radius bumi dalam meter
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(Δφ/2)**2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ/2)**2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}
```

---

#### 2.5 Hook Lokasi Real-time (`src/hooks/useCurrentLocation.ts`)

```typescript
// Mengembalikan posisi yang terus diperbarui
export function useCurrentLocation() {
  const [location, setLocation] = useState<LocationResult | null>(null);
  const [watching, setWatching] = useState(false);

  // start: mulai watch posisi (panggil saat halaman mount)
  // stop: cleanup listener (panggil saat unmount)
  return { location, watching, startWatching, stopWatching };
}
```

- Gunakan `Location.watchPositionAsync` dengan `accuracy: Location.Accuracy.High` dan `distanceInterval: 5` (meter).
- Hentikan watch saat komponen unmount (`useEffect` cleanup).

---

#### 2.6 Halaman Presensi Terpisah (`src/screens/AttendanceScreen.tsx`)

**Alur Utama:**
1. Praktikan memilih sesi dari daftar jadwal → navigasi ke `/attendance?sessionId=xxx`
2. Halaman menampilkan: info sesi, status sesi, tombol presensi
3. Saat tombol ditekan:
   a. Ambil posisi perangkat saat itu
   b. Ambil data lokasi lab terkait sesi (cocokkan `roomName` → lab)
   c. Hitung jarak & periksa radius
   d. **Jika lokasi tidak tersedia atau di luar radius → blokir presensi, tampilkan pesan**
   e. **Jika sesi bukan BERJALAN → blokir presensi**
   f. Jika lolos semua → panggil `submitAttendance(...)` dengan `locationSnapshot`

**UI yang harus ada:**
- Kartu informasi sesi (nama, modul, ruang, waktu)
- Badge status sesi (BELUM DIBUKA / BERJALAN / SELESAI)
- Komponen `LocationStatusCard` yang menampilkan:
  - Status izin lokasi
  - Jarak ke pusat lab (dalam meter)
  - Apakah dalam radius (✓ atau ✗)
  - Radius yang berlaku (mis. "Radius: 100 m")
- Tombol "Presensi Sekarang" (hanya aktif jika sesi BERJALAN & dalam radius)
- Jika sudah presensi: tampilkan kartu konfirmasi (tidak tampilkan ID dokumen)

**Pesan error yang harus ditangani:**

| Kondisi | Pesan |
|---|---|
| Izin ditolak | "Akses lokasi diperlukan untuk presensi. Aktifkan di pengaturan." |
| Layanan lokasi mati | "Layanan lokasi tidak aktif. Nyalakan GPS perangkat Anda." |
| Gagal mendapatkan posisi | "Lokasi belum tersedia. Pindah ke tempat dengan sinyal GPS lebih baik." |
| Di luar radius | "Anda berada X meter dari lab. Radius presensi: Y meter." |
| Sesi belum dibuka | "Sesi praktikum belum dibuka oleh asisten." |
| Sudah presensi | "Anda sudah melakukan presensi pada sesi ini." |

---

#### 2.7 Komponen Status Lokasi (`src/components/LocationStatusCard.tsx`)

```typescript
interface LocationStatusCardProps {
  labName: string;
  distanceMeters: number | null;
  radiusMeters: number;
  withinRadius: boolean | null;
  permissionStatus: 'granted' | 'denied' | 'undetermined' | 'loading';
  accuracy: number | null;
  onRefresh: () => void; // tombol untuk minta ulang lokasi
}
```

Tampilkan dengan warna:
- Hijau: dalam radius
- Merah: di luar radius
- Abu-abu: lokasi tidak tersedia / memuat

---

#### 2.8 Halaman Peta Lab (`src/screens/MapScreen.tsx`)

**Library:** Gunakan `react-native-maps` dengan Google Maps Provider.

```bash
npx expo install react-native-maps
```

**Komponen pada Peta:**
1. **Marker lokasi pengguna** — ikon berbeda (biru), diperbarui mengikuti `useCurrentLocation`
2. **Marker setiap lab** — ikon merah/oranye, dapat ditekan
3. **Circle** (opsional) — visualisasi radius presensi tiap lab
4. Saat marker lab ditekan → tampilkan `LabInfoBottomSheet`

**`LabInfoBottomSheet`** menampilkan:
- Nama & gedung lab
- **Sesi Berlangsung Sekarang:** nama praktikum, kelas, waktu, status (atau "Tidak ada sesi aktif")
- **Praktikum Berikutnya:** nama praktikum, kelas, waktu (atau "Tidak ada jadwal berikutnya")
- Tombol "Tutup"

**Cara mendapatkan `currentSession` & `nextSession`:**
- `currentSession`: sesi dengan `status === 'BERJALAN'` di room yang sama dengan lab terpilih
- `nextSession`: sesi dengan `status === 'BELUM_DIBUKA'` di room yang sama, waktu terdekat
- Ambil dari Firestore `sessions` via `listenSessions()` atau query langsung
- Cocokkan lab dengan sesi melalui field `roomName`

---

#### 2.9 Pengelolaan Lokasi Lab oleh Asisten

Tambahkan tombol "⚙ Edit Lokasi Lab" di `AssistantSessionScreen` (hanya tampil untuk asisten, bagian bawah halaman). Saat ditekan → navigasi ke `/lab-settings?labId=xxx` atau buka Modal `EditLabLocationModal`.

**EditLabLocationModal (atau screen):**
- Input: Latitude, Longitude (manual atau pilih dari peta)
- Input: Radius (dalam meter, min. 50, max. 1000)
- Input: Deskripsi lab (opsional)
- Tombol Simpan → `updateLabLocation(labId, data)`
- Validasi: latitude harus -90 sampai 90, longitude -180 sampai 180

---

### 3. Panduan Tata Letak UI

- **MapScreen:** `flex: 1`, map mengisi seluruh layar, tombol kembali di kiri atas, bottom sheet muncul dari bawah
- **AttendanceScreen:** `flex: 1`, `backgroundColor: '#F8F9FA'`, `padding: 16`
- **LocationStatusCard:**
  - Border radius 12, elevation 2
  - Row horizontal: ikon GPS + teks status + jarak
  - Warna border: hijau (#16A34A) jika dalam radius, merah (#DC2626) jika tidak

---

### 4. Alur Implementasi Fitur

1. Install `react-native-maps` dan `expo-location` via `npx expo install react-native-maps expo-location`
2. Tambahkan Google Maps API Key di `app.json`:
   ```json
   "android": {
     "config": {
       "googleMaps": { "apiKey": "MASUKKAN_API_KEY_ANDA" }
     }
   }
   ```
3. Buat `src/types/models.ts` extension (tipe baru)
4. Buat `src/services/locationService.ts` (Haversine + GPS)
5. Buat `src/services/labLocationService.ts` (Firestore CRUD)
6. Buat `src/hooks/useCurrentLocation.ts`
7. Buat `src/hooks/useLabLocations.ts`
8. Buat `src/components/LocationStatusCard.tsx`
9. Buat `src/screens/AttendanceScreen.tsx` + `src/app/attendance.tsx`
10. Buat `src/components/LabInfoBottomSheet.tsx`
11. Buat `src/screens/MapScreen.tsx` + `src/app/lab-map.tsx`
12. Modifikasi `attendanceService.ts` untuk menerima `locationSnapshot`
13. Daftarkan rute di `_layout.tsx` dan `router.d.ts`

---

### 5. Acceptance Criteria

- [ ] Halaman presensi (`/attendance`) terpisah dari halaman detail sesi
- [ ] Aplikasi meminta izin lokasi dan menjelaskan jika ditolak
- [ ] Validasi radius menggunakan formula Haversine (bukan visual saja)
- [ ] Presensi diblokir jika di luar radius (dengan pesan jarak aktual)
- [ ] Presensi diblokir jika sesi bukan `BERJALAN`
- [ ] Anti-double presensi tetap berlaku
- [ ] Peta menampilkan marker semua lab dari Firestore
- [ ] Marker posisi pengguna bergerak mengikuti pergerakan perangkat
- [ ] Memilih marker lab menampilkan `LabInfoBottomSheet`
- [ ] `LabInfoBottomSheet` menampilkan sesi berlangsung & sesi berikutnya
- [ ] Asisten dapat mengubah koordinat dan radius lab
- [ ] `LocationSnapshot` tersimpan di Firestore bersama data presensi
- [ ] ID dokumen presensi tidak pernah ditampilkan ke pengguna

---

### 6. Acuan Struktur Data Firestore

```
labLocations/{labId}
  name: string
  building: string
  latitude: number
  longitude: number
  radiusMeters: number
  description?: string
  createdBy: string
  updatedAt: Timestamp

attendance/{sessionId}_{uid}  (extend yang sudah ada)
  + locationSnapshot?: {
      latitude: number
      longitude: number
      accuracy: number | null
      distanceToLab: number
      withinRadius: boolean
    }
```
