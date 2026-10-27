import React from 'react';
import {
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';

export default function Index() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.appName}>Lab Attendance App</Text>
          <Text style={styles.sprintBadge}>Sprint 1 • React Native (Android)</Text>
        </View>

        {/* Developer 3 Feature Card */}
        <View style={styles.card}>
          <View style={styles.badgeDev}>
            <Text style={styles.badgeDevText}>DEVELOPER 3</Text>
          </View>
          <Text style={styles.cardTitle}>
            Presensi Praktikan, Anti-Double Submit & Modal Feedback
          </Text>
          <Text style={styles.cardDesc}>
            Fitur portal untuk Mahasiswa Praktikan dalam melakukan presensi kehadiran: proteksi status sesi (gating), pemilihan status kehadiran, catatan nomor meja lab, modal umpan balik sukses beranimasi, pencegahan presensi ganda (anti-double attendance), serta kartu bukti riwayat kehadiran mandiri.
          </Text>

          {/* Quick Demo Navigation Buttons */}
          <View style={styles.buttonStack}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => {
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
                });
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.primaryButtonText}>
                ✍️ Masuk Presensi Praktikan (BERJALAN)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.warningButton}
              onPress={() => {
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
                });
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.warningButtonText}>
                ⏳ Uji Gating: Sesi BELUM DIBUKA
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.dangerButton}
              onPress={() => {
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
                });
              }}
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
          <Text style={styles.criteriaItem}>
            ✅ Form presensi terkunci jika status sesi adalah BELUM_DIBUKA atau SELESAI (Form Gating).
          </Text>
          <Text style={styles.criteriaItem}>
            ✅ Mahasiswa dapat memilih status (Hadir, Izin, Sakit) dengan styling warna aktif dinamis.
          </Text>
          <Text style={styles.criteriaItem}>
            ✅ Input catatan tambahan opsional (Nomor Meja Lab: PC-04).
          </Text>
          <Text style={styles.criteriaItem}>
            ✅ Waktu kehadiran tercatat secara otomatis real-time (Jam lokal sistem WIB).
          </Text>
          <Text style={styles.criteriaItem}>
            ✅ Modal pop-up sukses (AttendanceFeedbackModal) dengan ikon centang hijau & ringkasan kehadiran.
          </Text>
          <Text style={styles.criteriaItem}>
            ✅ Anti-double attendance: setelah submit, form langsung terkunci & digantikan dengan kartu bukti kehadiran (StudentHistoryCard).
          </Text>
          <Text style={styles.criteriaItem}>
            ✅ Tombol switch simulasi status sesi di bagian atas layar untuk kemudahan demo.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  container: {
    padding: 18,
    alignItems: 'center',
    paddingBottom: 32,
  },
  header: {
    alignItems: 'center',
    marginVertical: 14,
  },
  appName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
  },
  sprintBadge: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
    fontWeight: '600',
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
