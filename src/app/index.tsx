import React from 'react';
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
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { OfflineBanner } from '../components/OfflineBanner';

export default function Index() {
  const router = useRouter();
  const { profile, loading, logout } = useAuth();

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
      <StatusBar style="dark" />
      <OfflineBanner />
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header & profil pengguna */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.appName}>Lab Attendance App</Text>
              <Text style={styles.sprintBadge}>Sprint 2 • Auth & Security</Text>
            </View>
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={logout}
              activeOpacity={0.8}
            >
              <Text style={styles.logoutButtonText}>Keluar</Text>
            </TouchableOpacity>
          </View>

          {/* Kartu sambutan pengguna */}
          <View style={styles.welcomeCard}>
            <Text style={styles.welcomeGreet}>
              Halo, {profile.name}! 👋
            </Text>
            <Text style={styles.welcomeRole}>
              {profile.role === 'praktikan'
                ? `Mahasiswa Praktikan${profile.nim ? ` • NIM ${profile.nim}` : ''}`
                : 'Asisten Laboratorium'}
            </Text>
            <Text style={styles.welcomeEmail}>{profile.email}</Text>
          </View>
        </View>

        {/* Developer 3 Feature Card */}
        <View style={styles.card}>
          <View style={styles.badgeDev}>
            <Text style={styles.badgeDevText}>DEVELOPER 3</Text>
          </View>
          <Text style={styles.cardTitle}>
            Presensi Praktikan, Anti-Double Submit &amp; Modal Feedback
          </Text>
          <Text style={styles.cardDesc}>
            Fitur portal untuk Mahasiswa Praktikan dalam melakukan presensi
            kehadiran: proteksi status sesi (gating), pemilihan status
            kehadiran, catatan nomor meja lab, modal umpan balik sukses
            beranimasi, pencegahan presensi ganda (anti-double attendance), serta
            kartu bukti riwayat kehadiran mandiri.
          </Text>

          {/* Quick Demo Navigation Buttons */}
          <View style={styles.buttonStack}>
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
                ✍️ Masuk Presensi Praktikan (BERJALAN)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.warningButton}
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
                    status: 'BELUM_DIBUKA',
                  },
                })
              }
              activeOpacity={0.8}
            >
              <Text style={styles.warningButtonText}>
                ⏳ Uji Gating: Sesi BELUM DIBUKA
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.dangerButton}
              onPress={() =>
                router.push({
                  pathname: '/student-attendance',
                  params: {
                    id: 'ses-2',
                    courseTitle: 'Jaringan Komputer',
                    moduleName: 'Modul 2: Routing Dinamis',
                    classGroup: 'Kelas B',
                    roomName: 'Lab Jaringan',
                    timeSlot: 'Sabtu, 08:00 - 10:30 WIB',
                    status: 'SELESAI',
                  },
                })
              }
              activeOpacity={0.8}
            >
              <Text style={styles.dangerButtonText}>
                🔒 Uji Gating: Sesi SELESAI / Ditutup
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Acceptance Criteria Checklist */}
        <View style={styles.criteriaCard}>
          <Text style={styles.criteriaTitle}>
            Fitur Developer 3 (Kriteria Keberterimaan Selesai):
          </Text>
          {[
            '✅ Form presensi terkunci jika status sesi adalah BELUM_DIBUKA atau SELESAI (Form Gating).',
            '✅ Mahasiswa dapat memilih status (Hadir, Izin, Sakit) dengan styling warna aktif dinamis.',
            '✅ Input catatan tambahan opsional (Nomor Meja Lab: PC-04).',
            '✅ Waktu kehadiran tercatat secara otomatis real-time (Jam lokal sistem WIB).',
            '✅ Modal pop-up sukses (AttendanceFeedbackModal) dengan ikon centang hijau & ringkasan kehadiran.',
            '✅ Anti-double attendance: setelah submit, form langsung terkunci & digantikan dengan kartu bukti kehadiran (StudentHistoryCard).',
            '✅ Tombol switch simulasi status sesi di bagian atas layar untuk kemudahan demo.',
          ].map((item, idx) => (
            <Text key={idx} style={styles.criteriaItem}>
              {item}
            </Text>
          ))}
        </View>
      </ScrollView>
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
  // ── Sudah login ──
  container: {
    padding: 18,
    alignItems: 'center',
    paddingBottom: 32,
  },
  header: {
    width: '100%',
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  appName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  sprintBadge: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '600',
  },
  logoutButton: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  logoutButtonText: {
    color: '#B91C1C',
    fontSize: 13,
    fontWeight: '700',
  },
  welcomeCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#BFDBFE',
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
