export function getErrorMessage(error: unknown): string {
  if (!error) return 'Terjadi kesalahan tidak diketahui.';

  if (typeof error === 'string') return error;

  const err = error as { code?: string; message?: string };

  if (err.code) {
    switch (err.code) {
      case 'permission-denied':
        return 'Presensi gagal. Sesi sudah ditutup atau Anda sudah presensi.';
      case 'unavailable':
        return 'Koneksi ke server terputus. Periksa jaringan internet Anda.';
      case 'not-found':
        return 'Data yang diminta tidak ditemukan.';
      case 'already-exists':
        return 'Data sudah terdaftar sebelumnya.';
      case 'cancelled':
        return 'Operasi dibatalkan.';
      case 'deadline-exceeded':
        return 'Waktu permintaan habis. Silakan coba beberapa saat lagi.';
      default:
        break;
    }
  }

  if (err.message) {
    if (err.message.includes('permission-denied') || err.message.includes('PERMISSION_DENIED')) {
      return 'Presensi gagal. Sesi sudah ditutup atau Anda sudah presensi.';
    }
    if (err.message.includes('network') || err.message.includes('Failed to fetch')) {
      return 'Gagal terhubung ke jaringan. Periksa koneksi internet Anda.';
    }
    return err.message;
  }

  return 'Terjadi kesalahan sistem. Silakan coba lagi.';
}

export default getErrorMessage;
