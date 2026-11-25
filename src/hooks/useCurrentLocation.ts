import { useState, useEffect, useCallback, useRef } from 'react';
import * as Location from 'expo-location';
import { LocationResult } from '../services/locationService';

export type PermissionStatusType =
  | 'granted'
  | 'denied'
  | 'undetermined'
  | 'loading';

export function useCurrentLocation(autoStart: boolean = true) {
  const [location, setLocation] = useState<LocationResult | null>(null);
  const [watching, setWatching] = useState<boolean>(false);
  const [permissionStatus, setPermissionStatus] =
    useState<PermissionStatusType>('loading');
  const [triggerRefresh, setTriggerRefresh] = useState<number>(0);

  const subscriptionRef = useRef<Location.LocationSubscription | null>(null);

  const stopWatching = useCallback(() => {
    if (subscriptionRef.current) {
      subscriptionRef.current.remove();
      subscriptionRef.current = null;
    }
    setWatching(false);
  }, []);

  const refreshLocation = useCallback(() => {
    setTriggerRefresh((prev) => prev + 1);
  }, []);

  useEffect(() => {
    let isMounted = true;
    let localSubscription: Location.LocationSubscription | null = null;

    if (!autoStart && triggerRefresh === 0) {
      return;
    }

    const initWatch = async () => {
      try {
        // 1. Izin lokasi foreground
        const permission = await Location.requestForegroundPermissionsAsync();
        if (!isMounted) return;

        if (permission.status !== 'granted') {
          setPermissionStatus('denied');
          setLocation({
            coords: null,
            error: 'DENIED',
            errorMessage:
              'Akses lokasi diperlukan untuk presensi. Aktifkan di pengaturan.',
          });
          setWatching(false);
          return;
        }

        setPermissionStatus('granted');

        // 2. Layanan GPS aktif?
        const servicesEnabled = await Location.hasServicesEnabledAsync();
        if (!isMounted) return;

        if (!servicesEnabled) {
          setLocation({
            coords: null,
            error: 'UNAVAILABLE',
            errorMessage:
              'Layanan lokasi tidak aktif. Nyalakan GPS perangkat Anda.',
          });
          setWatching(false);
          return;
        }

        // 3. Ambil posisi instan awal
        try {
          const initial = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          if (isMounted) {
            setLocation({
              coords: {
                latitude: initial.coords.latitude,
                longitude: initial.coords.longitude,
                accuracy: initial.coords.accuracy ?? null,
              },
              error: null,
            });
          }
        } catch {
          // abaikan error posisi awal jika watchPositionAsync akan menggantikan
        }

        if (!isMounted) return;

        // 4. Langganan perubahan posisi
        if (subscriptionRef.current) {
          subscriptionRef.current.remove();
        }

        localSubscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            distanceInterval: 5,
            timeInterval: 3000,
          },
          (newLoc) => {
            if (isMounted) {
              setLocation({
                coords: {
                  latitude: newLoc.coords.latitude,
                  longitude: newLoc.coords.longitude,
                  accuracy: newLoc.coords.accuracy ?? null,
                },
                error: null,
              });
            }
          }
        );

        if (isMounted) {
          subscriptionRef.current = localSubscription;
          setWatching(true);
        } else {
          localSubscription.remove();
        }
      } catch (err: any) {
        if (isMounted) {
          console.warn('watchPositionAsync error:', err);
          setLocation({
            coords: null,
            error: 'UNAVAILABLE',
            errorMessage:
              'Lokasi belum tersedia. Pindah ke tempat dengan sinyal GPS lebih baik.',
          });
          setWatching(false);
        }
      }
    };

    void initWatch();

    return () => {
      isMounted = false;
      if (localSubscription) {
        localSubscription.remove();
      }
      if (subscriptionRef.current) {
        subscriptionRef.current.remove();
        subscriptionRef.current = null;
      }
      setWatching(false);
    };
  }, [autoStart, triggerRefresh]);

  const startWatching = useCallback(() => {
    setTriggerRefresh((prev) => prev + 1);
  }, []);

  return {
    location,
    watching,
    permissionStatus,
    startWatching,
    stopWatching,
    refreshLocation,
  };
}

export default useCurrentLocation;
