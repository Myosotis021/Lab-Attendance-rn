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
});
