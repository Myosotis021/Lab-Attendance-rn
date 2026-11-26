import { PredefinedLab, SessionType } from '../types/models';

export const DEFAULT_ATTENDANCE_RADIUS_METERS = 100;

/**
 * Daftar 4 lab resmi beserta koordinat & radius 100m:
 * - Lab B: -7.048291, 110.440731
 * - Lab C: -7.048248, 110.440831
 * - Lab D: -7.048054, 110.440933
 * - Lab AP: -7.048954, 110.441646
 */
export const PREDEFINED_LABS: PredefinedLab[] = [
  {
    id: 'lab-b',
    name: 'Lab B',
    building: 'Gedung Laboratorium Informatika',
    latitude: -7.048291,
    longitude: 110.440731,
    radiusMeters: DEFAULT_ATTENDANCE_RADIUS_METERS,
    description: 'Laboratorium B (Radius 100 m)',
  },
  {
    id: 'lab-c',
    name: 'Lab C',
    building: 'Gedung Laboratorium Informatika',
    latitude: -7.048248,
    longitude: 110.440831,
    radiusMeters: DEFAULT_ATTENDANCE_RADIUS_METERS,
    description: 'Laboratorium C (Radius 100 m)',
  },
  {
    id: 'lab-d',
    name: 'Lab D',
    building: 'Gedung Laboratorium Informatika',
    latitude: -7.048054,
    longitude: 110.440933,
    radiusMeters: DEFAULT_ATTENDANCE_RADIUS_METERS,
    description: 'Laboratorium D (Radius 100 m)',
  },
  {
    id: 'lab-ap',
    name: 'Lab AP',
    building: 'Gedung Laboratorium Informatika',
    latitude: -7.048954,
    longitude: 110.441646,
    radiusMeters: DEFAULT_ATTENDANCE_RADIUS_METERS,
    description: 'Laboratorium AP (Radius 100 m)',
  },
];

export const ROOM_PRESET_OPTIONS = [
  'Lab B',
  'Lab C',
  'Lab D',
  'Lab AP',
  'Online',
] as const;

export function isOnlineRoom(roomName?: string, sessionType?: SessionType): boolean {
  if (sessionType === 'ONLINE') return true;
  return (roomName || '').trim().toLowerCase() === 'online';
}

export function findPredefinedLabByName(roomName?: string): PredefinedLab | null {
  const normalized = (roomName || '').trim().toLowerCase();
  if (!normalized || normalized === 'online') return null;
  return (
    PREDEFINED_LABS.find(
      (lab) =>
        lab.name.toLowerCase() === normalized ||
        lab.id.toLowerCase() === normalized
    ) || null
  );
}

/** @deprecated gunakan PREDEFINED_LABS */
export const LAB_LOCATIONS_SEED = PREDEFINED_LABS;
