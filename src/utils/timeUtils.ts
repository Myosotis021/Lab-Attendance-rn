import { Timestamp } from 'firebase/firestore';

export const JAKARTA_TZ = 'Asia/Jakarta';

const DAYS_ID = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const MONTHS_ID = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'Mei',
  'Jun',
  'Jul',
  'Agu',
  'Sep',
  'Okt',
  'Nov',
  'Des',
];

/**
 * Konversi Timestamp / Date / string / number ke Date object
 */
export function toJakartaDate(ts: Timestamp | Date | any | null): Date | null {
  if (!ts) return null;
  if (ts instanceof Date) return isNaN(ts.getTime()) ? null : ts;
  if (typeof ts.toDate === 'function') {
    return ts.toDate();
  }
  if (typeof ts.seconds === 'number') {
    return new Date(ts.seconds * 1000);
  }
  if (typeof ts === 'string' || typeof ts === 'number') {
    const parsed = new Date(ts);
    return isNaN(parsed.getTime()) ? null : parsed;
  }
  return null;
}

// Alias
export const toWIBDate = toJakartaDate;

/**
 * Format timestamp menjadi string tampilan waktu Jakarta (WIB)
 * Contoh: "Jumat, 13 Nov 2026, 13:00 WIB"
 */
export function formatJakartaTime(ts: Timestamp | Date | any | null): string {
  if (!ts) return '-';

  // Jika sudah string berformat waktu langsung (misal "13:05:22 WIB")
  if (typeof ts === 'string' && ts.includes('WIB')) {
    return ts;
  }

  const date = toJakartaDate(ts);
  if (!date) {
    return typeof ts === 'string' ? ts : '-';
  }

  try {
    const formatter = new Intl.DateTimeFormat('id-ID', {
      timeZone: JAKARTA_TZ,
      weekday: 'long',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

    const parts = formatter.formatToParts(date);
    let weekday = '';
    let day = '';
    let month = '';
    let year = '';
    let hour = '';
    let minute = '';

    for (const part of parts) {
      if (part.type === 'weekday') weekday = part.value;
      if (part.type === 'day') day = part.value;
      if (part.type === 'month') month = part.value;
      if (part.type === 'year') year = part.value;
      if (part.type === 'hour') hour = part.value;
      if (part.type === 'minute') minute = part.value;
    }

    if (weekday && day && month && year && hour && minute) {
      return `${weekday}, ${day} ${month} ${year}, ${hour}:${minute} WIB`;
    }

    return `${formatter.format(date)} WIB`;
  } catch {
    // Fallback format manual
    const dayName = DAYS_ID[date.getDay()];
    const day = date.getDate();
    const monthName = MONTHS_ID[date.getMonth()];
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const mins = String(date.getMinutes()).padStart(2, '0');
    return `${dayName}, ${day} ${monthName} ${year}, ${hours}:${mins} WIB`;
  }
}

// Alias
export const formatWIB = formatJakartaTime;

/**
 * Format label timeSlot untuk tampilan singkat
 * Contoh: "13:00 - 15:30 WIB"
 */
export function formatTimeSlotLabel(
  start: Timestamp | Date | any,
  end: Timestamp | Date | any
): string {
  const startDate = toJakartaDate(start);
  const endDate = toJakartaDate(end);

  if (!startDate || !endDate) return '-';

  try {
    const timeFormatter = new Intl.DateTimeFormat('id-ID', {
      timeZone: JAKARTA_TZ,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    return `${timeFormatter.format(startDate)} - ${timeFormatter.format(endDate)} WIB`;
  } catch {
    const startH = String(startDate.getHours()).padStart(2, '0');
    const startM = String(startDate.getMinutes()).padStart(2, '0');
    const endH = String(endDate.getHours()).padStart(2, '0');
    const endM = String(endDate.getMinutes()).padStart(2, '0');
    return `${startH}:${startM} - ${endH}:${endM} WIB`;
  }
}

/**
 * Periksa apakah waktu sekarang sudah melewati atau sama dengan waktu mulai sesi
 * (dengan toleransi 5 menit sebelum jadwal)
 */
export function isSessionTimeReached(scheduledAt: Timestamp | Date | any): boolean {
  if (!scheduledAt) return true;
  const sessionDate = toJakartaDate(scheduledAt);
  if (!sessionDate) return true;

  const now = new Date();
  const diffMs = now.getTime() - sessionDate.getTime();
  return diffMs >= -5 * 60 * 1000; // boleh dibuka 5 menit sebelum jadwal
}

// Alias
export const isSessionTime = isSessionTimeReached;

/**
 * Parse string "HH:MM" dan tanggal Date menjadi Timestamp Jakarta
 */
export function buildTimestamp(date: Date, timeStr: string): Timestamp {
  const parts = timeStr.trim().split(':');
  const hours = parseInt(parts[0] || '0', 10);
  const minutes = parseInt(parts[1] || '0', 10);

  const targetDate = new Date(date.getTime());
  targetDate.setHours(hours, minutes, 0, 0);

  return Timestamp.fromDate(targetDate);
}
