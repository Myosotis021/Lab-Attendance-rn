import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  deleteUser,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  arrayUnion,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { Role, UserProfile } from '../types/models';
import { validateNim } from '../utils/validators';

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  role: Role;
  nim?: string;
}

export interface AuthContextValue {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  switchRole: (newRole: Role) => Promise<void>;
  addRole: (newRole: Role, extraNim?: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Mengambil data profil dari Cloud Firestore (users/{uid})
  const fetchUserProfile = useCallback(async (uid: string) => {
    try {
      const userDocRef = doc(db, 'users', uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const data = userDocSnap.data();
        // Migrasi data lama: jika field roles belum ada, default ke [data.role]
        const roles: Role[] =
          Array.isArray(data.roles) && data.roles.length > 0
            ? (data.roles as Role[])
            : [data.role as Role];

        const userProfile: UserProfile = {
          uid: data.uid || uid,
          name: data.name || '',
          email: data.email || '',
          role: (data.role as Role) || roles[0],
          roles: roles,
          nim: data.nim ?? null,
          identifier: data.identifier || undefined,
          classId: data.classId || undefined,
          createdAt: data.createdAt || Timestamp.now(),
        };
        setProfile(userProfile);
        return userProfile;
      } else {
        // Dokumen Firestore tidak ditemukan (orphan auth account)
        setProfile(null);
        return null;
      }
    } catch (error) {
      console.error('Error fetching user profile from Firestore:', error);
      setProfile(null);
      return null;
    }
  }, []);

  // Listener status autentikasi Firebase
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await fetchUserProfile(currentUser.uid);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [fetchUserProfile]);

  // Alur Login (SRS-02)
  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );
      setUser(userCredential.user);
      await fetchUserProfile(userCredential.user.uid);
    } finally {
      setLoading(false);
    }
  };

  // Alur Registrasi (SRS-01)
  const register = async ({
    name,
    email,
    password,
    role,
    nim,
  }: RegisterInput) => {
    setLoading(true);
    let createdAuthUser: User | null = null;

    try {
      // 1. Buat akun di Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );
      createdAuthUser = userCredential.user;

      // 2. Update display name pada Firebase Auth
      await updateProfile(createdAuthUser, {
        displayName: name.trim(),
      });

      // 3. Simpan data dokumen pengguna di Firestore (users/{uid})
      const userProfileData = {
        uid: createdAuthUser.uid,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        role: role,
        roles: [role],
        nim: role === 'praktikan' ? (nim ? nim.trim() : null) : null,
        createdAt: serverTimestamp(),
      };

      await setDoc(doc(db, 'users', createdAuthUser.uid), userProfileData);

      // Set profile lokal sementara menunggu snapshot
      setProfile({
        ...userProfileData,
        roles: [role],
        createdAt: Timestamp.now(),
      });
      setUser(createdAuthUser);
    } catch (error) {
      // Jika penyimpanan dokumen Firestore gagal, rollback akun Auth agar tidak ada akun tanpa peran
      if (createdAuthUser) {
        try {
          await deleteUser(createdAuthUser);
        } catch (delError) {
          console.warn('Gagal menghapus orphan auth user:', delError);
        }
      }
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Ganti peran aktif (Sprint 3 - Dual Role)
  const switchRole = async (newRole: Role) => {
    if (!profile || !user) {
      throw new Error('Pengguna belum login.');
    }
    if (!profile.roles.includes(newRole)) {
      throw new Error('Peran tidak tersedia untuk akun ini.');
    }
    if (profile.role === newRole) {
      return;
    }
    setLoading(true);
    try {
      const userDocRef = doc(db, 'users', profile.uid);
      await updateDoc(userDocRef, {
        role: newRole,
      });
      setProfile((prev) => (prev ? { ...prev, role: newRole } : null));
    } finally {
      setLoading(false);
    }
  };

  // Tambah peran baru ke akun (Sprint 3 - Dual Role)
  const addRole = async (newRole: Role, extraNim?: string) => {
    if (!profile || !user) {
      throw new Error('Pengguna belum login.');
    }
    if (profile.roles.includes(newRole)) {
      throw new Error('Peran sudah dimiliki akun ini.');
    }

    const updatePayload: Record<string, any> = {
      roles: arrayUnion(newRole),
    };

    if (newRole === 'praktikan') {
      const finalNim = extraNim?.trim() || profile.nim?.trim();
      if (!finalNim) {
        throw new Error('NIM wajib diisi untuk peran praktikan.');
      }
      const nimErr = validateNim(finalNim);
      if (nimErr) {
        throw new Error(nimErr);
      }
      updatePayload.nim = finalNim;
    }

    setLoading(true);
    try {
      const userDocRef = doc(db, 'users', profile.uid);
      await updateDoc(userDocRef, updatePayload);
      await refreshProfile();
    } finally {
      setLoading(false);
    }
  };

  // Alur Logout (SRS-02)
  const logout = async () => {
    setLoading(true);
    try {
      await signOut(auth);
      setUser(null);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  // Refresh data profil
  const refreshProfile = async () => {
    if (user) {
      await fetchUserProfile(user.uid);
    }
  };

  const value: AuthContextValue = {
    user,
    profile,
    loading,
    login,
    register,
    logout,
    refreshProfile,
    switchRole,
    addRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth harus digunakan di dalam AuthProvider');
  }
  return context;
};

export default AuthContext;
