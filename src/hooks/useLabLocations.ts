import { useState, useEffect, useCallback } from 'react';
import { LabLocation } from '../types/models';
import {
  listenLabLocations,
  seedLabLocationsIfEmpty,
} from '../services/labLocationService';
import { PREDEFINED_LABS } from '../data/labLocations';

const OFFICIAL_LAB_IDS = new Set(PREDEFINED_LABS.map((l) => l.id));

const buildFallbackLabs = (): LabLocation[] =>
  PREDEFINED_LABS.map((s) => ({
    ...s,
    createdBy: 'official_seed',
    updatedAt: null,
  }));

export function useLabLocations() {
  const [labs, setLabs] = useState<LabLocation[]>(buildFallbackLabs());
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    // Pastikan 4 lab resmi (Lab B, Lab C, Lab D, Lab AP) tersedia dengan koordinat & radius 150m
    seedLabLocationsIfEmpty().catch(() => {});

    const unsubscribe = listenLabLocations(
      (updatedLabs) => {
        if (!isMounted) return;
        const officialLabs = updatedLabs.filter((l) => OFFICIAL_LAB_IDS.has(l.id));
        if (officialLabs.length === 0) {
          setLabs(buildFallbackLabs());
        } else {
          setLabs(officialLabs);
        }
        setLoading(false);
        setError(null);
      },
      (err) => {
        if (!isMounted) return;
        console.warn('listenLabLocations error, using fallback:', err);
        setLabs(buildFallbackLabs());
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
