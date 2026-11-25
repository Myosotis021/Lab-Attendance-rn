export type RoleType = 'asisten' | 'praktikan';
export type Role = RoleType;
export type SessionStatus = 'BELUM_DIBUKA' | 'BERJALAN' | 'SELESAI';
export type AttendanceStatus = 'Hadir' | 'Izin' | 'Sakit';
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

export interface SessionItem {
  id: string;
  classId?: string;
  courseTitle: string;
  moduleName: string;
  classGroup: string;
  roomName: string;
  timeSlot: string;
  status: SessionStatus;
  participantIds?: string[];
  createdBy?: string;
  createdAt?: any;
}

// Disimpan pada AttendanceRecord (extend existing)
export interface LocationSnapshot {
  latitude: number;
  longitude: number;
  accuracy: number | null; // meter
  distanceToLab: number; // jarak ke pusat lab dalam meter
  withinRadius: boolean;
}

// Dokumen: attendance/{sessionId}_{uid}
export interface AttendanceRecord {
  id: string;
  sessionId?: string;
  classId?: string;
  uid?: string;
  studentName: string;
  studentNim: string;
  timestamp?: string;
  status: AttendanceStatus;
  notes?: string;
  createdAt?: any;
  locationSnapshot?: LocationSnapshot;
}

// Dokumen: labLocations/{labId}
export interface LabLocation {
  id: string;
  name: string; // "Lab Komputer 1"
  building: string; // "Gedung Informatika Lt.2"
  latitude: number; // koordinat WGS-84
  longitude: number;
  radiusMeters: number; // radius presensi (default 100m)
  description?: string;
  createdBy: string;
  updatedAt: any; // Firestore Timestamp
}

// Digunakan pada MapScreen untuk info aktivitas lab
export interface LabScheduleInfo {
  labId: string;
  currentSession: SessionItem | null; // sesi BERJALAN saat ini
  nextSession: SessionItem | null; // sesi BELUM_DIBUKA terdekat
}
