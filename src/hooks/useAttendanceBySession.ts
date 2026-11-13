import { useState, useEffect } from 'react';
import { AttendanceRecord } from '../types/models';
import { listenAttendanceBySession } from '../services/attendanceService';
import { getErrorMessage } from '../utils/getErrorMessage';

export function useAttendanceBySession(sessionId?: string) {
  const [attendanceList, setAttendanceList] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(Boolean(sessionId));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) {
      return;
    }

    const unsubscribe = listenAttendanceBySession(
      sessionId,
      (records) => {
        setAttendanceList(records);
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
  }, [sessionId]);

  return {
    attendanceList,
    loading: sessionId ? loading : false,
    error,
  };
}

export default useAttendanceBySession;
