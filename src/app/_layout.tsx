import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Stack } from 'expo-router';
import { AuthProvider } from '../context/AuthContext';
import { useNotificationSetup } from '../hooks/useNotificationSetup';

function NotificationBanner() {
  const { permissionDenied, dismissBanner } = useNotificationSetup();
  if (!permissionDenied) return null;
  return (
    <View style={styles.notificationBanner}>
      <Text style={styles.bannerIcon}>🔔</Text>
      <Text style={styles.bannerText}>
        Aktifkan notifikasi untuk mendapatkan pemberitahuan sesi dan izin.
      </Text>
      <TouchableOpacity onPress={dismissBanner} style={styles.dismissBtn}>
        <Text style={styles.dismissText}>✕</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <View style={styles.container}>
        <NotificationBanner />
        <Stack>
          <Stack.Screen name="index" options={{ title: 'Home', headerShown: false }} />
          <Stack.Screen name="about" options={{ title: 'Tentang', headerShown: false }} />
          <Stack.Screen name="login" options={{ title: 'Masuk', headerShown: false }} />
          <Stack.Screen name="register" options={{ title: 'Daftar', headerShown: false }} />
          <Stack.Screen
            name="assistant-session"
            options={{ title: 'Kelola Sesi Asisten', headerShown: false }}
          />
          <Stack.Screen
            name="student-attendance"
            options={{ title: 'Presensi Praktikan', headerShown: false }}
          />
          <Stack.Screen
            name="class-management"
            options={{ title: 'Kelola Kelas', headerShown: false }}
          />
          <Stack.Screen
            name="session-management"
            options={{ title: 'Kelola Jadwal & Sesi', headerShown: false }}
          />
          <Stack.Screen
            name="leave-request-form"
            options={{ title: 'Pengajuan Izin', headerShown: false }}
          />
          <Stack.Screen
            name="my-leave-requests"
            options={{ title: 'Daftar Izin Saya', headerShown: false }}
          />
          <Stack.Screen
            name="assistant-leave-review"
            options={{ title: 'Review Izin Praktikan', headerShown: false }}
          />
          <Stack.Screen
            name="role-management"
            options={{ title: 'Kelola Peran', headerShown: false }}
          />
          <Stack.Screen
            name="session-leave-request"
            options={{ title: 'Pengajuan Izin Sesi', headerShown: false }}
          />
          <Stack.Screen
            name="lab-map"
            options={{ title: 'Peta Laboratorium', headerShown: false }}
          />
          <Stack.Screen
            name="attendance"
            options={{ title: 'Presensi Laboratorium', headerShown: false }}
          />
        </Stack>
      </View>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  notificationBanner: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 8,
    margin: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 999,
  },
  bannerIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  bannerText: {
    color: '#D97706',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  dismissBtn: {
    padding: 4,
    marginLeft: 6,
  },
  dismissText: {
    color: '#D97706',
    fontSize: 14,
    fontWeight: '700',
  },
});
