/**
 * Pemetaan kode error Firebase ke pesan berbahasa Indonesia yang ramah pengguna (SRS-04)
 */

export const FIREBASE_ERROR_MAP: Record<string, string> = {
  // Authentication Errors
  'auth/invalid-credential': 'Email atau password salah',
  'auth/user-not-found': 'Email atau password salah',
  'auth/wrong-password': 'Email atau password salah',
  'auth/invalid-email': 'Format email tidak valid',
  'auth/email-already-in-use': 'Email sudah terdaftar',
  'auth/weak-password': 'Password terlalu lemah (minimal 6 karakter)',
  'auth/too-many-requests': 'Terlalu banyak percobaan, coba lagi nanti',
  'auth/network-request-failed': 'Tidak ada koneksi internet',
  'auth/user-disabled': 'Akun ini telah dinonaktifkan',
  'auth/operation-not-allowed': 'Metode autentikasi ini tidak diaktifkan',

  // Firestore Errors
  'permission-denied': 'Anda tidak memiliki izin untuk aksi ini',
  'unavailable': 'Layanan tidak dapat dijangkau, periksa koneksi internet',
  'not-found': 'Data yang dicari tidak ditemukan',
  'already-exists': 'Data sudah ada',
  'cancelled': 'Operasi dibatalkan',
  'deadline-exceeded': 'Batas waktu operasi terlampaui, silakan coba lagi',
};

/**
 * Mengubah objek error atau string kode error menjadi pesan ramah pengguna berbahasa Indonesia
 */
export function getErrorMessage(error: unknown): string {
  if (!error) {
    return 'Terjadi kesalahan, silakan coba lagi';
  }

  // Jika error adalah string langsung (misal kode error)
  if (typeof error === 'string') {
    return FIREBASE_ERROR_MAP[error] || error;
  }

  // Jika error adalah objek dengan properti code (Firebase standard)
  const errObj = error as { code?: string; message?: string };
  if (errObj.code) {
    // Tangani jika ada prefix firestore misal 'firestore/permission-denied'
    const cleanCode = errObj.code.replace('firestore/', '');
    if (FIREBASE_ERROR_MAP[cleanCode]) {
      return FIREBASE_ERROR_MAP[cleanCode];
    }
    if (FIREBASE_ERROR_MAP[errObj.code]) {
      return FIREBASE_ERROR_MAP[errObj.code];
    }
  }

  // Fallback ke message jika ada dan bukan raw technical stack
  if (errObj.message) {
    // Periksa apakah pesan mengandung kode error tertentu
    for (const [code, msg] of Object.entries(FIREBASE_ERROR_MAP)) {
      if (errObj.message.includes(code)) {
        return msg;
      }
    }
  }

  return 'Terjadi kesalahan, silakan coba lagi';
}

export default getErrorMessage;
