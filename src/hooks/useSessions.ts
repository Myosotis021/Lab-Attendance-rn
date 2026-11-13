import { useState, useEffect } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../services/firebase';
import { SessionItem } from '../types/models';
import { useAuth } from './useAuth';
import { getErrorMessage } from '../utils/getErrorMessage';

export function useSessions() {
  const { profile } = useAuth();
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const sessionsCol = collection(db, 'sessions');
    let q = query(sessionsCol);

    if (profile?.role === 'praktikan') {
      // Praktikan hanya melihat sesi yang menyertakan dirinya
      q = query(sessionsCol, where('participantIds', 'array-contains', profile.uid));
    }

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: SessionItem[] = snapshot.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            classId: data.classId || '',
            courseTitle: data.courseTitle || '',
            moduleName: data.moduleName || '',
            classGroup: data.classGroup || '',
            roomName: data.roomName || '',
            timeSlot: data.timeSlot || '',
            status: data.status || 'BELUM_DIBUKA',
            participantIds: Array.isArray(data.participantIds) ? data.participantIds : [],
            createdBy: data.createdBy || '',
            createdAt: data.createdAt || Timestamp.now(),
          };
        });

        // Urutkan berdasarkan waktu buat / judul
        list.sort((a, b) => {
          const tA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
          const tB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
          return tB - tA;
        });

        setSessions(list);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching sessions:', err);
        setError(getErrorMessage(err));
        setLoading(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [profile?.role, profile?.uid]);

  return {
    sessions,
    loading,
    error,
  };
}

export default useSessions;
