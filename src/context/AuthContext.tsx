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
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { Role, UserProfile } from '../types/models';

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
        const userProfile: UserProfile = {
          uid: data.uid || uid,
          name: data.name || '',
          email: data.email || '',
          role: data.role as Role,
          nim: data.nim ?? null,
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
        nim: role === 'praktikan' ? (nim ? nim.trim() : null) : null,
        createdAt: serverTimestamp(),
      };

      await setDoc(doc(db, 'users', createdAuthUser.uid), userProfileData);

      // Set profile lokal sementara menunggu snapshot
      setProfile({
        ...userProfileData,
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
