# Panduan Tugas Pengembang (Developer 2)
## Modul: Push Notification, Validasi Waktu Sesi & Perbaikan Alur Asisten
**Sprint 3: Push Notification, Timezone & Session Time Constraints (Android React Native)**

---

### 1. Informasi Fitur & Berkas

- **Penanggung Jawab:** Developer 2
- **Requirement yang Dicakup:** Kebutuhan 6, 7 (sebagian) + perbaikan dari daftar bug
- **Target Branch:** `feat/sprint3-notification-timeslot`
- **Target Platform:** Android (React Native)
- **Referensi Push Notification:** https://medium.com/@silverskytechnology/rich-push-notifications-in-react-native-a-complete-guide-797dd9747366

**Bergantung pada:** `src/services/firebase.ts`, `src/services/sessionService.ts`, `src/services/leaveService.ts`, `src/hooks/useAuth.ts`

**Berkas Baru yang Dibuat:**
- `src/services/notificationService.ts` — setup FCM, kirim notifikasi via trigger
- `src/services/fcmTokenService.ts` — simpan & kelola FCM token pengguna di Firestore
- `src/hooks/useNotificationSetup.ts` — hook setup notifikasi di root layout
- `src/utils/timeUtils.ts` — utilitas waktu timezone Jakarta
- `src/components/TimeSlotPicker.tsx` — input jadwal sesi (tanggal + jam Jakarta)
- `src/app/session-leave-request.tsx` — rute pengajuan izin langsung dari halaman sesi

**Berkas yang Dimodifikasi:**
- `src/types/models.ts` — tambah `scheduledAt: Timestamp` pada `SessionItem`
- `src/services/sessionService.ts` — tambah validasi waktu di `setSessionStatus`
- `src/screens/AssistantSessionScreen.tsx` — tambah tombol Ajukan Izin
- `src/screens/SessionManagementScreen.tsx` — gunakan `TimeSlotPicker` baru
- `src/app/_layout.tsx` — setup notifikasi & rute baru
- `.expo/types/router.d.ts` — daftarkan rute baru

---

### 2. Spesifikasi Kebutuhan Fitur

#### 2.1 Ekstensi Tipe Data — Waktu Sesi Terstruktur

Modifikasi `SessionItem` di `src/types/models.ts`:

```typescript
export interface SessionItem {
  id: string;
  classId: string;
  courseTitle: string;
  moduleName: string;
  classGroup: string;
  roomName: string;
  timeSlot: string;       // tetap ada sebagai label tampilan, mis. "Jumat, 13:00 - 15:30 WIB"
  scheduledAt: Timestamp; // BARU: waktu mulai sesi sebagai Timestamp Firestore (timezone Jakarta)
  scheduledEndAt: Timestamp; // BARU: waktu selesai sesi
  status: SessionStatus;
  participantIds: string[];
  createdBy: string;
  createdAt: Timestamp;
}
```

> **Catatan Migrasi:** `timeSlot` tetap dipertahankan sebagai label string tampilan. `scheduledAt` adalah waktu terstruktur yang digunakan untuk validasi logika. Sesi yang dibuat sebelum Sprint 3 tetap berjalan (field baru bersifat opsional secara runtime, validasi hanya berlaku untuk sesi baru dan saat `setSessionStatus` dipanggil).

---

#### 2.2 Utilitas Waktu Jakarta (`src/utils/timeUtils.ts`)

```typescript
// Zona waktu Jakarta
export const JAKARTA_TZ = 'Asia/Jakarta';

/**
 * Konversi Firestore Timestamp ke Date di zona Jakarta
 */
export function toJakartaDate(ts: Timestamp | Date | null): Date | null

/**
 * Format timestamp menjadi string tampilan waktu Jakarta
 * Contoh: "Jumat, 13 Nov 2026, 13:00 WIB"
 */
export function formatJakartaTime(ts: Timestamp | Date | null): string

/**
 * Format label timeSlot untuk tampilan singkat
 * Contoh: "13:00 - 15:30 WIB"
 */
export function formatTimeSlotLabel(start: Timestamp, end: Timestamp): string

/**
 * Periksa apakah waktu sekarang sudah melewati atau sama dengan waktu mulai sesi
 * (dengan toleransi 5 menit)
 */
export function isSessionTimeReached(scheduledAt: Timestamp): boolean

/**
 * Parse string "HH:MM" dan tanggal Date menjadi Timestamp Jakarta
 */
export function buildTimestamp(date: Date, timeStr: string): Timestamp
```

**Implementasi `isSessionTimeReached`:**
```typescript
export function isSessionTimeReached(scheduledAt: Timestamp): boolean {
  const now = new Date();
  const sessionTime = scheduledAt.toDate();
  const diffMs = now.getTime() - sessionTime.getTime();
  return diffMs >= -5 * 60 * 1000; // boleh dibuka 5 menit sebelum jadwal
}
```

---

#### 2.3 Validasi Waktu di `setSessionStatus`

Modifikasi `src/services/sessionService.ts` — fungsi `setSessionStatus`:

```typescript
export async function setSessionStatus(id: string, newStatus: SessionStatus): Promise<void> {
  // ... (kode existing)
  
  // TAMBAHAN: validasi waktu saat membuka sesi
  if (newStatus === 'BERJALAN') {
    const scheduledAt = sessionDoc.data().scheduledAt as Timestamp | undefined;
    if (scheduledAt && !isSessionTimeReached(scheduledAt)) {
      const formatted = formatJakartaTime(scheduledAt);
      throw new Error(`Sesi belum dapat dibuka. Jadwal dimulai: ${formatted}`);
    }
  }
  
  // ... (lanjut update)
}
```

> **Penting:** Jika `scheduledAt` tidak ada (sesi lama), lewati validasi waktu (backward compatible).

---

#### 2.4 Komponen Pemilih Waktu Sesi (`src/components/TimeSlotPicker.tsx`)

Digunakan di `SessionFormModal` / `SessionManagementScreen` saat membuat atau mengedit sesi.

```typescript
interface TimeSlotPickerProps {
  value: { date: Date; startTime: string; endTime: string } | null;
  onChange: (value: { date: Date; startTime: string; endTime: string }) => void;
  disabled?: boolean;
}
```

**Tampilan:**
1. Tombol pilih tanggal → `DateTimePicker` (dari `@react-native-community/datetimepicker`)
2. Input jam mulai (format HH:MM, keyboard numerik)
3. Input jam selesai (format HH:MM)
4. Preview: *"Jumat, 13 Nov 2026, 13:00 – 15:30 WIB"*

**Validasi:**
- Tanggal tidak boleh di masa lalu (hari ini atau setelahnya)
- Jam mulai < jam selesai
- Durasi minimal 30 menit, maksimal 8 jam

```bash
npx expo install @react-native-community/datetimepicker
```

---

#### 2.5 Mekanisme Ganti Jadwal Sesi

Sesi **hanya dapat diubah jadwalnya** selama status `BELUM_DIBUKA`.

Tambahkan fungsi `rescheduleSession` di `src/services/sessionService.ts`:

```typescript
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
  
  if (!snap.exists()) throw new Error('Sesi tidak ditemukan.');
  if (snap.data().status !== 'BELUM_DIBUKA') {
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
  
  // Trigger notifikasi perubahan jadwal (panggil notificationService)
  // Lihat bagian 2.8
}
```

---

#### 2.6 Setup Push Notification (`src/services/notificationService.ts`)

Gunakan **Expo Notifications** (untuk development build) dikombinasikan dengan **Firebase Cloud Messaging** untuk production:

```bash
npx expo install expo-notifications expo-device
```

**Struktur layanan:**
```typescript
// Setup awal (dipanggil saat app launch)
export async function setupNotifications(): Promise<void>

// Dapatkan & simpan FCM/Expo push token
export async function registerForPushNotifications(uid: string): Promise<string | null>

// Kirim notifikasi lokal (untuk testing dev)
export async function sendLocalNotification(
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<void>

// Kirim notifikasi ke user tertentu via Expo Push API
export async function sendPushToUser(
  recipientUid: string,
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<void>

// Kirim notifikasi ke banyak user
export async function sendPushToUsers(
  recipientUids: string[],
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<void>
```

---

#### 2.7 Penyimpanan FCM Token (`src/services/fcmTokenService.ts`)

```typescript
// Simpan push token pengguna ke Firestore
// Dokumen: fcmTokens/{uid}
export async function saveFcmToken(uid: string, token: string): Promise<void>

// Ambil token pengguna
export async function getFcmToken(uid: string): Promise<string | null>

// Ambil token dari banyak pengguna
export async function getFcmTokensForUsers(uids: string[]): Promise<string[]>
```

```
// Firestore: fcmTokens/{uid}
{
  uid: string;
  token: string;        // Expo Push Token atau FCM token
  platform: 'android' | 'ios';
  updatedAt: Timestamp;
}
```

---

#### 2.8 Hook Setup Notifikasi (`src/hooks/useNotificationSetup.ts`)

```typescript
// Dipanggil di src/app/_layout.tsx saat user sudah login
export function useNotificationSetup() {
  // 1. Minta izin notifikasi
  // 2. Dapatkan push token
  // 3. Simpan token ke Firestore (saveFcmToken)
  // 4. Set up handler notifikasi saat app di foreground
  // 5. Handle navigasi saat notifikasi ditekan (deep link)
}
```

Izin ditolak → tampilkan banner kecil (bukan alert): *"Aktifkan notifikasi untuk mendapatkan pemberitahuan sesi dan izin."*

---

#### 2.9 Trigger Notifikasi

Notifikasi dikirim dari **sisi klien** saat event terjadi (bukan Cloud Functions). Integrasikan di service yang sesuai:

| Event | Trigger di | Penerima | Pesan |
|---|---|---|---|
| Asisten buka sesi | `setSessionStatus` → `BERJALAN` | Semua `participantIds` sesi | *"[Nama Praktikum] telah dibuka! Segera lakukan presensi."* |
| Asisten tutup sesi | `setSessionStatus` → `SELESAI` | Semua `participantIds` sesi | *"Sesi [Nama Praktikum] telah ditutup."* |
| Jadwal sesi diubah | `rescheduleSession` | Semua `participantIds` sesi | *"Jadwal [Nama Praktikum] diubah ke [waktu baru]."* |
| Izin diterima | `decideLeaveRequest` → `DITERIMA` | UID praktikan pengaju | *"Pengajuan izin Anda untuk [Nama Praktikum] diterima oleh asisten."* |
| Izin ditolak | `decideLeaveRequest` → `DITOLAK` | UID praktikan pengaju | *"Pengajuan izin Anda untuk [Nama Praktikum] ditolak. Lihat catatan asisten."* |

**Implementasi trigger di `sessionService.ts`:**
```typescript
// Setelah update status ke BERJALAN:
const participantIds = sessionDoc.data().participantIds as string[];
await sendPushToUsers(
  participantIds,
  `Sesi ${sessionDoc.data().courseTitle} Dibuka!`,
  `Segera lakukan presensi sebelum sesi berakhir.`,
  { type: 'SESSION_OPENED', sessionId: id }
);
```

---

#### 2.10 Izin Langsung dari Halaman Sesi

Tambahkan tombol **"Ajukan Izin"** di `AssistantSessionScreen.tsx` dan layar detail sesi praktikan.

**Hanya tampil:** saat sesi `BELUM_DIBUKA` dan pengguna adalah `praktikan`.

**Alur:**
- Tombol ditekan → navigasi ke `/leave-request-form?sessionId=xxx&courseTitle=...&moduleName=...`
- Di `LeaveRequestFormScreen`, jika ada `sessionId` di params → pre-select sesi tersebut (jangan tampilkan pilihan sesi lain, langsung ke form alasan)

Rute baru tidak diperlukan — cukup modifikasi `LeaveRequestFormScreen` untuk menerima params sesi yang sudah dipilih.

---

#### 2.11 Perbaikan Tampilan Waktu (Timezone Jakarta)

Ganti semua tampilan string waktu di seluruh komponen agar menggunakan `formatJakartaTime` dari `src/utils/timeUtils.ts`.

File yang perlu diperbarui:
- `src/components/AttendanceRecapList.tsx` — kolom waktu kedatangan
- `src/screens/AssistantSessionScreen.tsx` — info waktu sesi
- `src/components/LeaveRequestCard.tsx` — waktu pengajuan & keputusan
- `src/components/StudentHistoryCard.tsx` — waktu presensi

**Pola:**
```typescript
// SEBELUM (salah):
<Text>{record.timestamp}</Text>  // string mentah

// SESUDAH (benar):
import { formatJakartaTime } from '../utils/timeUtils';
<Text>{formatJakartaTime(record.createdAt)}</Text>
```

---

#### 2.12 Perbaikan UI Minor

**Scroll tanpa RefreshControl** (tidak ada pull-to-refresh):
- Hapus semua `RefreshControl` dari `FlatList` / `ScrollView` yang ada
- Gunakan `onEndReached` untuk memuat lebih jika diperlukan, atau cukup real-time listener Firestore

**Filter sesi di atas daftar (bukan di bawah header):**
- Di `ScheduleListScreen`, pindahkan baris filter tab (SEMUA, BERJALAN, BELUM_DIBUKA, SELESAI) agar muncul langsung di bawah `RoleSwitcher` / `UserHeader`, sebelum `FlatList`
- Filter sudah ada di kode, cukup pindahkan posisi rendernya

---

### 3. Panduan Tata Letak UI

- **TimeSlotPicker:** kartu putih, border radius 12, dua kolom (jam mulai | jam selesai), preview di bawah
- **Banner Notifikasi (tolak izin):** latar kuning muda `#FFFBEB`, teks oranye, ikon lonceng, margin 8px, border radius 8
- **Tombol Ajukan Izin:** border teal `#0D9488`, teks teal, ikon surat, ukuran sekunder (tidak se-prominent tombol buka/tutup sesi)

---

### 4. Alur Implementasi Fitur

1. Install `expo-notifications`, `expo-device`, `@react-native-community/datetimepicker`
2. Tambah field `scheduledAt` & `scheduledEndAt` di `models.ts`
3. Buat `src/utils/timeUtils.ts` (timezone utils)
4. Buat `src/components/TimeSlotPicker.tsx`
5. Modifikasi `SessionFormModal` untuk pakai `TimeSlotPicker`
6. Tambah `rescheduleSession` di `sessionService.ts`
7. Modifikasi `setSessionStatus` untuk validasi waktu
8. Buat `src/services/fcmTokenService.ts`
9. Buat `src/services/notificationService.ts`
10. Buat `src/hooks/useNotificationSetup.ts`
11. Pasang `useNotificationSetup()` di `_layout.tsx`
12. Integrasikan trigger notifikasi di `sessionService.ts` dan `leaveService.ts`
13. Tambah tombol Ajukan Izin di `AssistantSessionScreen.tsx` (sisi praktikan)
14. Perbaiki tampilan waktu di semua komponen terkait
15. Pindahkan filter tab ke posisi yang benar di `ScheduleListScreen`
16. Hapus `RefreshControl` dari daftar sesi

---

### 5. Acceptance Criteria

- [ ] Sesi tidak dapat dibuka sebelum waktu yang dijadwalkan (`scheduledAt`)
- [ ] Pesan error yang jelas muncul jika asisten mencoba buka sesi lebih awal
- [ ] Waktu di seluruh UI menampilkan timezone WIB (Jakarta) dengan benar
- [ ] `TimeSlotPicker` berfungsi dan menghasilkan `Timestamp` yang benar
- [ ] Jadwal sesi dapat diubah selama `BELUM_DIBUKA` dengan validasi yang tepat
- [ ] Push notification diterima saat sesi dibuka (oleh semua praktikan terdaftar)
- [ ] Push notification diterima saat jadwal sesi diubah
- [ ] Push notification diterima saat izin diterima/ditolak
- [ ] Izin notifikasi diminta sekali dan kondisi tolak ditangani dengan banner
- [ ] Tombol Ajukan Izin muncul di halaman sesi (hanya untuk praktikan, sesi BELUM_DIBUKA)
- [ ] Filter sesi muncul di atas daftar jadwal
- [ ] Daftar sesi tidak memiliki pull-to-refresh

---

### 6. Acuan Struktur Data Firestore

```
// MODIFIKASI sessions/{sessionId}
{
  ...field lama...
  scheduledAt: Timestamp,     // BARU: waktu mulai terstruktur (Jakarta)
  scheduledEndAt: Timestamp,  // BARU: waktu selesai terstruktur
}

// BARU: fcmTokens/{uid}
{
  uid: string,
  token: string,
  platform: 'android',
  updatedAt: Timestamp,
}
```
