import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { saveFcmToken, getFcmToken, getFcmTokensForUsers } from './fcmTokenService';

// Konfigurasi handler notifikasi ketika aplikasi sedang di foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Setup channel notifikasi awal untuk Android
 */
export async function setupNotifications(): Promise<void> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Pemberitahuan Presensi Lab',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#2563EB',
      sound: 'default',
    });
  }
}

/**
 * Minta izin dan dapatkan push token pengguna, lalu simpan ke Firestore
 */
export async function registerForPushNotifications(
  uid: string
): Promise<string | null> {
  await setupNotifications();

  let token: string | null = null;

  if (Device.isDevice || Platform.OS === 'android' || Platform.OS === 'ios') {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('Izin push notification ditolak oleh pengguna.');
      return null;
    }

    try {
      const pushTokenData = await Notifications.getExpoPushTokenAsync();
      token = pushTokenData.data;
      if (token && uid) {
        await saveFcmToken(uid, token);
      }
    } catch (error) {
      console.warn('Gagal mendapatkan Expo Push Token:', error);
    }
  }

  return token;
}

/**
 * Kirim notifikasi lokal ke perangkat ini (berguna untuk demo real-time langsung)
 */
export async function sendLocalNotification(
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<void> {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: data || {},
        sound: true,
      },
      trigger: null, // Segera tampilkan
    });
  } catch (error) {
    console.warn('Gagal mengirim local notification:', error);
  }
}

/**
 * Kirim push notification ke pengguna tertentu via Expo Push API
 */
export async function sendPushToUser(
  recipientUid: string,
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<void> {
  // Selalu tampilkan local notification untuk kemudahan demo saat testing
  await sendLocalNotification(title, body, data);

  const token = await getFcmToken(recipientUid);
  if (!token) {
    return;
  }

  try {
    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: token,
        sound: 'default',
        title,
        body,
        data: data || {},
      }),
    });
  } catch (error) {
    console.warn('Gagal mengirim push notification ke user:', recipientUid, error);
  }
}

/**
 * Kirim push notification ke banyak pengguna (batch)
 */
export async function sendPushToUsers(
  recipientUids: string[],
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<void> {
  // Selalu trigger local notification untuk feedback langsung saat demo
  await sendLocalNotification(title, body, data);

  if (!recipientUids || recipientUids.length === 0) return;

  const tokens = await getFcmTokensForUsers(recipientUids);
  if (tokens.length === 0) return;

  const messages = tokens.map((token) => ({
    to: token,
    sound: 'default',
    title,
    body,
    data: data || {},
  }));

  try {
    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messages),
    });
  } catch (error) {
    console.warn('Gagal mengirim batch push notifications:', error);
  }
}
