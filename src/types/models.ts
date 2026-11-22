import { Timestamp } from 'firebase/firestore';

export type RoleType = 'asisten' | 'praktikan';
export type SessionStatus = 'BELUM_DIBUKA' | 'BERJALAN' | 'SELESAI';
export type LeaveStatus = 'MENUNGGU' | 'DITERIMA' | 'DITOLAK';
export type SentimentLabel = 'negatif' | 'netral' | 'positif';

export interface SentimentResult {
  label: SentimentLabel | null;
  status: 'predicted' | 'unknown_vocabulary' | 'empty_input' | 'error';
  experimental: boolean;
}

// leaveRequests/{sessionId}_{uid}
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
  decidedAt: any; // Firestore Timestamp | null
  assistantNote: string;
  createdAt: any; // Firestore Timestamp
}

export interface UserProfile {
  uid: string;
  name: string;
  nim?: string;
  identifier?: string;
  role: RoleType;
  classId?: string;
}

export interface SessionDoc {
  id: string;
  classId: string;
  courseTitle: string;
  moduleName: string;
  roomName: string;
  timeSlot: string;
  scheduledAt?: Timestamp;
  scheduledEndAt?: Timestamp;
  status: SessionStatus;
  participantIds?: string[];
  openedAt?: any;
  closedAt?: any;
}

export interface SessionItem {
  id: string;
  classId?: string;
  courseTitle: string;
  moduleName: string;
  classGroup?: string;
  roomName?: string;
  timeSlot: string; // tetap ada sebagai label tampilan, mis. "Jumat, 13:00 - 15:30 WIB"
  scheduledAt?: Timestamp; // BARU: waktu mulai sesi sebagai Timestamp Firestore (timezone Jakarta)
  scheduledEndAt?: Timestamp; // BARU: waktu selesai sesi
  status: SessionStatus;
  participantIds?: string[];
  createdBy?: string;
  createdAt?: Timestamp;
}

export interface FcmTokenDoc {
  uid: string;
  token: string;
  platform: 'android' | 'ios';
  updatedAt: any;
}
