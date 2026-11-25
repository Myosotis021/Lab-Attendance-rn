import { useEffect, useState, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import useAuth from './useAuth';
import {
  registerForPushNotifications,
  setupNotifications,
} from '../services/notificationService';

export function useNotificationSetup() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const [permissionDenied, setPermissionDenied] = useState<boolean>(false);
  const [dismissed, setDismissed] = useState<boolean>(false);

  const notificationListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function init() {
      await setupNotifications();

      const currentUid = profile?.uid || user?.uid;
      if (currentUid) {
        const token = await registerForPushNotifications(currentUid);
        if (!token && isMounted) {
          setPermissionDenied(true);
        } else if (isMounted) {
          setPermissionDenied(false);
        }
      }
    }

    init();

    // Listener saat notifikasi diterima (foreground)
    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        // Notifikasi diterima di foreground
        console.log('Notifikasi diterima:', notification.request.content.title);
      });

    // Listener saat pengguna menekan notifikasi (deep link navigasi)
    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data;
        if (data?.type === 'SESSION_OPENED' && data?.sessionId) {
          router.push({
            pathname: '/attendance',
            params: { sessionId: String(data.sessionId), id: String(data.sessionId) },
          } as any);
        } else if (data?.type === 'LEAVE_DECISION') {
          router.push('/my-leave-requests' as any);
        }
      });

    return () => {
      isMounted = false;
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, [user?.uid, profile?.uid, router]);

  return {
    permissionDenied: permissionDenied && !dismissed,
    dismissBanner: () => setDismissed(true),
  };
}

export default useNotificationSetup;
