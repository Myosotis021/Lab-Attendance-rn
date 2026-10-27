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
        <View style={styles.header}>
          <Text style={styles.appName}>Lab Attendance App</Text>
          <Text style={styles.sprintBadge}>Sprint 1 • React Native</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.badgeDev}>
            <Text style={styles.badgeDevText}>DEVELOPER 2</Text>
          </View>
          <Text style={styles.cardTitle}>
            Pengelolaan Sesi Asisten & Rekap Kehadiran
          </Text>
          <Text style={styles.cardDesc}>
            Fitur untuk Asisten Laboratorium: membuka dan menutup sesi praktikum dengan modal konfirmasi, melihat badge status dinamis, serta memantau rekapitulasi kehadiran mahasiswa.
          </Text>

          <View style={styles.buttonStack}>
            {/* Direct navigation with default session (BELUM_DIBUKA) */}
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => {
                router.push({
                  pathname: '/assistant-session',
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
              <Text style={styles.primaryButtonText}>
                🚀 Kelola Sesi 1 (BELUM DIBUKA)
              </Text>
            </TouchableOpacity>

            {/* Direct navigation with active session (BERJALAN) */}
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => {
                router.push({
                  pathname: '/assistant-session',
                  params: {
                    id: 'ses-2',
                    courseTitle: 'Jaringan Komputer',
                    moduleName: 'Modul 2: Routing Dinamis',
                    classGroup: 'Kelas B',
                    roomName: 'Lab Jaringan',
                    timeSlot: 'Sabtu, 08:00 - 10:30 WIB',
                    status: 'BERJALAN',
                  },
                });
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.secondaryButtonText}>
                ⚡ Kelola Sesi 2 (SEDANG BERJALAN)
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.criteriaCard}>
          <Text style={styles.criteriaTitle}>Fitur Selesai (Developer 2):</Text>
          <Text style={styles.criteriaItem}>
            ✅ Tombol Buka Sesi (aktif saat BELUM_DIBUKA)
          </Text>
          <Text style={styles.criteriaItem}>
            ✅ Modal Konfirmasi (ConfirmModal)
          </Text>
          <Text style={styles.criteriaItem}>
            ✅ Badge Status Dinamis (BELUM_DIBUKA, BERJALAN, SELESAI)
          </Text>
          <Text style={styles.criteriaItem}>
            ✅ Tombol Tutup Sesi & Kunci Selesai
          </Text>
          <Text style={styles.criteriaItem}>
            ✅ Rekapitulasi Kehadiran Praktikan (FlatList + Summary)
          </Text>
          <Text style={styles.criteriaItem}>
            ✅ Penanganan Empty State Kehadiran
          </Text>
          <Text style={styles.criteriaItem}>
            ✅ Helper Uji Coba Demo Langsung di Layar
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
    padding: 20,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginVertical: 16,
  },
  appName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
  },
  sprintBadge: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
    fontWeight: '500',
  },
  card: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    marginBottom: 20,
  },
  badgeDev: {
    backgroundColor: '#DBEAFE',
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
    marginBottom: 10,
  },
  badgeDevText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1D4ED8',
    letterSpacing: 0.5,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  cardDesc: {
    fontSize: 13,
    color: '#4B5563',
    lineHeight: 19,
    marginBottom: 20,
  },
  buttonStack: {
    gap: 12,
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
  secondaryButton: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#1F2937',
    fontSize: 14,
    fontWeight: '700',
  },
  criteriaCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  criteriaTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 10,
  },
  criteriaItem: {
    fontSize: 13,
    color: '#374151',
    marginBottom: 6,
    lineHeight: 18,
  },
});
