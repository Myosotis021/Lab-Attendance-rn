export type Role = 'asisten' | 'praktikan';

export type SessionStatus = 'BELUM_DIBUKA' | 'BERJALAN' | 'SELESAI';

export interface SessionItem {
  id: string;
  courseTitle: string;
  moduleName: string;
  classGroup: string;
  roomName: string;
  timeSlot: string;
  status: SessionStatus;
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

export const INITIAL_SCHEDULES: SessionItem[] = [
  {
    id: 'ses-1',
    courseTitle: 'Pemrograman Perangkat Komputasi',
    moduleName: 'Modul 1: Antarmuka & Alur Praktikum',
    classGroup: 'Kelas A',
    roomName: 'Lab Komputer 2',
    timeSlot: 'Jumat, 13:00 - 15:30 WIB',
    status: 'BELUM_DIBUKA',
  },
  {
    id: 'ses-2',
    courseTitle: 'Jaringan Komputer',
    moduleName: 'Modul 2: Routing Dinamis',
    classGroup: 'Kelas B',
    roomName: 'Lab Jaringan',
    timeSlot: 'Sabtu, 08:00 - 10:30 WIB',
    status: 'BERJALAN',
  },
  {
    id: 'ses-3',
    courseTitle: 'Sistem Operasi',
    moduleName: 'Modul 3: Manajemen Memori & Proses',
    classGroup: 'Kelas C',
    roomName: 'Lab Komputer 1',
    timeSlot: 'Kamis, 10:00 - 12:30 WIB',
    status: 'SELESAI',
  },
];
