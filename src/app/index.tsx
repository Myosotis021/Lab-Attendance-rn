import React, { useState } from 'react';
import {
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Stack, useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { OfflineBanner } from '../components/OfflineBanner';
import { ScheduleListScreen } from '../screens/ScheduleListScreen';
import { RoleType, SessionItem } from '../types/models';

export default function Index() {
  const router = useRouter();
  const { profile, loading, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'jadwal' | 'demo'>('jadwal');

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
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Memuat…</Text>
      </SafeAreaView>
    );
  }

  // ── Belum login ─────────────────────────────────────────────────
  if (!profile) {
    return (
      <SafeAreaView style={styles.safeArea}>
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
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="dark" />
      <OfflineBanner />

      {/* Header bar atas pengguna */}
      <View style={styles.topBar}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.appName}>Lab Attendance</Text>
            <Text style={styles.userSubtitle}>
              {profile.name} • {profile.role === 'asisten' ? 'Asisten Lab' : 'Praktikan'}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={logout}
            activeOpacity={0.8}
          >
            <Text style={styles.logoutButtonText}>Keluar</Text>
          </TouchableOpacity>
        </View>

        {/* Tab switcher: Jadwal vs Demo Fitur */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'jadwal' && styles.tabButtonActive]}
            onPress={() => setActiveTab('jadwal')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.tabButtonText,
                activeTab === 'jadwal' && styles.tabButtonTextActive,
              ]}
            >
              📅 Jadwal Praktikum
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'demo' && styles.tabButtonActive]}
            onPress={() => setActiveTab('demo')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.tabButtonText,
                activeTab === 'demo' && styles.tabButtonTextActive,
              ]}
            >
              🚀 Pintasan &amp; Demo
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Konten Tab */}
      {activeTab === 'jadwal' ? (
        <View style={styles.flexOne}>
          <ScheduleListScreen
            onSelectSession={handleSelectSession}
          />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.container}>
          {/* Kartu Profil Sambutan Pengguna */}
          <View style={styles.welcomeCard}>
            <Text style={styles.welcomeGreet}>Halo, {profile.name}! 👋</Text>
            <Text style={styles.welcomeRole}>
              {profile.role === 'praktikan'
                ? `Mahasiswa Praktikan${profile.nim ? ` • NIM ${profile.nim}` : ''}`
                : 'Asisten Laboratorium'}
            </Text>
            <Text style={styles.welcomeEmail}>{profile.email}</Text>
          </View>

          {/* Quick Actions Card per Peran */}
          <View style={styles.card}>
            <View style={styles.badgeDev}>
              <Text style={styles.badgeDevText}>
                {profile.role === 'asisten' ? 'MENU ASISTEN LAB' : 'MENU MAHASISWA PRAKTIKAN'}
              </Text>
            </View>
            <Text style={styles.cardTitle}>
              {profile.role === 'asisten'
                ? 'Kelola Data Praktikum & Izin'
                : 'Layanan Presensi & Perizinan'}
            </Text>
            <Text style={styles.cardDesc}>
              {profile.role === 'asisten'
                ? 'Pintasan navigasi cepat untuk asisten lab dalam mengelola kelas, sesi praktikum, serta memeriksa permohonan izin praktikan beranalisis sentimen AI.'
                : 'Pintasan navigasi cepat untuk mahasiswa praktikan dalam mengisi presensi sesi berjalan, mengajukan izin berhalangan hadir, dan memantau status secara real-time.'}
            </Text>

            {/* Quick Demo Navigation Buttons */}
            <View style={styles.buttonStack}>
              {profile.role === 'asisten' ? (
                <>
                  <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={() => router.push('/class-management' as any)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.primaryButtonText}>
                      📚 Kelola Kelas &amp; Sinkronisasi Peserta
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={() => router.push('/session-management' as any)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.primaryButtonText}>
                      🗓️ Kelola Jadwal &amp; Sesi Praktikum
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={() => router.push('/assistant-leave-review' as any)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.primaryButtonText}>
                      📋 Review Izin Praktikan &amp; Sentimen AI
                    </Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={() => router.push('/leave-request-form' as any)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.primaryButtonText}>
                      ✉️ Ajukan Permohonan Izin (AI Sentiment)
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={() => router.push('/my-leave-requests' as any)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.primaryButtonText}>
                      📋 Pantau Status Izin Saya (Real-time)
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={() =>
                      router.push({
                        pathname: '/student-attendance',
                        params: {
                          id: 'ses-1',
                          courseTitle: 'Pemrograman Perangkat Komputasi',
                          moduleName: 'Modul 1: Antarmuka & Alur Praktikum',
                          classGroup: 'Kelas A',
                          roomName: 'Lab Komputer 2',
                          timeSlot: 'Jumat, 13:00 - 15:30 WIB',
                          status: 'BERJALAN',
                        },
                      })
                    }
                    activeOpacity={0.8}
                  >
                    <Text style={styles.primaryButtonText}>
                      ✍️ Presensi Praktikan (Simulasi Sesi BERJALAN)
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>

          {/* Acceptance Criteria Checklist */}
          <View style={styles.criteriaCard}>
            <Text style={styles.criteriaTitle}>
              Cakupan Fitur Terintegrasi Sprint 2 (3 Modul):
            </Text>
            {[
              '✅ Modul 1 (Dev 1): Firebase Auth, Profil Firestore, Validasi Input, Error Bahasa Indonesia, dan Security Rules.',
              '✅ Modul 2 (Dev 2): CRUD Kelas (Batch sync peserta ke sesi), CRUD Sesi, Transaksi Buka/Tutup Sesi, Presensi Anti-Double, Rekapitulasi Real-time.',
              '✅ Modul 3 (Dev 3): Pengajuan Izin Sesi Belum Dibuka, Klasifikasi Sentimen AI Lokal (Offline TF-IDF EDOM), Pemantauan Real-time, dan Keputusan Asisten.',
              '✅ Route Guard: Pembatasan akses layar antar-peran (Asisten vs Praktikan).',
            ].map((item, idx) => (
              <Text key={idx} style={styles.criteriaItem}>
                {item}
              </Text>
            ))}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
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
    fontSize: 20,
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
  // ── TopBar (sudah login) ──
  topBar: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  userSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },
  logoutButton: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  logoutButtonText: {
    color: '#B91C1C',
    fontSize: 12,
    fontWeight: '700',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    padding: 3,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center',
    borderRadius: 6,
  },
  tabButtonActive: {
    backgroundColor: '#FFFFFF',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  tabButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  tabButtonTextActive: {
    color: '#2563EB',
    fontWeight: '700',
  },
  // ── Konten Demo (sudah login) ──
  container: {
    padding: 18,
    alignItems: 'center',
    paddingBottom: 32,
  },
  welcomeCard: {
    width: '100%',
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    marginBottom: 16,
  },
  welcomeGreet: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E3A8A',
    marginBottom: 2,
  },
  welcomeRole: {
    fontSize: 13,
    color: '#1D4ED8',
    fontWeight: '600',
    marginBottom: 2,
  },
  welcomeEmail: {
    fontSize: 12,
    color: '#3B82F6',
  },
  card: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  badgeDev: {
    backgroundColor: '#DCFCE7',
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  badgeDevText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#15803D',
    letterSpacing: 0.5,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
  },
  cardDesc: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 19,
    marginBottom: 18,
  },
  buttonStack: {
    gap: 10,
  },
  primaryButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  warningButton: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  warningButtonText: {
    color: '#B45309',
    fontSize: 13,
    fontWeight: '700',
  },
  dangerButton: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  dangerButtonText: {
    color: '#B91C1C',
    fontSize: 13,
    fontWeight: '700',
  },
  criteriaCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  criteriaTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 10,
  },
  criteriaItem: {
    fontSize: 13,
    color: '#334155',
    marginBottom: 8,
    lineHeight: 19,
  },
});
