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
  roles: Role[];
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
  scheduledAt?: Timestamp;
  scheduledEndAt?: Timestamp;
  status: SessionStatus;
  participantIds: string[];
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
  scheduledAt?: Timestamp;
  scheduledEndAt?: Timestamp;
  status: SessionStatus;
  participantIds?: string[];
  openedAt?: any;
  closedAt?: any;
}

export interface SentimentResult {
  label: SentimentLabel | null;
  status: 'predicted' | 'unknown_vocabulary' | 'empty_input' | 'error';
  experimental: boolean;
}

// Disimpan pada AttendanceRecord (extend existing)
export interface LocationSnapshot {
  latitude: number;
  longitude: number;
  accuracy: number | null; // meter
  distanceToLab: number;   // jarak ke pusat lab dalam meter
  withinRadius: boolean;
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
  timestamp?: string;
  locationSnapshot?: LocationSnapshot;
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

export interface FcmTokenDoc {
  uid: string;
  token: string;
  platform: 'android' | 'ios';
  updatedAt: any;
}

// Dokumen: labLocations/{labId}
export interface LabLocation {
  id: string;
  name: string;        // "Lab Komputer 1"
  building: string;    // "Gedung Informatika Lt.2"
  latitude: number;    // koordinat WGS-84
  longitude: number;
  radiusMeters: number; // radius presensi — default 100m (koreksi PM)
  description?: string;
  createdBy: string;
  updatedAt: any;      // Firestore Timestamp
}

// Digunakan pada MapScreen untuk info aktivitas lab
export interface LabScheduleInfo {
  labId: string;
  currentSession: SessionItem | null; // sesi BERJALAN saat ini
  nextSession: SessionItem | null;    // sesi BELUM_DIBUKA terdekat
}
