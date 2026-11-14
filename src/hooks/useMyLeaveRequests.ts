import { useState, useEffect, useCallback } from 'react';
import { LeaveRequest } from '../types/models';
import { listenMyLeaveRequests } from '../services/leaveService';
import { getErrorMessage } from '../utils/errors';

export function useMyLeaveRequests(uid: string | undefined) {
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(Boolean(uid));
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState<number>(0);

  const retry = useCallback(() => {
    setError(null);
    setLoading(true);
    setRetryCount((prev) => prev + 1);
  }, []);

  useEffect(() => {
    if (!uid) {
      return;
    }

    const unsubscribe = listenMyLeaveRequests(
      uid,
      (items) => {
        setRequests(items);
        setLoading(false);
        setError(null);
      },
      (err) => {
        setError(getErrorMessage(err));
        setLoading(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [uid, retryCount]);

  return { requests, loading, error, retry };
}

export default useMyLeaveRequests;
