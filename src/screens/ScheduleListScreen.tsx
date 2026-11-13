import React, { useState } from 'react';
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import EmptyState from '../components/EmptyState';
import RoleSwitcher from '../components/RoleSwitcher';
import SessionCard from '../components/SessionCard';
import { INITIAL_SCHEDULES, Role, SessionItem } from '../data/schedules';

interface ScheduleListScreenProps {
  initialRole?: Role;
  initialSchedules?: SessionItem[];
  onSelectSession?: (session: SessionItem, role: Role) => void;
}

export const ScheduleListScreen: React.FC<ScheduleListScreenProps> = ({
  initialRole = 'asisten',
  initialSchedules = INITIAL_SCHEDULES,
  onSelectSession,
}) => {
  const router = useRouter();
  // State currentRole dikelola di tingkat layar utama
  const [currentRole, setCurrentRole] = useState<Role>(initialRole);
  const [schedules, setSchedules] = useState<SessionItem[]>(initialSchedules);

  const handleSelectSession = (session: SessionItem, role: Role) => {
    if (onSelectSession) {
      onSelectSession(session, role);
    } else {
      Alert.alert(
        'Detail Sesi Praktikum',
        `Mata Kuliah: ${session.courseTitle}\n` +
          `Modul: ${session.moduleName}\n` +
          `Peran Aktif: ${role === 'asisten' ? 'Asisten Lab' : 'Praktikan'}\n` +
          `Status: ${session.status}\n` +
          `Ruang: ${session.roomName} (${session.timeSlot})`
      );
    }
  };

  const handleToggleSimulateEmpty = () => {
    setSchedules((prev) => (prev.length > 0 ? [] : INITIAL_SCHEDULES));
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
      {/* Header Area & Role Switcher */}
      <View style={styles.headerArea}>
        <Text style={styles.appTitle}>Lab Attendance</Text>
        <Text style={styles.appSubtitle}>Sistem Presensi Praktikum Laboratorium</Text>
      </View>

      <RoleSwitcher
        currentRole={currentRole}
        onRoleChange={(newRole) => setCurrentRole(newRole)}
      />

      {/* Fitur Izin & AI (Developer 3) */}
      <View style={styles.featureBox}>
        <View style={styles.featureBoxHeader}>
          <Text style={styles.featureBoxTitle}>
            {currentRole === 'asisten' ? '📋 Pengelolaan Izin Praktikan' : '✉️ Layanan Izin Praktikan'}
          </Text>
          <View style={styles.aiTag}>
            <Text style={styles.aiTagText}>AI Powered</Text>
          </View>
        </View>

        {currentRole === 'asisten' ? (
          <TouchableOpacity
            style={styles.featureActionPrimary}
            onPress={() => router.push('/assistant-leave-review')}
            activeOpacity={0.8}
          >
            <Text style={styles.featureActionPrimaryText}>Review Pengajuan Izin</Text>
            <Text style={styles.featureActionSubtext}>Periksa dan putuskan izin praktikan</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.featureRowButtons}>
            <TouchableOpacity
              style={[styles.featureActionSecondary, styles.flexOne]}
              onPress={() => router.push('/leave-request-form')}
              activeOpacity={0.8}
            >
              <Text style={styles.featureActionSecondaryText}>+ Ajukan Izin</Text>
              <Text style={styles.featureActionSmallSubtext}>Sesi Belum Dibuka</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.featureActionSecondary, styles.flexOne]}
              onPress={() => router.push('/my-leave-requests')}
              activeOpacity={0.8}
            >
              <Text style={styles.featureActionSecondaryText}>Status Izin Saya</Text>
              <Text style={styles.featureActionSmallSubtext}>Pantau Real-time</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Baris Judul Bagian Jadwal + Tombol Simulasi Data Kosong */}
      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionTitle}>Jadwal Praktikum</Text>
          <Text style={styles.sectionSubtitle}>
            {schedules.length > 0
              ? `${schedules.length} sesi tersedia`
              : 'Tidak ada sesi'}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.simulateButton}
          onPress={handleToggleSimulateEmpty}
          activeOpacity={0.7}
        >
          <Text style={styles.simulateButtonText}>
            {schedules.length > 0 ? 'Simulasi Kosong' : 'Reset Jadwal'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Daftar Sesi atau Empty State jika data kosong */}
      {schedules.length === 0 ? (
        <View style={styles.emptyContainer}>
          <EmptyState />
        </View>
      ) : (
        <FlatList
          data={schedules}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <SessionCard
              session={item}
              currentRole={currentRole}
              onSelectSession={handleSelectSession}
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

export default ScheduleListScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    padding: 16,
  },
  headerArea: {
    marginBottom: 12,
  },
  appTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -0.3,
  },
  appSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 1,
  },
  simulateButton: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    backgroundColor: '#E5E7EB',
    borderRadius: 6,
  },
  simulateButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  listContent: {
    paddingBottom: 24,
  },
  featureBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  featureBoxHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  featureBoxTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  aiTag: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  aiTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4F46E5',
  },
  featureActionPrimary: {
    backgroundColor: '#2563EB',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  featureActionPrimaryText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  featureActionSubtext: {
    color: '#BFDBFE',
    fontSize: 11,
    marginTop: 2,
  },
  featureRowButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  flexOne: {
    flex: 1,
  },
  featureActionSecondary: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  featureActionSecondaryText: {
    color: '#1E293B',
    fontSize: 13,
    fontWeight: '700',
  },
  featureActionSmallSubtext: {
    color: '#64748B',
    fontSize: 10,
    marginTop: 2,
  },
});
