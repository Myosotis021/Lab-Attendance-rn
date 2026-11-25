import { useState, useEffect, useCallback, useRef } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  getDocs,
} from 'firebase/firestore';
import { db } from '../services/firebase';
import { SessionItem } from '../types/models';
import { useAuth } from './useAuth';
import { getErrorMessage } from '../utils/getErrorMessage';
import {
  mapSessionDocToItem,
  migrateLegacySessionTimesToDefault,
} from '../services/sessionService';

export function useSessions() {
  const { profile } = useAuth();
  const role = profile?.role;
  const uid = profile?.uid;

  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const migratedRef = useRef<boolean>(false);

  useEffect(() => {
    if (role === 'asisten' && !migratedRef.current) {
      migratedRef.current = true;
      void migrateLegacySessionTimesToDefault();
    }
  }, [role]);

  useEffect(() => {
    const sessionsCol = collection(db, 'sessions');
    let q = query(sessionsCol);

    if (role === 'praktikan' && uid) {
      q = query(sessionsCol, where('participantIds', 'array-contains', uid));
    }

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: SessionItem[] = snapshot.docs.map((d) =>
          mapSessionDocToItem(d.id, d.data())
        );

        list.sort((a, b) => {
          const tA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
          const tB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
          return tB - tA;
        });

        setSessions(list);
        setLoading(false);
        setRefreshing(false);
        setError(null);
      },
      (err) => {
        console.error('Error fetching sessions:', err);
        setError(getErrorMessage(err));
        setLoading(false);
        setRefreshing(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [role, uid, refreshKey]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    setError(null);
    try {
      const sessionsCol = collection(db, 'sessions');
      let q = query(sessionsCol);
      if (role === 'praktikan' && uid) {
        q = query(sessionsCol, where('participantIds', 'array-contains', uid));
      }
      const snapshot = await getDocs(q);
      const list: SessionItem[] = snapshot.docs.map((d) =>
        mapSessionDocToItem(d.id, d.data())
      );
      list.sort((a, b) => {
        const tA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
        const tB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
        return tB - tA;
      });
      setSessions(list);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setRefreshing(false);
      setLoading(false);
      setRefreshKey((k) => k + 1);
    }
  }, [role, uid]);

  return {
    sessions,
    loading,
    refreshing,
    error,
    refresh,
  };
}

export default useSessions;
