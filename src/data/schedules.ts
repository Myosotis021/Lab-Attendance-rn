import { getDefaultSessionSchedule } from '../utils/timeUtils';
import { SessionType } from '../types/models';

export type Role = 'asisten' | 'praktikan';

export type SessionStatus = 'BELUM_DIBUKA' | 'BERJALAN' | 'SELESAI';

export interface SessionItem {
  id: string;
  classId: string;
  courseTitle: string;
  moduleName: string;
  classGroup: string;
  roomName: string;
  timeSlot: string;
  scheduledAt?: any;
  scheduledEndAt?: any;
  status: SessionStatus;
  sessionType?: SessionType;
  qrToken?: string;
  assistantLat?: number;
  assistantLng?: number;
  usesDateTimePicker?: boolean;
  participantIds: string[];
  createdBy: string;
  createdAt: any;
}

export interface DummyUserProfile {
  name: string;
  identifierLabel: string;
  identifierValue: string;
  roleLabel: string;
}

export const DUMMY_PROFILES: Record<Role, DummyUserProfile> = {
  asisten: {
    name: 'Kak Budi Santoso',
    identifierLabel: 'ID',
    identifierValue: 'AST-01',
    roleLabel: 'Asisten Lab',
  },
  praktikan: {
    name: 'Ahmad Fauzi',
    identifierLabel: 'NIM',
    identifierValue: '220101001',
    roleLabel: 'Praktikan',
  },
};

const defaultSchedule = getDefaultSessionSchedule();

export const INITIAL_SCHEDULES: SessionItem[] = [
  {
    id: 'ses-1',
    classId: '',
    courseTitle: 'Pemrograman Perangkat Komputasi',
    moduleName: 'Modul 1: Antarmuka & Alur Praktikum',
    classGroup: 'Kelas A',
    roomName: 'Lab B',
    timeSlot: defaultSchedule.timeSlot,
    scheduledAt: defaultSchedule.scheduledAt,
    scheduledEndAt: defaultSchedule.scheduledEndAt,
    status: 'BELUM_DIBUKA',
    sessionType: 'OFFLINE',
    usesDateTimePicker: true,
    participantIds: [],
    createdBy: '',
    createdAt: null,
  },
  {
    id: 'ses-2',
    classId: '',
    courseTitle: 'Jaringan Komputer',
    moduleName: 'Modul 2: Routing Dinamis',
    classGroup: 'Kelas B',
    roomName: 'Lab C',
    timeSlot: defaultSchedule.timeSlot,
    scheduledAt: defaultSchedule.scheduledAt,
    scheduledEndAt: defaultSchedule.scheduledEndAt,
    status: 'BERJALAN',
    sessionType: 'OFFLINE',
    usesDateTimePicker: true,
    participantIds: [],
    createdBy: '',
    createdAt: null,
  },
  {
    id: 'ses-3',
    classId: '',
    courseTitle: 'Sistem Operasi',
    moduleName: 'Modul 3: Manajemen Memori & Proses',
    classGroup: 'Kelas C',
    roomName: 'Lab D',
    timeSlot: defaultSchedule.timeSlot,
    scheduledAt: defaultSchedule.scheduledAt,
    scheduledEndAt: defaultSchedule.scheduledEndAt,
    status: 'SELESAI',
    sessionType: 'OFFLINE',
    usesDateTimePicker: true,
    participantIds: [],
    createdBy: '',
    createdAt: null,
  },
];
