import { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from '../services/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { UserProfile } from '../types/models';

// Default mock profiles for Sprint 1 / Sprint 2 demo
export const DEMO_PROFILES: Record<'praktikan' | 'asisten', UserProfile> = {
  praktikan: {
    uid: 'student-220101001',
    name: 'Ahmad Fauzi',
    nim: '220101001',
    role: 'praktikan',
    classId: 'class-ti-01',
  },
  asisten: {
    uid: 'assistant-ast01',
    name: 'Kak Budi Santoso',
    identifier: 'AST-01',
    role: 'asisten',
    classId: 'class-ti-01',
  },
};

export function useAuth(defaultRole: 'praktikan' | 'asisten' = 'praktikan') {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile>(DEMO_PROFILES[defaultRole]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;

    const unsubscribe = onAuthStateChanged(
      auth,
      async (firebaseUser) => {
        if (!isMounted) return;

        if (firebaseUser) {
          setUser(firebaseUser);
          try {
            const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
            if (userDoc.exists() && isMounted) {
              const data = userDoc.data();
              setProfile({
                uid: firebaseUser.uid,
                name: data.name || firebaseUser.displayName || 'Pengguna',
                nim: data.nim || '',
                identifier: data.identifier || '',
                role: data.role || defaultRole,
                classId: data.classId || 'class-ti-01',
              });
            } else if (isMounted) {
              setProfile({
                uid: firebaseUser.uid,
                name: firebaseUser.displayName || DEMO_PROFILES[defaultRole].name,
                nim: DEMO_PROFILES[defaultRole].nim,
                role: defaultRole,
                classId: 'class-ti-01',
              });
            }
          } catch {
            if (isMounted) {
              setProfile({
                ...DEMO_PROFILES[defaultRole],
                uid: firebaseUser.uid,
              });
            }
          }
        } else {
          setUser(null);
          setProfile(DEMO_PROFILES[defaultRole]);
        }
        setLoading(false);
      },
      () => {
        if (isMounted) {
          setLoading(false);
        }
      }
    );

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [defaultRole]);

  return { user, profile, loading, setProfile };
}

export default useAuth;
