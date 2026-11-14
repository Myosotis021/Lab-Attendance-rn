import { Timestamp } from 'firebase/firestore';

export type Role = 'asisten' | 'praktikan';
export type RoleType = Role;
export type SessionStatus = 'BELUM_DIBUKA' | 'BERJALAN' | 'SELESAI';
export type AttendanceStatus = 'Hadir' | 'Izin' | 'Sakit';
export type LeaveStatus = 'MENUNGGU' | 'DITERIMA' | 'DITOLAK';
export type SentimentLabel = 'negatif' | 'netral' | 'positif';

export interface UserProfile {
  uid: string;
  name: string;
  email?: string;
  role: RoleType;
  nim?: string | null;
  identifier?: string;
  classId?: string;
  createdAt?: Timestamp;
}

export interface ClassItem {
  id: string;
  courseTitle: string;
  classGroup: string;
  roomName: string;
  participantIds: string[]; // uid praktikan
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

export interface SessionDoc {
  id: string;
  classId: string;
  courseTitle: string;
  moduleName: string;
  roomName: string;
  timeSlot: string;
  status: SessionStatus;
  participantIds?: string[];
  openedAt?: any;
  closedAt?: any;
}

// Dokumen: attendance/{sessionId}_{uid}
export interface AttendanceRecord {
  id: string;
  sessionId: string;
  classId: string;
  uid: string;
  studentName: string;
  studentNim: string;
  status: AttendanceStatus;
  notes: string;
  createdAt: Timestamp;
  timestamp?: string; // Tampilan teks format waktu
}

export interface SentimentResult {
  label: SentimentLabel | null;
  status: 'predicted' | 'unknown_vocabulary' | 'empty_input' | 'error';
  experimental: boolean;
}

// Dokumen: leaveRequests/{sessionId}_{uid}
export interface LeaveRequest {
  id: string;
  sessionId: string;
  classId: string;
  uid: string;
  studentName: string;
  studentNim: string;
  courseTitle: string;
  moduleName: string;
  reason: string;
  sentiment: SentimentResult;
  status: LeaveStatus;
  decidedBy: string | null;
  decidedAt: Timestamp | null;
  assistantNote: string;
  createdAt: Timestamp;
}
