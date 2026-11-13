# Demo Checklist & Skenario Pengujian (SRS-17)
**Modul: Pengajuan Izin, Klasifikasi Sentimen AI & Pengujian Demo**  
**Sprint 2: Data Dinamis dengan Firebase (Android React Native)**  
**Penanggung Jawab:** Developer 3 (Raffi Arditama)  
**Tanggal Uji:** 13 November 2026  
**Status Keseluruhan:** SIAP DEMO (Ready for Demo)

---

## 1. Persiapan Data Demo (Seeding / Akun Uji)

| Data | Identifier / Nilai | Keterangan | Status Siap |
|---|---|---|---|
| **Akun Asisten** | `budi.asisten@lab.ac.id` / `AST-01` (`Kak Budi Santoso`) | Asisten pengampu praktikum | [x] Siap |
| **Akun Praktikan 1** | `ahmad.fauzi@mhs.ac.id` / `220101001` (`Ahmad Fauzi`) | Praktikan mengajukan izin | [x] Siap |
| **Akun Praktikan 2** | `siti.rahma@mhs.ac.id` / `220101015` (`Siti Rahma`) | Praktikan hadir & presensi | [x] Siap |
| **Kelas Praktikum** | `class-ti-01` (Kelas TI-A) | Berisi kedua praktikan | [x] Siap |
| **Sesi Praktikum** | `ses-1` (PPK - Modul 1: Antarmuka & Alur Praktikum) | Status awal: `BELUM_DIBUKA` | [x] Siap |

---

## 2. Alur Utama Demo

### Alur A: Alur Praktikan (Pengajuan Izin & Klasifikasi Sentimen AI)
*Skenario: Praktikan berhalangan hadir, mengajukan izin pada sesi BELUM_DIBUKA, sentimen dianalisis lokal, asisten memutuskan, praktikan memantau real-time.*

| No | Langkah Pengujian | Hasil yang Diharapkan | Status | Catatan / Hasil Uji |
|---|---|---|:---:|---|
| A1 | Login / Pilih peran sebagai **Praktikan** (`Ahmad Fauzi`) | Header menampilkan nama Ahmad Fauzi, NIM 220101001, badge Praktikan | [x] Berhasil | Profil terbaca benar dari `useAuth()` |
| A2 | Buka menu **Ajukan Izin** (`LeaveRequestFormScreen`) | Form memuat daftar sesi berstatus `BELUM_DIBUKA` milik praktikan | [x] Berhasil | Sesi `ses-1` tampil sebagai pilihan |
| A3 | Uji validasi alasan: kosong atau < 10 karakter | Muncul pesan error "Alasan minimal 10 karakter" di bawah field, tombol disable/validasi aktif | [x] Berhasil | Mencegah input tidak sah |
| A4 | Masukkan alasan valid: *"Saya mengalami demam tinggi dan diare sejak pagi sehingga harus istirahat dan periksa ke dokter."* | Karakter counter bergerak dinamis (80/300 karakter), batas tidak melebihi 300 | [x] Berhasil | Counter berfungsi normal |
| A5 | Tekan tombol **Kirim Pengajuan** | Tombol menampilkan loading, klasifikasi sentimen berjalan lokal di perangkat, data tersimpan di Firestore | [x] Berhasil | Analisis sentimen: `label: 'netral'` / `status: 'predicted'` |
| A6 | Periksa modal ringkasan sukses | Modal menampilkan judul, modul praktikum, badge status `MENUNGGU`, hasil `SentimentBadge`, dan teks disclaimer | [x] Berhasil | Disclaimer tampil: *"Hasil klasifikasi sentimen hanya informasi pendukung..."* |
| A7 | Uji Anti-Double Submit Izin: coba kirim ulang untuk sesi yang sama | Sistem menolak pengajuan kedua dengan pesan: *"Anda sudah mengajukan izin untuk sesi ini"* | [x] Berhasil | ID dokumen deterministik `ses-1_student-220101001` mencegah duplikasi |
| A8 | Buka layar **Daftar Izin Saya** (`MyLeaveRequestsScreen`) | Kartu izin tampil di daftar dengan badge `MENUNGGU` (kuning/oranye) | [x] Berhasil | Listener `onSnapshot` aktif |

---

### Alur B: Alur Asisten (Review Izin & Siklus Sesi Praktikum)
*Skenario: Asisten memeriksa pengajuan izin praktikan, melihat sentimen AI pendukung, memutuskan terima/tolak, lalu mengelola sesi presensi.*

| No | Langkah Pengujian | Hasil yang Diharapkan | Status | Catatan / Hasil Uji |
|---|---|---|:---:|---|
| B1 | Beralih ke peran **Asisten** (`Kak Budi Santoso`) | Header menampilkan identitas Asisten Lab | [x] Berhasil | Sesuai role switcher |
| B2 | Buka layar **Review Izin Praktikan** (`AssistantLeaveReviewScreen`) | Tampil tab filter: **Menunggu** (default) dan **Semua**, kartu izin praktikan memuat nama, NIM, alasan lengkap, dan `SentimentBadge` | [x] Berhasil | Filter Menunggu menampilkan pengajuan Ahmad Fauzi |
| B3 | Verifikasi isolasi keputusan dari AI | Asisten memiliki kendali penuh; sentimen AI tidak otomatis menerima atau menolak izin | [x] Berhasil | Status tetap `MENUNGGU` sampai ada aksi manual asisten |
| B4 | Asisten mengisi catatan: *"Izin diterima, harap kirim surat dokter via email lab"* dan menekan tombol **✓ Terima** | Muncul dialog konfirmasi `ConfirmModal` Sprint 1 dengan judul *"Terima Pengajuan Izin?"* | [x] Berhasil | Dialog konfirmasi terbuka proporsional |
| B5 | Konfirmasi terima pada modal | `updateDoc` menyimpan `status: 'DITERIMA'`, `decidedBy: 'assistant-ast01'`, `decidedAt: Timestamp`, dan `assistantNote` | [x] Berhasil | Tersimpan di Firestore |
| B6 | Periksa pembaruan status final | Tombol Terima dan Tolak langsung hilang dari kartu. Pengajuan berpindah keluar dari tab Menunggu ke tab Semua | [x] Berhasil | Status final `DITERIMA` bersifat terkunci |
| B7 | Pantau di sisi Praktikan (Layar Ahmad Fauzi) secara real-time | Status izin di `MyLeaveRequestsScreen` praktikan otomatis berganti hijau `DITERIMA` tanpa reload aplikasi | [x] Berhasil | `onSnapshot` real-time terbukti bekerja |
| B8 | Asisten membuka sesi praktikum (`BELUM_DIBUKA` -> `BERJALAN`) | Muncul modal konfirmasi, status sesi menjadi `BERJALAN`, presensi dibuka | [x] Berhasil | Terintegrasi dengan modul Developer 2 |
| B9 | Praktikan 2 (`Siti Rahma`) melakukan presensi | Presensi berhasil dicatat, muncul modal sukses, form terkunci | [x] Berhasil | Anti-double submit presensi aktif |
| B10 | Rekapitulasi kehadiran real-time asisten | Asisten melihat total hadir dan daftar rekapitulasi kehadiran | [x] Berhasil | Tampil di `AttendanceRecapList` |
| B11 | Asisten menutup sesi praktikum (`BERJALAN` -> `SELESAI`) | Status menjadi `SELESAI`, tombol aksi dinonaktifkan, presensi berakhir | [x] Berhasil | Siklus sesi tuntas |

---

## 3. Skenario Pengujian Edge Cases & Keandalan Sistem

| ID | Skenario Uji | Prosedur Uji | Hasil Pengamatan | Status |
|---|---|---|---|:---:|
| E1 | **Persistensi Data** | Tutup aplikasi sepenuhnya (kill process), lalu buka kembali. | Seluruh data pengajuan izin dan riwayat status tetap tersimpan utuh di Firestore. | [x] Lulus |
| E2 | **Anti-Double Attendance** | Praktikan yang sudah presensi mencoba mengisi form presensi lagi. | Form presensi terkunci dan menampilkan kartu status kehadiran; tidak bisa presensi ganda. | [x] Lulus |
| E3 | **Proteksi Hak Akses (Role Gate)** | Praktikan mencoba mengakses layar keputusan asisten secara langsung. | Layar review hanya merespons aksi asisten dan Firestore rules menolak update dari non-asisten. | [x] Lulus |
| E4 | **Mode Pesawat / Offline** | Matikan jaringan internet saat berada di form pengajuan izin, lalu tekan kirim. | Pesan error jaringan dari `getErrorMessage()` muncul, **isi teks alasan tidak hilang**, tombol coba lagi tersedia. | [x] Lulus |
| E5 | **Model AI Offline** | Jalankan klasifikasi sentimen dalam keadaan tanpa koneksi internet sama sekali. | Model JavaScript murni (`sentiment.js` + `model-edom.json`) tetap memproses tanpa error jaringan. | [x] Lulus |
| E6 | **Input Kata Tidak Dikenal AI** | Masukkan alasan berisi kata-kata asing / typo: *"asdfgh qwerty zxcvbnm test"* | Model menghasilkan `label: null` dan `status: 'unknown_vocabulary'`. Tampil badge *"Belum dapat diklasifikasikan"*. Pengajuan tetap berhasil terkirim. | [x] Lulus |
| E7 | **Input Alasan Kosong** | Teks alasan diisi spasi saja atau string kosong. | Ditolak oleh validasi lokal sebelum memanggil Firestore maupun AI model. | [x] Lulus |
| E8 | **Simulasi Sesi Berjalan / Selesai** | Coba ajukan izin pada sesi yang sudah `BERJALAN` atau `SELESAI`. | Sesi tersebut tidak muncul di daftar pilihan `LeaveRequestFormScreen` (hanya sesi `BELUM_DIBUKA` yang dapat diajukan izin). | [x] Lulus |

---

## 4. Evaluasi & Catatan Model Klasifikasi Sentimen AI (EDOM)

1. **Inferensi Lokal Tanpa Server:**
   - Model `model-edom.json` (bobot model TF-IDF + LinearSVC berukuran ~279 KB) dan file inferensi `sentiment.js` berjalan secara deterministik di JavaScript thread client React Native.
   - Tidak ada transmisi data teks alasan mahasiswa ke cloud server pihak ketiga, menjamin kerahasiaan data mahasiswa (privacy-preserving).
2. **Karakteristik & Keterbatasan Dataset:**
   - Model dilatih pada dataset Evaluasi Dosen oleh Mahasiswa (EDOM), bukan corpus perizinan praktikum.
   - Kelas sentimen `netral` memiliki margin pembeda yang lebih sempit dibanding `positif` dan `negatif`.
   - Klasifikasi sentimen semata-mata menjadi **informasi pendukung** visual bagi asisten lab dan tidak secara otomatis menentukan disetujui atau ditolaknya izin praktikan.

