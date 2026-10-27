# Panduan Tugas Pengembang (Developer 2)
## Modul: Pengelolaan Sesi Asisten & Rekap Kehadiran
**Sprint 1: Antarmuka dan Alur Praktikum (Android React Native)**

---

### 1. Informasi Fitur & Berkas
- **Penanggung Jawab:** Developer 2
- **Nama Fitur:** Assistant Session Management & Recap List
- **Target Branch:** `feat/sprint1-assistant-management`
- **Target Platform:** Android (React Native)
- **Berkas yang Dibuat/Dikelola:**
  - `src/screens/AssistantSessionScreen.tsx` (Layar kelola sesi dan rekap untuk asisten)
  - `src/components/ConfirmModal.tsx` (Komponen modal konfirmasi aksi buka/tutup sesi)
  - `src/components/AttendanceRecapList.tsx` (Komponen daftar rekapitulasi kehadiran mahasiswa)

> **Catatan:** Sprint 1 belum menyentuh database. Seluruh data sesi dan daftar presensi dikelola langsung menggunakan **state lokal** di layar ini.

---

### 2. Spesifikasi Kebutuhan Fitur

#### 2.1 Informasi Header Sesi Praktikum
- Menampilkan kartu detail sesi praktikum di bagian atas:
  - Nama Praktikum & Modul (misal: *Pemrograman Perangkat Komputasi - Modul 1*)
  - Kelas, Ruangan Lab, dan Waktu Praktikum
  - Badge Status Sesi saat ini:
    - `BELUM_DIBUKA` (Kuning oranye / abu-abu)
    - `BERJALAN` (Hijau)
    - `SELESAI` (Merah)

#### 2.2 Kontrol Siklus Sesi (Buka & Tutup Sesi)
1. **Aksi Buka Sesi:**
   - Tombol **"Buka Sesi"** aktif hanya saat status `BELUM_DIBUKA`.
   - Mengklik tombol membuka dialog `ConfirmModal`:
     - Judul: *"Buka Sesi Praktikum?"*
     - Deskripsi: *"Praktikan akan dapat melakukan presensi kehadiran setelah sesi dibuka."*
     - Tombol: *"Batal"* dan *"Ya, Buka Sekarang"*.
   - Saat dikonfirmasi, ubah state status menjadi `BERJALAN`. Badge status otomatis berubah menjadi warna hijau.
2. **Aksi Tutup Sesi:**
   - Tombol **"Tutup Sesi"** aktif hanya saat status `BERJALAN`.
   - Mengklik tombol membuka dialog `ConfirmModal`:
     - Judul: *"Tutup Sesi Praktikum?"*
     - Deskripsi: *"Sesi yang ditutup tidak dapat dibuka kembali dan presensi akan diakhiri."*
     - Tombol: *"Batal"* dan *"Ya, Tutup Sesi"*.
   - Saat dikonfirmasi, ubah state status menjadi `SELESAI`. Badge berubah menjadi merah dan tombol aksi dinonaktifkan/dikunci.

#### 2.3 Rekapitulasi Kehadiran Praktikan (Recap List)
- Menampilkan summary ringkasan kehadiran di atas daftar: contoh *"Total Mahasiswa Hadir: 3 Mahasiswa"*.
- Menampilkan daftar mahasiswa yang telah absen dari state/mock data lokal menggunakan `FlatList`:
  - Nama Mahasiswa (misal: *Ahmad Fauzi*)
  - NIM (misal: *220101001*)
  - Waktu Kedatangan (misal: *13:15:30 WIB*)
  - Badge Status Kehadiran: `Hadir`, `Izin`, atau `Sakit`.
- **Empty State Rekap:** Jika data kehadiran kosong (`[]`), tampilkan pesan ramah: *"Belum ada mahasiswa praktikan yang melakukan presensi pada sesi ini"*.

---

### 3. Panduan Tata Letak UI & Flexbox (Android)
- **Komponen Dialog (`ConfirmModal`):**
  - Gunakan komponen `<Modal transparent animationType="fade">` bawaan React Native.
  - Overlay: `backgroundColor: 'rgba(0, 0, 0, 0.5)'`, `justifyContent: 'center'`, `alignItems: 'center'`.
  - Kotak Dialog: `width: '85%'`, `backgroundColor: '#FFF'`, `borderRadius: 16`, `padding: 20`, `elevation: 6`.
  - Tombol Batal & Konfirmasi disusun bersebelahan: `flexDirection: 'row'`, `justifyContent: 'flex-end'`, `gap: 12`.
- **Tombol Aksi Status:**
  - Desain tombol yang menonjol dan kontras: tombol buka berwarna hijau/biru, tombol tutup berwarna merah/oranye.
  - Berikan efek disabled jika status tidak memenuhi syarat (`opacity: 0.5`).

---

### 4. Alur Implementasi Fitur
1. **Buat `src/components/ConfirmModal.tsx`:** Modal konfirmasi reusable yang menerima props: `visible`, `title`, `message`, `onConfirm`, dan `onCancel`.
2. **Buat `src/components/AttendanceRecapList.tsx`:** Komponen rekap yang menerima array mahasiswa hadir dan menampilkan baris info kehadiran atau pesan empty state jika kosong.
3. **Rakit di `src/screens/AssistantSessionScreen.tsx`:**
   - Inisialisasi state status sesi (`useState<'BELUM_DIBUKA' | 'BERJALAN' | 'SELESAI'>('BELUM_DIBUKA')`).
   - Inisialisasi state modal konfirmasi.
   - Sediakan state data dummy mahasiswa hadir untuk simulasi rekap langsung di layar.

---

### 5. Acceptance Criteria (Kriteria Keberterimaan)
- [x] Tombol "Buka Sesi" hanya dapat ditekan saat status `BELUM_DIBUKA`.
- [x] Muncul modal konfirmasi sebelum status benar-benar berubah.
- [x] Setelah konfirmasi buka sesi, badge status berubah menjadi `BERJALAN` (Hijau).
- [x] Tombol berubah menjadi "Tutup Sesi" dan memicu modal konfirmasi saat ditekan.
- [x] Setelah konfirmasi tutup sesi, status berubah menjadi `SELESAI` (Merah) dan tombol terkunci.
- [x] Daftar rekap kehadiran menampilkan nama mahasiswa, NIM, jam kehadiran, dan status.
- [x] Muncul pesan empty state jika daftar rekap presensi kosong.

---

### 6. Acuan Mock Data Rekap Asisten

```typescript
export interface AttendanceRecord {
  id: string;
  studentName: string;
  studentNim: string;
  timestamp: string;
  status: 'Hadir' | 'Izin' | 'Sakit';
}

export const INITIAL_ATTENDEES: AttendanceRecord[] = [
  { id: 'att-1', studentName: 'Ahmad Fauzi', studentNim: '220101001', timestamp: '13:05:22 WIB', status: 'Hadir' },
  { id: 'att-2', studentName: 'Siti Rahma', studentNim: '220101015', timestamp: '13:08:45 WIB', status: 'Hadir' },
  { id: 'att-3', studentName: 'Dimas Pratama', studentNim: '220101032', timestamp: '13:12:10 WIB', status: 'Izin' },
];
```
