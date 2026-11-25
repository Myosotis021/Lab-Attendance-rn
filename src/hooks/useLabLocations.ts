import { useState, useEffect, useCallback } from 'react';
import { LabLocation } from '../types/models';
import {
  listenLabLocations,
  seedLabLocationsIfEmpty,
} from '../services/labLocationService';
import { LAB_LOCATIONS_SEED } from '../data/labLocations';

export function useLabLocations() {
  const [labs, setLabs] = useState<LabLocation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    // Pastikan jika koleksi kosong di Firestore, kita seed data awal
    seedLabLocationsIfEmpty().catch(() => {});

    const unsubscribe = listenLabLocations(
      (updatedLabs) => {
        if (!isMounted) return;
        if (updatedLabs.length === 0) {
          // Fallback lokal sementara jika Firestore belum terisi
          setLabs(
            LAB_LOCATIONS_SEED.map((s) => ({
              ...s,
              createdBy: 'seed',
              updatedAt: null,
            }))
          );
        } else {
          setLabs(updatedLabs);
        }
        setLoading(false);
        setError(null);
      },
      (err) => {
        if (!isMounted) return;
        console.warn('listenLabLocations error, using fallback:', err);
        setLabs(
          LAB_LOCATIONS_SEED.map((s) => ({
            ...s,
            createdBy: 'seed',
            updatedAt: null,
          }))
        );
        setLoading(false);
      }
    );

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const refresh = useCallback(() => {
    setLoading(true);
  }, []);

  return {
    labs,
    loading,
    error,
    refresh,
  };
}

export default useLabLocations;
