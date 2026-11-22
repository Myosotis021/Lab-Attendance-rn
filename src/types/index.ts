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
  classId?: string;
  courseTitle: string;
  moduleName: string;
  classGroup: string;
  roomName: string;
  timeSlot: string;
  scheduledAt?: any;
  scheduledEndAt?: any;
  status: SessionStatus;
  participantIds?: string[];
}

export interface AttendanceRecord {
  id: string;
  studentName: string;
  studentNim: string;
  timestamp: string;
  status: AttendanceStatus;
  notes?: string;
}
