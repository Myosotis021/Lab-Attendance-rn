# Sprint 3 — Pembagian Tugas Pengembang

> **Proyek:** Lab Attendance React Native  
> **Sprint:** 3 — Maps, Lokasi, Push Notification, Perbaikan UX  
> **Branch Base:** `AI_Leave` (hasil Sprint 2)

---

## Ringkasan Pembagian

| Pengembang | NIM | Branch | Panduan |
|---|---|---|---|
| **Amelia Aristianti** | 24060124120008 | `feat/sprint3-maps-location` | `DEV_1_Sprint3_Maps_Location.md` |
| **Rizky Saefirdaus** | 24060124120001 | `feat/sprint3-notification-time` | `DEV_2_Sprint3_Notification_Time.md` |
| **Ridho Tri Saputra** | 24060124130122 | `feat/sprint3-auth-ux` | `DEV_3_Sprint3_Auth_UX.md` |

---

## Amelia Aristianti — 24060124120008
**Branch:** `feat/sprint3-maps-location`  
**Panduan lengkap:** [`DEV_1_Sprint3_Maps_Location.md`](./DEV_1_Sprint3_Maps_Location.md)

### Fitur & SRS yang Dikerjakan

| ID | Kebutuhan Sprint 3 | Keterangan |
|---|---|---|
| S3-01 | **Halaman Presensi Terpisah** | Halaman khusus presensi terpisah dari halaman detail sesi; praktikan melihat info sesi, status, dan tombol presensi |
| S3-02 | **Validasi Lokasi Presensi** | Gunakan GPS perangkat untuk memeriksa apakah praktikan berada dalam radius yang ditentukan; presensi ditolak jika di luar radius |
| S3-03 | **Pengelolaan Lokasi Laboratorium** | Asisten dapat mengatur koordinat dan radius laboratorium; data disimpan di Firestore koleksi `labLocations` |
| S3-04 | **Peta Laboratorium Interaktif** | Halaman Maps dengan marker semua laboratorium Informatika + marker lokasi pengguna yang diperbarui real-time |
| S3-05 | **Informasi Aktivitas Laboratorium** | Tiap marker lab menampilkan praktikum yang sedang berjalan dan berikutnya (nama, kelas, waktu, status sesi) |
| S3-07a | **Izin Lokasi & Kondisi Perangkat** | Minta izin `ACCESS_FINE_LOCATION`; tangani penolakan izin, GPS mati, lokasi belum tersedia |

### File yang Dibuat / Dimodifikasi

**Dibuat:**
- `src/services/labLocationService.ts` — CRUD lokasi lab di Firestore
- `src/services/locationService.ts` — wrapper geolocation (get + watch position)
- `src/hooks/useCurrentLocation.ts` — hook lokasi pengguna real-time
- `src/hooks/useLabLocations.ts` — hook listener koleksi `labLocations`
- `src/screens/MapScreen.tsx` — halaman peta interaktif
- `src/screens/AttendanceScreen.tsx` — halaman presensi berbasis lokasi
- `src/components/LocationStatusCard.tsx` — tampilan status lokasi & radius
- `src/components/LabInfoBottomSheet.tsx` — panel info lab saat marker dipilih
- `src/app/lab-map.tsx` — route untuk MapScreen
- `src/app/attendance.tsx` — route untuk AttendanceScreen

**Dimodifikasi:**
- `src/types/models.ts` — tambah interface `LabLocation`, `LabScheduleInfo`, `LocationSnapshot`
- `src/screens/SessionDetailScreen.tsx` — tambah tombol navigasi ke `AttendanceScreen`
- `.expo/types/router.d.ts` — daftarkan route `/lab-map` dan `/attendance`

### Dependensi yang Perlu Diinstal
```bash
npx expo install expo-location react-native-maps
```

---

## Rizky Saefirdaus — 24060124120001
**Branch:** `feat/sprint3-notification-time`  
**Panduan lengkap:** [`DEV_2_Sprint3_Notification_Time.md`](./DEV_2_Sprint3_Notification_Time.md)

### Fitur & SRS yang Dikerjakan

| ID | Kebutuhan Sprint 3 | Keterangan |
|---|---|---|
| S3-06 | **Push Notification (FCM)** | Kirim notifikasi saat: sesi dibuka (ke praktikan kelas tsb), jadwal berubah (ke praktikan kelas tsb), izin diterima/ditolak (ke praktikan pengaju) |
| S3-07b | **Izin Notifikasi** | Minta izin notifikasi saat startup; tangani penolakan; tampilkan info jika notifikasi tidak aktif |
| BUG-01 | **Timezone Jakarta (WIB)** | Semua tampilan waktu menggunakan zona waktu Asia/Jakarta (UTC+7); `scheduledAt: Timestamp` menggantikan `timeSlot: string` |
| BUG-02 | **Constraint Waktu Buka Sesi** | Sesi hanya bisa dibuka (`status = BERJALAN`) pada tanggal dan jam yang sesuai `scheduledAt`; bukan kapan saja |
| BUG-03 | **Mekanisme Ganti Jadwal Sesi** | Asisten dapat mengubah jadwal sesi; perubahan memicu notifikasi ke peserta kelas |
| BUG-04 | **Komponen TimeSlotPicker** | Picker tanggal & waktu berbasis WIB untuk input jadwal sesi |
| BUG-05 | **Filter Sesi di Atas Jadwal** | Pindahkan filter tab (Semua / Berjalan / Belum Dibuka / Selesai) ke atas daftar, bukan di bawah header |
| BUG-06 | **Ajukan Izin dari Halaman Sesi** | Tambahkan tombol "Ajukan Izin" langsung di halaman detail sesi ketika sesi sedang berjalan |

### File yang Dibuat / Dimodifikasi

**Dibuat:**
- `src/services/notificationService.ts` — kirim FCM via Cloud Functions / REST API
- `src/services/fcmTokenService.ts` — simpan & ambil token FCM di Firestore (`fcmTokens/{uid}`)
- `src/hooks/useNotificationSetup.ts` — setup token dan izin notifikasi saat login
- `src/utils/timeUtils.ts` — helper format waktu WIB (`formatWIB`, `toWIBDate`, `isSessionTime`)
- `src/components/TimeSlotPicker.tsx` — komponen picker jadwal berbasis WIB

**Dimodifikasi:**
- `src/types/models.ts` — tambah `scheduledAt: Timestamp` pada `SessionItem`
- `src/services/sessionService.ts` — validasi `isSessionTime()` di `setSessionStatus`; fungsi `rescheduleSession`
- `src/screens/AssistantSessionScreen.tsx` — integrasi `TimeSlotPicker` untuk buat/edit sesi
- `src/screens/SessionDetailScreen.tsx` — tampilkan waktu WIB; tambah tombol "Ajukan Izin"
- `src/screens/ScheduleListScreen.tsx` — pindahkan filter tab ke atas; hapus pull-to-refresh (koordinasi Dev 3)
- `src/app/_layout.tsx` — integrasikan `useNotificationSetup`

### Dependensi yang Perlu Diinstal
```bash
npx expo install expo-notifications @react-native-firebase/messaging
```

---

## Ridho Tri Saputra — 24060124130122
**Branch:** `feat/sprint3-auth-ux`  
**Panduan lengkap:** [`DEV_3_Sprint3_Auth_UX.md`](./DEV_3_Sprint3_Auth_UX.md)

### Fitur & SRS yang Dikerjakan

| ID | Kebutuhan Sprint 3 | Keterangan |
|---|---|---|
| BUG-07 | **Hamburger Menu Berfungsi** | Drawer navigasi kiri dengan item menu sesuai peran (Beranda, Peta, Izin, Kelola Kelas, Ganti Peran, Logout) |
| BUG-08 | **Dual Role (Asprak & Praktikan)** | Satu akun email bisa memiliki dua peran; bisa ganti peran aktif dari menu; Firestore `users/{uid}.roles: Role[]` |
| BUG-09 | **Asprak Tidak Tambah Diri Sendiri** | Validasi di `classService.ts`: asprak tidak bisa menambahkan UID-nya sendiri sebagai peserta kelas |
| BUG-10 | **NIM Tepat 14 Digit** | Ubah regex validasi NIM dari `8-20 digit` menjadi tepat `14 digit`; `maxLength={14}` pada input |
| BUG-11 | **ID Presensi Tidak Ditampilkan** | Hapus tampilan document ID Firestore dari semua layar presensi dan kartu riwayat |
| BUG-12 | **Label UI Ramah Pengguna** | Ganti status teknis (`BELUM_DIBUKA`, `BERJALAN`) dan kode peran (`asisten`, `praktikan`) dengan teks yang mudah dibaca |
| BUG-13 | **Hapus Pull-to-Refresh** | Hapus `RefreshControl` dari `ScheduleListScreen`; data real-time sudah cukup via Firestore listener |

### File yang Dibuat / Dimodifikasi

**Dibuat:**
- `src/screens/RoleManagementScreen.tsx` — layar tambah/ganti peran akun
- `src/components/HamburgerMenu.tsx` — komponen drawer menu (Modal + Animated, tanpa package baru)
- `src/app/role-management.tsx` — route untuk RoleManagementScreen
- `src/utils/labelUtils.ts` — helper `getRoleLabel()` dan `getSessionStatusLabel()`

**Dimodifikasi:**
- `src/types/models.ts` — tambah `roles: Role[]` pada `UserProfile`; export type `Role`
- `src/context/AuthContext.tsx` — tambah `switchRole()` dan `addRole()` ke context
- `src/utils/validators.ts` — `validateNim` → regex tepat 14 digit
- `src/screens/RegisterScreen.tsx` — `maxLength={14}` pada input NIM
- `src/services/classService.ts` — validasi asprak tidak bisa tambah diri sendiri
- `src/screens/ClassManagementScreen.tsx` — teruskan `currentUserId` ke service
- `src/screens/ScheduleListScreen.tsx` — integrasi `HamburgerMenu`; hapus `RefreshControl`
- `src/screens/StudentAttendanceScreen.tsx` — hapus tampilan ID; gunakan `labelUtils`
- `src/components/StudentHistoryCard.tsx` — hapus tampilan ID dokumen
- `src/components/AttendanceFeedbackModal.tsx` — hapus tampilan ID dokumen
- `.expo/types/router.d.ts` — daftarkan route `/role-management`

---

## Koordinasi Antar Pengembang

### Dependensi Bersama
Beberapa file disentuh lebih dari satu pengembang. **Gunakan Git merge** dan komunikasikan perubahan berikut:

| File | Dev 1 | Dev 2 | Dev 3 |
|---|:---:|:---:|:---:|
| `src/types/models.ts` | ✏️ tambah `LabLocation` dll | ✏️ tambah `scheduledAt` | ✏️ tambah `roles` |
| `src/screens/ScheduleListScreen.tsx` | — | ✏️ pindahkan filter | ✏️ integrasi hamburger |
| `.expo/types/router.d.ts` | ✏️ tambah 2 route | — | ✏️ tambah 1 route |
| `src/app/_layout.tsx` | ✏️ tambah route baru | ✏️ setup notifikasi | — |

> **Rekomendasi urutan merge:** Dev 3 → Dev 2 → Dev 1 (Dev 3 paling banyak menyentuh fondasi)

### Cara Memulai

```bash
# Ambil branch base
git fetch origin AI_Leave
git checkout -b feat/sprint3-<nama-fitur> origin/AI_Leave

# Install dependensi (sesuai bagian masing-masing)
npx expo install <packages>

# Selesai? Typecheck & lint dulu sebelum push
npx tsc --noEmit
npx eslint "src/**/*.{ts,tsx}" --quiet

# Push & buat Pull Request ke branch AI_Leave
git push origin feat/sprint3-<nama-fitur>
```

---

## Checklist Final (sebelum demo)

- [ ] **Dev 1 (Amelia):** Peta tampil dengan marker lab + marker pengguna; presensi berbasis lokasi berjalan; informasi aktivitas lab muncul di marker
- [ ] **Dev 2 (Rizky):** Notifikasi terkirim saat sesi dibuka, jadwal berubah, izin diputuskan; waktu tampil WIB; sesi hanya bisa dibuka sesuai jadwal
- [ ] **Dev 3 (Ridho):** Hamburger menu berfungsi; dual role bisa ditambah dan diganti; NIM 14 digit diwajibkan; asprak tidak bisa tambah diri sendiri
- [ ] **Semua:** `npx tsc --noEmit` → 0 error; `npx eslint` → 0 error
