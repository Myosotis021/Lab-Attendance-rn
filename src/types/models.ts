import { Timestamp } from 'firebase/firestore';

export type RoleType = 'asisten' | 'praktikan';
export type SessionStatus = 'BELUM_DIBUKA' | 'BERJALAN' | 'SELESAI';
export type AttendanceStatus = 'Hadir' | 'Izin' | 'Sakit';

export interface UserProfile {
  uid: string;
  name: string;
  nim?: string;
  role: RoleType;
  email?: string;
}

export interface ClassItem {
  id: string;
  courseTitle: string;
  classGroup: string;
  roomName: string;
  participantIds: string[];
  createdBy: string;
  createdAt: Timestamp;
}

export interface SessionItem {
  id: string;
  classId: string;
  courseTitle: string;
  moduleName: string;
  classGroup: string;
  roomName: string;
  timeSlot: string;
  status: SessionStatus;
  participantIds: string[]; // salinan dari kelas
  createdBy: string;
  createdAt: Timestamp;
}

// attendance/{sessionId}_{uid}
export interface AttendanceRecord {
  id: string;
  sessionId: string;
  classId: string;
  uid: string;
  studentName: string;
  studentNim: string;
  status: 'Hadir' | AttendanceStatus;
  notes: string;
  createdAt: Timestamp;
  timestamp?: string; // Tampilan teks format waktu
}
