import { useState, useEffect } from 'react';
import { UserProfile, RoleType } from '../types/models';

export const MOCK_USERS: Record<RoleType, UserProfile> = {
  asisten: {
    uid: 'assistant-ast01',
    name: 'Kak Budi Santoso',
    identifier: 'AST-01',
    role: 'asisten',
    email: 'asisten@lab.ac.id',
    classId: 'class-ti-01',
  },
  praktikan: {
    uid: 'mhs-220101001',
    name: 'Ahmad Fauzi',
    nim: '220101001',
    identifier: '220101001',
    role: 'praktikan',
    email: 'ahmad@mhs.ac.id',
    classId: 'class-ti-01',
  },
};

export const DEMO_PROFILES = MOCK_USERS;

// Global active mock state so components share the selected user if switched
let activeMockRole: RoleType = 'asisten';
const listeners = new Set<(role: RoleType) => void>();

export const setGlobalActiveRole = (role: RoleType) => {
  activeMockRole = role;
  listeners.forEach((listener) => listener(role));
};

export function useAuth(defaultRole?: RoleType) {
  const [role, setRole] = useState<RoleType>(() => defaultRole || activeMockRole);
  const loading = false;
  const [customProfile, setCustomProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (defaultRole) {
      return;
    }
    const listener = (newRole: RoleType) => setRole(newRole);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, [defaultRole]);

  const profile = customProfile || MOCK_USERS[role] || MOCK_USERS.asisten;

  const switchRole = (newRole: RoleType) => {
    setGlobalActiveRole(newRole);
  };

  const setProfile = (newProfile: UserProfile) => {
    setCustomProfile(newProfile);
    if (newProfile.role) {
      setRole(newProfile.role);
    }
  };

  return {
    user: { uid: profile.uid, email: profile.email || '' },
    profile,
    loading,
    role,
    switchRole,
    setProfile,
  };
}

export default useAuth;
