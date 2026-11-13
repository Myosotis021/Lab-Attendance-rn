import { useState, useEffect, useCallback } from 'react';
import { LeaveRequest } from '../types/models';
import { listenAllLeaveRequests } from '../services/leaveService';
import { getErrorMessage } from '../utils/errors';

export function useAllLeaveRequests() {
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState<number>(0);

  const retry = useCallback(() => {
    setError(null);
    setLoading(true);
    setRetryCount((prev) => prev + 1);
  }, []);

  useEffect(() => {
    const unsubscribe = listenAllLeaveRequests(
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
  }, [retryCount]);

  return { requests, loading, error, retry };
}

export default useAllLeaveRequests;
