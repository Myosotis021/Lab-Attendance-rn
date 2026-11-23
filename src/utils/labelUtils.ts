/**
 * Helper utilities untuk label UI yang ramah pengguna (Sprint 3)
 */

export function getRoleLabel(role?: string | null): string {
  if (!role) return '';
  const labels: Record<string, string> = {
    asisten: 'Asisten Praktikum',
    praktikan: 'Praktikan',
  };
  return labels[role] ?? role;
}

export function getSessionStatusLabel(status?: string | null): string {
  if (!status) return '';
  const labels: Record<string, string> = {
    BELUM_DIBUKA: 'Belum Dibuka',
    BERJALAN: 'Sedang Berlangsung',
    SELESAI: 'Selesai',
  };
  return labels[status] ?? status;
}
