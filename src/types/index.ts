// Kontrak Tipe Data Bersama untuk Sprint 1
// Digunakan oleh: PM, Developer 1, Developer 2, dan Developer 3

export type RoleType = 'asisten' | 'praktikan';

export type SessionStatus = 'BELUM_DIBUKA' | 'BERJALAN' | 'SELESAI';

export type AttendanceStatus = 'Hadir' | 'Izin' | 'Sakit';

export interface UserProfile {
  id: string;
  name: string;
  identifier: string; // NIM atau Kode Asisten
  role: RoleType;
}

export interface SessionItem {
  id: string;
  courseTitle: string;
  moduleName: string;
  classGroup: string;
  roomName: string;
  timeSlot: string;
  status: SessionStatus;
}

export interface AttendanceRecord {
  id: string;
  studentName: string;
  studentNim: string;
  timestamp: string;
  status: AttendanceStatus;
  notes?: string;
}
