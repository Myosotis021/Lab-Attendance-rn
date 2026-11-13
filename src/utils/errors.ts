export function getErrorMessage(error: any): string {
  if (!error) return 'Terjadi kesalahan yang tidak diketahui.';

  const code = error.code || '';
  const message = error.message || '';

  if (code.includes('permission-denied') || message.includes('permission-denied')) {
    return 'Akses ditolak. Anda tidak memiliki izin untuk melakukan tindakan ini.';
  }

  if (
    code.includes('unavailable') ||
    code.includes('network-request-failed') ||
    message.includes('network') ||
    message.includes('offline')
  ) {
    return 'Koneksi jaringan bermasalah. Periksa koneksi internet Anda dan coba lagi.';
  }

  if (code.includes('not-found') || message.includes('not-found')) {
    return 'Data tidak ditemukan.';
  }

  if (code.includes('already-exists')) {
    return 'Pengajuan untuk sesi ini sudah pernah dibuat.';
  }

  return message || 'Terjadi kesalahan pada sistem. Silakan coba lagi.';
}

