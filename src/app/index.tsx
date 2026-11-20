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
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { OfflineBanner } from '../components/OfflineBanner';
import { ScheduleListScreen } from '../screens/ScheduleListScreen';
import { RoleType, SessionItem } from '../types/models';
import { theme } from '../theme';

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
      <LinearGradient
        colors={theme.colors.backgroundGradient}
        style={styles.flexOne}
      >
        <SafeAreaView style={styles.loadingContainer} edges={['top', 'bottom']}>
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color={theme.colors.textPrimary} />
            <Text style={styles.loadingText}>Memuat sistem...</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  // ── Belum login ─────────────────────────────────────────────────
  if (!profile) {
    return (
      <LinearGradient
        colors={theme.colors.backgroundGradient}
        style={styles.flexOne}
      >
        <SafeAreaView style={styles.flexOne} edges={['top', 'bottom']}>
          <Stack.Screen options={{ headerShown: false }} />
          <StatusBar style="dark" />
          <OfflineBanner />
          <ScrollView
            contentContainerStyle={styles.authContainer}
            showsVerticalScrollIndicator={false}
          >
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
                activeOpacity={0.85}
              >
                <Feather name="log-in" size={17} color="#FFFFFF" style={styles.buttonIcon} />
                <Text style={styles.loginButtonText}>Masuk ke Akun</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.registerButton}
                onPress={() => router.push('/register' as any)}
                activeOpacity={0.85}
              >
                <Feather name="user-plus" size={16} color={theme.colors.textPrimary} style={styles.buttonIcon} />
                <Text style={styles.registerButtonText}>Daftar Akun Baru</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
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
  flexOne: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingCard: {
    backgroundColor: theme.colors.surface,
    padding: 24,
    borderRadius: theme.borderRadius.xl,
    alignItems: 'center',
    gap: 12,
    ...theme.shadows.card,
  },
  loadingText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
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
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    ...theme.shadows.card,
  },
  logoEmoji: {
    fontSize: 36,
  },
  appName: {
    fontSize: 24,
    fontWeight: '800',
    color: theme.colors.textPrimary,
    letterSpacing: -0.5,
  },
  appTagline: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
  authCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xxl,
    padding: 24,
    ...theme.shadows.card,
  },
  authCardTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: theme.colors.textPrimary,
    marginBottom: 6,
  },
  authCardDesc: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    lineHeight: 19,
    marginBottom: 24,
  },
  loginButton: {
    backgroundColor: theme.colors.textPrimary,
    paddingVertical: 14,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginBottom: 10,
    ...theme.shadows.subtle,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  registerButton: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingVertical: 14,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  registerButtonText: {
    color: theme.colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  buttonIcon: {
    marginRight: 8,
  },
});
