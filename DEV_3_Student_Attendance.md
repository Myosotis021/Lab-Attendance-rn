# Panduan Tugas Pengembang (Developer 3)
## Modul: Presensi Praktikan, Anti-Double Submit & Modal Feedback
**Sprint 1: Antarmuka dan Alur Praktikum (Android React Native)**

---

### 1. Informasi Fitur & Berkas
- **Penanggung Jawab:** Developer 3
- **Nama Fitur:** Student Attendance & Feedback Modal
- **Target Branch:** `feat/sprint1-student-attendance`
- **Target Platform:** Android (React Native)
- **Berkas yang Dibuat/Dikelola:**
  - `src/screens/StudentAttendanceScreen.tsx` (Layar formulir presensi dan bukti hadir praktikan)
  - `src/components/AttendanceFeedbackModal.tsx` (Komponen modal pop-up umpan balik sukses presensi)
  - `src/components/StudentHistoryCard.tsx` (Komponen kartu bukti/riwayat presensi mandiri)

> **Catatan:** Sprint 1 belum menyentuh database. Praktikan cukup mendemonstrasikan bahwa form presensi merespons kondisi status sesi, mencatat jam lokal, menampilkan popup sukses, dan langsung terkunci agar tidak bisa presensi ganda.

---

### 2. Spesifikasi Kebutuhan Fitur

#### 2.1 Proteksi Status Sesi (Form Gating)
Layar harus merespons 3 kondisi status sesi praktikum:
- **Kondisi `BELUM_DIBUKA`:** Form presensi dinonaktifkan / disembunyikan. Tampilkan kartu peringatan: *"Sesi praktikum belum dibuka oleh asisten lab. Pengisian presensi belum tersedia."*
- **Kondisi `SELESAI`:** Form presensi dinonaktifkan / disembunyikan. Tampilkan peringatan: *"Sesi praktikum telah ditutup. Pengisian presensi sudah berakhir."*
- **Kondisi `BERJALAN`:** Form presensi terbuka, aktif, dan dapat diisi oleh mahasiswa.

*(Tips: Buat tombol switch status sesi di bagian atas layar agar Anda dan penguji dapat mensimulasikan ketiga kondisi tersebut dengan mudah saat demo).*

#### 2.2 Formulir Input Presensi Mahasiswa
- **Identitas Mahasiswa:** Nama (*Ahmad Fauzi*) dan NIM (*220101001*) ditampilkan secara otomatis (read-only info card).
- **Pilihan Status Kehadiran:** Opsi interaktif (Pill Button atau Radio Button):
  - `Hadir` (Default terpilih)
  - `Izin`
  - `Sakit`
- **Catatan Tambahan (Opsional):** Kolom input teks (`TextInput`) untuk mengisi catatan (contoh: *Nomor Meja Lab: PC-04*).
- **Tombol Submit:** Tombol utama *"Kirim Presensi Sekarang"*.

#### 2.3 Mekanisme Anti-Double Attendance (Pencegahan Presensi Ganda)
- Saat tombol submit ditekan:
  1. Catat jam lokal sistem saat itu juga (contoh: `new Date().toLocaleTimeString('id-ID') + ' WIB'`).
  2. Ubah state `hasAttended = true`.
- **Form Langsung Terkunci:**
  - Form input tidak lagi ditampilkan (atau dinonaktifkan total).
  - Gantikan dengan kartu status kehadiran: *"Anda telah berhasil presensi pada [Jam:Menit:Detik WIB] - Status: [Hadir]"*.
  - Tombol submit tidak dapat ditekan kembali.

#### 2.4 Modal Umpan Balik Sukses (`AttendanceFeedbackModal`)
- Sesaat setelah submit, munculkan dialog modal/bottom sheet yang menarik:
  - Ikon centang hijau / sukses besar.
  - Judul: *"Presensi Berhasil Dicatat!"*
  - Ringkasan: Nama Mahasiswa, NIM, Waktu Jam Masuk, dan Status Kehadiran.
  - Tombol: *"Selesai / Tutup"*.

#### 2.5 Catatan Riwayat Kehadiran Mandiri (`StudentHistoryCard`)
- Menampilkan ringkasan riwayat bukti kehadiran mahasiswa pada sesi ini di bagian bawah layar.

---

### 3. Panduan Tata Letak UI & Flexbox (Android)
- **Kontainer:** `flex: 1`, `backgroundColor: '#F8F9FA'`, `padding: 16`.
- **Form Styling:**
  - Label input yang jelas dan mudah dibaca.
  - `TextInput`: `borderWidth: 1`, `borderColor: '#CED4DA'`, `borderRadius: 8`, `padding: 12`, `minHeight: 48` (nyaman disentuh).
  - Status Pills (Hadir/Izin/Sakit): Susun horizontal (`flexDirection: 'row'`, `gap: 10`). Berikan warna aktif berbeda saat dipilih (misal: Hijau untuk Hadir, Kuning untuk Izin, Biru untuk Sakit).
- **Modal Feedback:**
  - Latar semi-transparan (`backgroundColor: 'rgba(0,0,0,0.5)'`).
  - Animasi `slide` atau `fade` dengan kartu pop-up membulat (`borderRadius: 20`, `padding: 24`, `alignItems: 'center'`).

---

### 4. Alur Implementasi Fitur
1. **Buat `src/components/AttendanceFeedbackModal.tsx`:** Modal pop-up sukses presensi menerima props: `visible`, `attendanceData`, dan `onClose`.
2. **Buat `src/components/StudentHistoryCard.tsx`:** Komponen kartu bukti riwayat presensi yang menampilkan data setelah submit berhasil.
3. **Rakit di `src/screens/StudentAttendanceScreen.tsx`:**
   - Inisialisasi state: `selectedStatus`, `notes`, `hasAttended`, `attendanceTime`, dan `showFeedbackModal`.
   - Pasang logika submit: rekam timestamp saat ini, set `hasAttended = true`, lalu buka modal feedback.
   - Pasang kondisional rendering: jika `hasAttended === true`, sembunyikan form dan tampilkan kartu bukti kehadiran.

---

### 5. Acceptance Criteria (Kriteria Keberterimaan)
- [x] Form presensi terkunci jika status sesi adalah `BELUM_DIBUKA` atau `SELESAI`.
- [x] Mahasiswa dapat memilih status (Hadir, Izin, Sakit) dan mengisi catatan nomor meja.
- [x] Waktu kehadiran tercatat secara otomatis saat tombol submit ditekan.
- [x] Muncul modal pop-up centang hijau sebagai umpan balik sukses presensi.
- [x] Terbukti anti-double attendance: setelah submit berhasil, tombol terkunci dan tidak bisa melakukan absen dua kali.
- [x] Tampilan responsif dan proporsional pada layar Android.
