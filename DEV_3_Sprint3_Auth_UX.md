# DEV 3 — Sprint 3: Autentikasi Dual-Peran, Hamburger Menu & Perbaikan UX

> **Pengembang:** Developer 3  
> **Branch target:** `feat/sprint3-auth-ux`  
> **Base branch:** `AI_Leave` (hasil Sprint 2)  
> **Bahasa:** TypeScript + React Native (Expo SDK ~58)

---

## 1. Informasi Umum

Developer 3 bertanggung jawab atas perbaikan sistem autentikasi dan pengalaman pengguna (UX) yang mencakup:

| # | Fitur / Bug | Prioritas |
|---|---|---|
| A | Sistem dual-peran (satu akun bisa asprak & praktikan) | Tinggi |
| B | Asprak tidak bisa menambah dirinya sendiri sebagai peserta | Tinggi |
| C | Validasi NIM tepat 14 digit | Tinggi |
| D | Hamburger menu berfungsi (drawer navigasi) | Tinggi |
| E | ID presensi tidak ditampilkan ke pengguna | Sedang |
| F | Teks teknis/requirement tidak muncul di UI pengguna | Sedang |
| G | Hapus pull-to-refresh (scroll ke bawah saja) | Sedang |

---

## 2. Spesifikasi Perubahan

### 2.1 Model Data — `UserProfile` (src/types/models.ts)

Tambahkan field `roles` pada interface `UserProfile`:

```typescript
// SEBELUM
export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  nim?: string;
  role: 'asisten' | 'praktikan';
  // ...
}

// SESUDAH
export type Role = 'asisten' | 'praktikan';

export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  nim?: string;
  role: Role;              // peran aktif saat ini
  roles: Role[];           // semua peran yang dimiliki akun ini
  // ...field lainnya tidak berubah
}
```

**Firestore:** dokumen `users/{uid}` mendapat field baru:
```json
{
  "role": "praktikan",
  "roles": ["praktikan"]
}
```
Ketika pengguna menambah peran kedua, `roles` menjadi `["praktikan", "asisten"]`.

---

### 2.2 AuthContext — `src/context/AuthContext.tsx`

Tambahkan fungsi `switchRole` dan `addRole` ke `AuthContextValue`:

```typescript
export interface AuthContextValue {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  switchRole: (newRole: Role) => Promise<void>;   // BARU
  addRole: (newRole: Role) => Promise<void>;       // BARU
}
```

**Implementasi `switchRole`:**
1. Validasi: `newRole` harus ada di `profile.roles` — jika tidak ada, lempar error `'Peran tidak tersedia untuk akun ini'`.
2. Update Firestore: `users/{uid}.role = newRole`.
3. Update state lokal: `setProfile(prev => ({ ...prev!, role: newRole }))`.

**Implementasi `addRole`:**
1. Validasi: `newRole` belum ada di `profile.roles`.
2. Jika `newRole === 'praktikan'`, pastikan `profile.nim` sudah diisi — tampilkan pesan error yang sesuai jika belum.
3. Update Firestore: `users/{uid}.roles = arrayUnion(newRole)`.
4. Panggil `refreshProfile()` setelah berhasil.

**Migrasi data lama:** Saat `profile` dimuat dari Firestore dan field `roles` tidak ada, isi otomatis: `roles = [profile.role]`.

---

### 2.3 Validasi NIM — `src/utils/validators.ts`

```typescript
// SEBELUM
export function validateNim(nim: string): string | null {
  if (!/^\d{8,20}$/.test(nim)) return 'NIM harus berupa 8-20 digit angka';
  return null;
}

// SESUDAH
export function validateNim(nim: string): string | null {
  if (!/^\d{14}$/.test(nim)) return 'NIM harus berupa tepat 14 digit angka';
  return null;
}
```

Perbarui juga prop `maxLength` pada semua `TextInput` NIM:
- `src/screens/RegisterScreen.tsx` → `maxLength={14}`
- Layar lain yang memiliki input NIM → sesuaikan juga

---

### 2.4 Layar Baru — Tambah/Ganti Peran

**File baru:** `src/screens/RoleManagementScreen.tsx`

Konten layar:
1. **Peran aktif saat ini** — tampilkan badge peran aktif.
2. **Daftar peran yang dimiliki** — list semua item di `profile.roles`.
3. **Tombol Ganti Peran** — tampil jika `profile.roles.length > 1`; saat ditekan panggil `switchRole(role lain)`.
4. **Tombol Tambah Peran** — tampil jika `profile.roles.length === 1`; membuka form kecil:
   - Jika menambah `'praktikan'`: input NIM (14 digit), nama lengkap (opsional jika sudah ada).
   - Jika menambah `'asisten'`: tidak perlu input tambahan.
   - Tombol konfirmasi memanggil `addRole(newRole)`.
5. **Pesan sukses/error** menggunakan `Alert.alert` atau inline error text.

**Route:** `src/app/role-management.tsx`
```typescript
import RoleManagementScreen from '@/screens/RoleManagementScreen';
export default RoleManagementScreen;
```

Tambahkan ke `.expo/types/router.d.ts`:
```typescript
'/role-management': Record<string, unknown>;
```

---

### 2.5 Hamburger Menu — Drawer Navigasi

#### Pendekatan: Custom Modal Side Panel

Gunakan `Modal` dari React Native (tidak perlu instalasi package baru) agar kompatibel dengan Expo Go dan development build.

**File baru:** `src/components/HamburgerMenu.tsx`

```typescript
// Props
interface HamburgerMenuProps {
  visible: boolean;
  onClose: () => void;
}
```

**Item menu berdasarkan peran:**

| Item Menu | Peran | Route/Aksi |
|---|---|---|
| 🏠 Beranda | Semua | `router.push('/')` |
| 🗺️ Peta Laboratorium | Semua | `router.push('/lab-map')` |
| 📋 Daftar Izin Saya | praktikan | `router.push('/my-leave-requests')` |
| ✅ Review Izin Praktikan | asisten | `router.push('/assistant-leave-review')` |
| 👥 Kelola Kelas | asisten | `router.push('/class-management')` |
| 🔄 Ganti Peran | Semua (jika `roles.length > 1`) | `switchRole(...)` |
| ➕ Tambah Peran | Semua (jika `roles.length === 1`) | `router.push('/role-management')` |
| 🚪 Keluar | Semua | `logout()` |

**Tampilan:**
- Panel muncul dari sisi kiri dengan animasi `Animated.timing` (translateX: -300 → 0).
- Overlay gelap di belakang panel; tap overlay menutup panel.
- Header panel menampilkan nama dan email pengguna, serta badge peran aktif.

**Integrasi:** Di `src/app/_layout.tsx` atau layar utama (`ScheduleListScreen.tsx`), hubungkan tombol hamburger (ikon `☰`) dengan state `menuVisible`.

```typescript
// Contoh di header ScheduleListScreen
const [menuVisible, setMenuVisible] = useState(false);

<HamburgerMenu visible={menuVisible} onClose={() => setMenuVisible(false)} />
```

---

### 2.6 Asprak Tidak Bisa Tambah Diri Sendiri — `src/services/classService.ts`

Pada fungsi yang menambahkan peserta ke kelas (kemungkinan `addParticipant` atau `addStudentToClass`), tambahkan validasi:

```typescript
// Tambahkan parameter currentUserId
export async function addParticipantToClass(
  classId: string,
  participantUid: string,
  currentUserId: string
): Promise<void> {
  if (participantUid === currentUserId) {
    throw new Error('Anda tidak dapat menambahkan diri sendiri sebagai peserta kelas.');
  }
  // ...logika Firestore yang sudah ada
}
```

Perbarui pemanggilan fungsi ini di `src/screens/ClassManagementScreen.tsx`:
- Teruskan `profile?.uid` (dari `useAuth`) sebagai argumen `currentUserId`.
- Tangkap error dan tampilkan pesan ke pengguna menggunakan `Alert.alert`.

---

### 2.7 ID Presensi Tidak Ditampilkan — Audit Layar

Periksa dan hapus tampilan `record.id` / document ID dari komponen berikut:

| File | Yang Diperiksa |
|---|---|
| `src/screens/StudentAttendanceScreen.tsx` | Pastikan tidak ada `<Text>{record.id}</Text>` |
| `src/components/StudentHistoryCard.tsx` | Pastikan tidak ada tampilan ID dokumen |
| `src/components/AttendanceFeedbackModal.tsx` | Pastikan tidak ada tampilan ID dokumen |
| `src/screens/AssistantLeaveReviewScreen.tsx` | Pastikan tidak ada tampilan ID request |

Jika ditemukan, hapus atau ganti dengan informasi yang bermakna bagi pengguna (misal: tanggal, nama sesi).

---

### 2.8 Teks Teknis Tidak Muncul di UI

Audit semua layar untuk memastikan tidak ada teks teknis yang terlihat pengguna:

| Teks Teknis | Ganti Dengan |
|---|---|
| `BELUM_DIBUKA` | `Belum Dibuka` |
| `BERJALAN` | `Sedang Berlangsung` |
| `SELESAI` | `Selesai` |
| `SRS-XX`, `Sprint X` | Hapus dari UI |
| `asisten` (raw) | `Asisten Praktikum` |
| `praktikan` (raw) | `Praktikan` |

Buat helper di `src/utils/labelUtils.ts`:
```typescript
export function getRoleLabel(role: string): string {
  const labels: Record<string, string> = {
    asisten: 'Asisten Praktikum',
    praktikan: 'Praktikan',
  };
  return labels[role] ?? role;
}

export function getSessionStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    BELUM_DIBUKA: 'Belum Dibuka',
    BERJALAN: 'Sedang Berlangsung',
    SELESAI: 'Selesai',
  };
  return labels[status] ?? status;
}
```

---

### 2.9 Hapus Pull-to-Refresh

Di `src/screens/ScheduleListScreen.tsx`, hapus `RefreshControl` dari `FlatList` / `ScrollView`:

```typescript
// HAPUS prop ini dari FlatList:
refreshControl={
  <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
}

// HAPUS juga state dan handler:
const [refreshing, setRefreshing] = useState(false);
const onRefresh = useCallback(() => { ... }, []);
```

Data tetap diperbarui secara real-time melalui Firestore listener — tidak perlu pull-to-refresh.

---

## 3. Daftar File yang Dimodifikasi / Dibuat

### File Baru
| File | Keterangan |
|---|---|
| `src/screens/RoleManagementScreen.tsx` | Layar tambah/ganti peran |
| `src/components/HamburgerMenu.tsx` | Komponen drawer menu kiri |
| `src/app/role-management.tsx` | Route untuk RoleManagementScreen |
| `src/utils/labelUtils.ts` | Helper label UI yang ramah pengguna |

### File yang Dimodifikasi
| File | Perubahan |
|---|---|
| `src/types/models.ts` | Tambah `roles: Role[]` pada `UserProfile`, export `Role` type |
| `src/context/AuthContext.tsx` | Tambah `switchRole`, `addRole` ke context value dan implementasi |
| `src/utils/validators.ts` | Ubah `validateNim` → tepat 14 digit |
| `src/screens/RegisterScreen.tsx` | `maxLength={14}` pada input NIM |
| `src/services/classService.ts` | Tambah validasi asprak tidak bisa tambah diri sendiri |
| `src/screens/ClassManagementScreen.tsx` | Teruskan `currentUserId` ke `addParticipantToClass` |
| `src/screens/ScheduleListScreen.tsx` | Integrasi `HamburgerMenu`, hapus `RefreshControl` |
| `src/screens/StudentAttendanceScreen.tsx` | Hapus tampilan ID dokumen, gunakan `getSessionStatusLabel` |
| `src/components/StudentHistoryCard.tsx` | Hapus tampilan ID dokumen |
| `src/components/AttendanceFeedbackModal.tsx` | Hapus tampilan ID dokumen |
| `.expo/types/router.d.ts` | Tambah route `/role-management` |

---

## 4. Panduan UI

### 4.1 Hamburger Menu
```
┌─────────────────────────────┐
│  [X]  Nama Pengguna         │
│       email@example.com     │
│       [Badge: Praktikan]    │
├─────────────────────────────┤
│  🏠  Beranda                │
│  🗺️  Peta Laboratorium      │
│  📋  Daftar Izin Saya       │
│  🔄  Ganti Peran            │
│  ➕  Tambah Peran           │
├─────────────────────────────┤
│  🚪  Keluar                 │
└─────────────────────────────┘
```

### 4.2 Layar Manajemen Peran
```
┌──────────────────────────────┐
│  ← Kelola Peran Akun         │
├──────────────────────────────┤
│  Peran Aktif Saat Ini        │
│  ┌────────────────────────┐  │
│  │  🎓 Praktikan          │  │
│  └────────────────────────┘  │
│                              │
│  Peran yang Dimiliki         │
│  • Praktikan ✓               │
│  • Asisten Praktikum         │
│                              │
│  [Ganti ke Asisten]          │
│  [Tambah Peran Baru]         │
└──────────────────────────────┘
```

---

## 5. Alur Implementasi

Ikuti urutan ini agar tidak ada dependensi yang rusak:

### Tahap 1 — Fondasi (Lakukan Lebih Dulu)
1. **`src/types/models.ts`** — Tambah `Role` type dan field `roles` ke `UserProfile`.
2. **`src/utils/validators.ts`** — Perbaiki `validateNim` (14 digit).
3. **`src/utils/labelUtils.ts`** — Buat file baru helper label.

### Tahap 2 — Context & Service
4. **`src/context/AuthContext.tsx`** — Implementasi `switchRole` dan `addRole`; tambahkan migrasi `roles` jika tidak ada.
5. **`src/services/classService.ts`** — Tambah parameter `currentUserId` dan validasi.

### Tahap 3 — Komponen & Layar Baru
6. **`src/components/HamburgerMenu.tsx`** — Buat komponen drawer.
7. **`src/screens/RoleManagementScreen.tsx`** — Buat layar manajemen peran.
8. **`src/app/role-management.tsx`** — Tambah route.
9. **`.expo/types/router.d.ts`** — Daftarkan route baru.

### Tahap 4 — Integrasi & Perbaikan Layar
10. **`src/screens/RegisterScreen.tsx`** — Perbaiki `maxLength` NIM.
11. **`src/screens/ClassManagementScreen.tsx`** — Teruskan `currentUserId` ke service.
12. **`src/screens/ScheduleListScreen.tsx`** — Integrasikan `HamburgerMenu`, hapus `RefreshControl`.
13. **Audit layar presensi** — Hapus tampilan ID dokumen dari `StudentAttendanceScreen`, `StudentHistoryCard`, `AttendanceFeedbackModal`.
14. **Audit label status** — Ganti teks teknis dengan label ramah pengguna menggunakan `labelUtils`.

### Tahap 5 — Verifikasi
```bash
npx tsc --noEmit
npx eslint "src/**/*.{ts,tsx}" --quiet
```
Pastikan 0 error sebelum commit.

---

## 6. Struktur Data Firestore

### Koleksi `users/{uid}`
```json
{
  "uid": "abc123",
  "email": "user@example.com",
  "name": "Budi Santoso",
  "nim": "12345678901234",
  "role": "praktikan",
  "roles": ["praktikan"],
  "createdAt": "Timestamp"
}
```

Setelah pengguna menambah peran asisten:
```json
{
  "role": "praktikan",
  "roles": ["praktikan", "asisten"]
}
```

Setelah switch role:
```json
{
  "role": "asisten",
  "roles": ["praktikan", "asisten"]
}
```

---

## 7. Acceptance Criteria

Centang semua sebelum merge:

### A. Dual Role
- [ ] Pengguna baru hanya bisa mendaftar dengan satu peran (asprak atau praktikan).
- [ ] Pengguna yang sudah login dapat menambah peran kedua melalui "Tambah Peran".
- [ ] Jika menambah peran `praktikan`, input NIM (14 digit) diwajibkan.
- [ ] Peran aktif ditampilkan di hamburger menu dan profil.
- [ ] Tombol "Ganti Peran" hanya muncul jika akun memiliki dua peran.
- [ ] Setelah switch role, tampilan menu hamburger berubah sesuai peran aktif.
- [ ] Firestore `users/{uid}.roles` diperbarui dengan benar.

### B. Asprak Tidak Tambah Diri Sendiri
- [ ] Ketika asprak mencoba menambah NIM/UID dirinya sendiri, muncul error: *"Anda tidak dapat menambahkan diri sendiri sebagai peserta kelas."*
- [ ] Penambahan peserta lain tetap berjalan normal.

### C. Validasi NIM
- [ ] NIM kurang dari 14 digit → ditolak dengan pesan error yang jelas.
- [ ] NIM lebih dari 14 digit → ditolak dengan pesan error yang jelas.
- [ ] NIM tepat 14 digit → diterima.
- [ ] Input NIM pada `RegisterScreen` dibatasi `maxLength={14}`.

### D. Hamburger Menu
- [ ] Tombol hamburger (☰) di header membuka panel drawer dari kiri.
- [ ] Menu menampilkan nama, email, dan badge peran aktif pengguna.
- [ ] Setiap item menu menavigasi ke halaman yang benar.
- [ ] Item menu yang spesifik peran hanya tampil untuk peran yang sesuai.
- [ ] Tap di luar panel (overlay) menutup drawer.
- [ ] Tombol "Keluar" memanggil `logout()` dan mengarahkan ke halaman login.

### E. ID Presensi Tidak Tampil
- [ ] Tidak ada `<Text>` yang menampilkan document ID (string acak panjang) di semua layar presensi.

### F. Label Ramah Pengguna
- [ ] Status sesi ditampilkan sebagai "Belum Dibuka", "Sedang Berlangsung", "Selesai" — bukan kode raw.
- [ ] Peran ditampilkan sebagai "Praktikan" atau "Asisten Praktikum" — bukan kode raw.

### G. Tidak Ada Pull-to-Refresh
- [ ] `ScheduleListScreen` tidak memiliki komponen `RefreshControl`.
- [ ] Data tetap diperbarui real-time melalui Firestore listener.

---

## 8. Catatan & Batasan

> [!IMPORTANT]
> Developer 3 **tidak boleh** menyentuh file berikut yang dikerjakan developer lain:
> - `src/screens/MapScreen.tsx` (Dev 1)
> - `src/screens/AttendanceScreen.tsx` (Dev 1)
> - `src/services/labLocationService.ts` (Dev 1)
> - `src/services/notificationService.ts` (Dev 2)
> - `src/services/fcmTokenService.ts` (Dev 2)
> - `src/utils/timeUtils.ts` (Dev 2)
> - `src/components/TimeSlotPicker.tsx` (Dev 2)

> [!NOTE]
> Migrasi data lama: saat `AuthContext` memuat profil dari Firestore yang belum memiliki field `roles`, otomatis isi `roles = [profile.role]` dan **jangan** langsung write ke Firestore (hanya update di Firestore saat `addRole` atau `switchRole` dipanggil eksplisit oleh pengguna).

> [!WARNING]
> `HamburgerMenu` menggunakan hook `useAuth` untuk membaca `profile.roles` dan memanggil `switchRole`/`logout`. Pastikan komponen ini selalu dirender di dalam `AuthProvider`.

> [!TIP]
> Untuk animasi drawer, gunakan `useRef(new Animated.Value(-300))` lalu `Animated.timing` ke `0` saat `visible` berubah menjadi `true`. Ini tidak memerlukan dependensi tambahan.
