import { useState, useEffect } from 'react';
import { UserProfile, RoleType } from '../types/models';

export const MOCK_USERS: Record<RoleType, UserProfile> = {
  asisten: {
    uid: 'asisten-01',
    name: 'Asisten Lab',
    role: 'asisten',
    email: 'asisten@lab.ac.id',
  },
  praktikan: {
    uid: 'mhs-220101001',
    name: 'Ahmad Fauzi',
    nim: '220101001',
    role: 'praktikan',
    email: 'ahmad@mhs.ac.id',
  },
};

// Global active mock state so components share the selected user if switched
let activeMockRole: RoleType = 'asisten';
const listeners = new Set<(role: RoleType) => void>();

export const setGlobalActiveRole = (role: RoleType) => {
  activeMockRole = role;
  listeners.forEach((listener) => listener(role));
};

export function useAuth() {
  const [role, setRole] = useState<RoleType>(activeMockRole);
  const loading = false;

  useEffect(() => {
    const listener = (newRole: RoleType) => setRole(newRole);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  const profile = MOCK_USERS[role];

  const switchRole = (newRole: RoleType) => {
    setGlobalActiveRole(newRole);
  };

  return {
    user: { uid: profile.uid, email: profile.email },
    profile,
    loading,
    role,
    switchRole,
  };
}

export default useAuth;
