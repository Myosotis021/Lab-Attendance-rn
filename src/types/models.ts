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
  status: SessionStatus;
  participantIds?: string[];
  openedAt?: any;
  closedAt?: any;
}

