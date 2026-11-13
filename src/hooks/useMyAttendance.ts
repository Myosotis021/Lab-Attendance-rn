import { useState, useEffect } from 'react';
import { AttendanceRecord } from '../types/models';
import { listenMyAttendance } from '../services/attendanceService';
import { getErrorMessage } from '../utils/getErrorMessage';

export function useMyAttendance(uid?: string) {
  const [myAttendanceList, setMyAttendanceList] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(Boolean(uid));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!uid) {
      return;
    }

    const unsubscribe = listenMyAttendance(
      uid,
      (records) => {
        setMyAttendanceList(records);
        setLoading(false);
      },
      (err) => {
        setError(getErrorMessage(err));
        setLoading(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [uid]);

  return {
    myAttendanceList,
    loading: uid ? loading : false,
    error,
  };
}

export default useMyAttendance;
