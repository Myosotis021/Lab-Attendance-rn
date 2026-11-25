import { Timestamp } from 'firebase/firestore';

export type Role = 'asisten' | 'praktikan';
export type RoleType = Role;
export type SessionStatus = 'BELUM_DIBUKA' | 'BERJALAN' | 'SELESAI';
/** 'OFFLINE' = presensi berbasis lokasi GPS, 'ONLINE' = presensi via QR code */
export type SessionType = 'OFFLINE' | 'ONLINE';
export type AttendanceStatus = 'Hadir' | 'Izin' | 'Sakit';
export type LeaveStatus = 'MENUNGGU' | 'DITERIMA' | 'DITOLAK';
export type SentimentLabel = 'negatif' | 'netral' | 'positif';

/** Pilihan lab yang tersedia di picker asprak */
export interface PredefinedLab {
  id: string;
  name: string;
  building: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  description?: string;
}

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
  /** 'Lab B & C' | 'Lab D' | 'Lab AP' | 'Online' | custom */
  roomName: string;
  timeSlot: string;
  scheduledAt?: Timestamp;
  scheduledEndAt?: Timestamp;
  status: SessionStatus;
  /** 'OFFLINE' (default, berbasis lokasi) atau 'ONLINE' (berbasis QR code) */
  sessionType?: SessionType;
  /**
   * Token QR yang di-generate asprak saat sesi Online dibuka.
   * Praktikan scan QR ini untuk presensi.
   */
  qrToken?: string;
  /**
   * Koordinat asprak saat membuka sesi (untuk OFFLINE tanpa lab terdaftar).
   * Jika lab terdaftar, gunakan koordinat lab. PM rule: radius 150 m.
   */
  assistantLat?: number;
  assistantLng?: number;
  participantIds: string[];
  createdBy: string;
  createdAt: Timestamp;
  usesDateTimePicker?: boolean;
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
  sessionType?: SessionType;
  qrToken?: string;
  assistantLat?: number;
  assistantLng?: number;
  participantIds?: string[];
  openedAt?: any;
  closedAt?: any;
  usesDateTimePicker?: boolean;
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
  radiusMeters: number; // radius presensi — default 150m (PM Sprint 3)
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
