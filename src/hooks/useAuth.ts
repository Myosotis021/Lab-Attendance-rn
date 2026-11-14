import { useState, useEffect, useContext } from 'react';
import { UserProfile, RoleType } from '../types/models';
import AuthContext from '../context/AuthContext';

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
  const authContext = useContext(AuthContext);

  const [mockRole, setMockRole] = useState<RoleType>(() => defaultRole || activeMockRole);
  const [customProfile, setCustomProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (defaultRole) {
      return;
    }
    const listener = (newRole: RoleType) => setMockRole(newRole);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, [defaultRole]);

  // Prioritas profil:
  // 1. Custom override profile (jika diset via setProfile)
  // 2. Real Firestore profile dari AuthContext (jika user login Firebase)
  // 3. Fallback mock user (untuk kemudahan demo / offline tanpa auth)
  const realProfile = authContext?.profile;
  const profile: UserProfile =
    customProfile ||
    realProfile ||
    (defaultRole ? MOCK_USERS[defaultRole] : MOCK_USERS[mockRole]) ||
    MOCK_USERS.asisten;

  const role: RoleType = profile.role || (defaultRole || mockRole);
  const loading = authContext ? authContext.loading : false;

  const switchRole = (newRole: RoleType) => {
    setGlobalActiveRole(newRole);
    setMockRole(newRole);
  };

  const setProfile = (newProfile: UserProfile) => {
    setCustomProfile(newProfile);
    if (newProfile.role) {
      setMockRole(newProfile.role);
    }
  };

  return {
    user: authContext?.user
      ? authContext.user
      : { uid: profile.uid, email: profile.email || '' },
    profile,
    loading,
    role,
    switchRole,
    setProfile,
    login: authContext?.login || (async () => {}),
    register: authContext?.register || (async () => {}),
    logout: authContext?.logout || (async () => {}),
    refreshProfile: authContext?.refreshProfile || (async () => {}),
  };
}

export default useAuth;
