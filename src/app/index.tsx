import React from 'react';
import {
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Stack, useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { OfflineBanner } from '../components/OfflineBanner';
import { ScheduleListScreen } from '../screens/ScheduleListScreen';
import { RoleType, SessionItem } from '../types/models';

export default function Index() {
  const router = useRouter();
  const { profile, loading } = useAuth();

  const handleSelectSession = (session: SessionItem, role: RoleType) => {
    if (role === 'asisten') {
      router.push({
        pathname: '/assistant-session',
        params: {
          id: session.id,
          courseTitle: session.courseTitle,
          moduleName: session.moduleName,
          classGroup: session.classGroup,
          roomName: session.roomName,
          timeSlot: session.timeSlot,
          status: session.status,
        },
      });
    } else {
      router.push({
        pathname: '/student-attendance',
        params: {
          id: session.id,
          courseTitle: session.courseTitle,
          moduleName: session.moduleName,
          classGroup: session.classGroup,
          roomName: session.roomName,
          timeSlot: session.timeSlot,
          status: session.status,
        },
      });
    }
  };

  // ── Loading splash ──────────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer} edges={['top', 'left', 'right', 'bottom']}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Memuat…</Text>
      </SafeAreaView>
    );
  }

  // ── Belum login ─────────────────────────────────────────────────
  if (!profile) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
        <Stack.Screen options={{ headerShown: false }} />
        <StatusBar style="dark" />
        <OfflineBanner />
        <ScrollView contentContainerStyle={styles.authContainer}>
          <View style={styles.authHeader}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoEmoji}>🔬</Text>
            </View>
            <Text style={styles.appName}>Lab Attendance</Text>
            <Text style={styles.appTagline}>
              Sistem Presensi Praktikum Laboratorium
            </Text>
          </View>

          <View style={styles.authCard}>
            <Text style={styles.authCardTitle}>Selamat Datang!</Text>
            <Text style={styles.authCardDesc}>
              Silakan masuk atau daftar akun baru untuk menggunakan aplikasi
              presensi praktikum.
            </Text>

            <TouchableOpacity
              style={styles.loginButton}
              onPress={() => router.push('/login' as any)}
              activeOpacity={0.8}
            >
              <Text style={styles.loginButtonText}>🔑  Masuk ke Akun</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.registerButton}
              onPress={() => router.push('/register' as any)}
              activeOpacity={0.8}
            >
              <Text style={styles.registerButtonText}>📝  Daftar Akun Baru</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Sudah login ─────────────────────────────────────────────────
  return (
    <View style={styles.flexOne}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="dark" />
      <OfflineBanner />
      <ScheduleListScreen onSelectSession={handleSelectSession} />
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#64748B',
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  flexOne: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  // ── Auth (belum login) ──
  authContainer: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
  },
  authHeader: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#DBEAFE',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  logoEmoji: {
    fontSize: 36,
  },
  appName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
  },
  appTagline: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
  },
  authCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  authCardTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
  },
  authCardDesc: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 20,
    marginBottom: 20,
  },
  loginButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  registerButton: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  registerButtonText: {
    color: '#1E293B',
    fontSize: 15,
    fontWeight: '700',
  },
});
