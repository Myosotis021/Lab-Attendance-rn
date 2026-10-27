import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AttendanceRecord, SessionItem, SessionStatus } from '../types';
import { ConfirmModal } from '../components/ConfirmModal';
import {
  AttendanceRecapList,
  INITIAL_ATTENDEES,
} from '../components/AttendanceRecapList';

export interface AssistantSessionScreenProps {
  session?: SessionItem;
  onBack?: () => void;
}

export const DEFAULT_MOCK_SESSION: SessionItem = {
  id: 'ses-1',
  courseTitle: 'Pemrograman Perangkat Komputasi',
  moduleName: 'Modul 1: Antarmuka & Alur Praktikum',
  classGroup: 'Kelas A',
  roomName: 'Lab Komputer 2',
  timeSlot: 'Jumat, 13:00 - 15:30 WIB',
  status: 'BELUM_DIBUKA',
};

export const AssistantSessionScreen: React.FC<AssistantSessionScreenProps> = ({
  session: propSession,
  onBack,
}) => {
  const router = useRouter();
  const searchParams = useLocalSearchParams<{
    id?: string;
    courseTitle?: string;
    moduleName?: string;
    classGroup?: string;
    roomName?: string;
    timeSlot?: string;
    status?: SessionStatus;
  }>();

  // Combine prop, route params, or fallback to default mock session
  const initialSession: SessionItem = {
    id: propSession?.id || searchParams.id || DEFAULT_MOCK_SESSION.id,
    courseTitle:
      propSession?.courseTitle ||
      searchParams.courseTitle ||
      DEFAULT_MOCK_SESSION.courseTitle,
    moduleName:
      propSession?.moduleName ||
      searchParams.moduleName ||
      DEFAULT_MOCK_SESSION.moduleName,
    classGroup:
      propSession?.classGroup ||
      searchParams.classGroup ||
      DEFAULT_MOCK_SESSION.classGroup,
    roomName:
      propSession?.roomName ||
      searchParams.roomName ||
      DEFAULT_MOCK_SESSION.roomName,
    timeSlot:
      propSession?.timeSlot ||
      searchParams.timeSlot ||
      DEFAULT_MOCK_SESSION.timeSlot,
    status:
      propSession?.status ||
      (searchParams.status as SessionStatus) ||
      DEFAULT_MOCK_SESSION.status,
  };

  // State management for session lifecycle & attendees
  const [currentStatus, setCurrentStatus] = useState<SessionStatus>(
    initialSession.status
  );
  const [attendees, setAttendees] = useState<AttendanceRecord[]>(INITIAL_ATTENDEES);

  // Modal confirmation state
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [pendingAction, setPendingAction] = useState<'OPEN' | 'CLOSE' | null>(
    null
  );

  // Status configuration for badge
  const getStatusBadgeConfig = (status: SessionStatus) => {
    switch (status) {
      case 'BELUM_DIBUKA':
        return {
          label: 'BELUM DIBUKA',
          containerStyle: styles.badgeBelumDibuka,
          textStyle: styles.badgeTextBelumDibuka,
        };
      case 'BERJALAN':
        return {
          label: 'BERJALAN',
          containerStyle: styles.badgeBerjalan,
          textStyle: styles.badgeTextBerjalan,
        };
      case 'SELESAI':
        return {
          label: 'SELESAI',
          containerStyle: styles.badgeSelesai,
          textStyle: styles.badgeTextSelesai,
        };
      default:
        return {
          label: status,
          containerStyle: styles.badgeBelumDibuka,
          textStyle: styles.badgeTextBelumDibuka,
        };
    }
  };

  // Trigger modal for Open Session
  const handleOpenSessionPress = () => {
    if (currentStatus !== 'BELUM_DIBUKA') return;
    setPendingAction('OPEN');
    setModalVisible(true);
  };

  // Trigger modal for Close Session
  const handleCloseSessionPress = () => {
    if (currentStatus !== 'BERJALAN') return;
    setPendingAction('CLOSE');
    setModalVisible(true);
  };

  // Confirm modal action handler
  const handleConfirmAction = () => {
    if (pendingAction === 'OPEN') {
      setCurrentStatus('BERJALAN');
    } else if (pendingAction === 'CLOSE') {
      setCurrentStatus('SELESAI');
    }
    setModalVisible(false);
    setPendingAction(null);
  };

  const handleCancelAction = () => {
    setModalVisible(false);
    setPendingAction(null);
  };

  const handleBackPress = () => {
    if (onBack) {
      onBack();
    } else if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  // Demo helper: toggle empty state for reviewer testing
  const toggleEmptyAttendees = () => {
    if (attendees.length > 0) {
      setAttendees([]);
    } else {
      setAttendees(INITIAL_ATTENDEES);
    }
  };

  // Demo helper: reset session status to BELUM_DIBUKA
  const handleResetSession = () => {
    setCurrentStatus('BELUM_DIBUKA');
    setAttendees(INITIAL_ATTENDEES);
  };

  // Demo helper: simulate a student attending
  const handleAddSampleAttendee = () => {
    const newId = `att-${Date.now()}`;
    const currentTime = new Date().toLocaleTimeString('id-ID') + ' WIB';
    const sampleNames = ['Rizky Pratama', 'Nabila Zahra', 'Fajar Ramadhan', 'Dina Lestari'];
    const randomName = sampleNames[Math.floor(Math.random() * sampleNames.length)];
    const randomNim = `2201010${Math.floor(10 + Math.random() * 89)}`;

    setAttendees((prev) => [
      ...prev,
      {
        id: newId,
        studentName: randomName,
        studentNim: randomNim,
        timestamp: currentTime,
        status: 'Hadir',
        notes: 'Meja Lab: PC-08',
      },
    ]);
  };

  const badgeConfig = getStatusBadgeConfig(currentStatus);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />

      {/* Top App Header */}
      <View style={styles.headerBar}>
        <TouchableOpacity
          onPress={handleBackPress}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Text style={styles.backButtonText}>← Kembali</Text>
        </TouchableOpacity>
        <Text style={styles.headerBarTitle}>Kelola Sesi Asisten</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 2.1 Kartu Header Sesi Praktikum */}
        <View style={styles.sessionCard}>
          {/* Top row: Title & Status Badge */}
          <View style={styles.cardTopRow}>
            <View style={styles.titleContainer}>
              <Text style={styles.courseTitle}>{initialSession.courseTitle}</Text>
              <Text style={styles.moduleName}>{initialSession.moduleName}</Text>
            </View>
            <View style={[styles.statusBadge, badgeConfig.containerStyle]}>
              <Text style={[styles.statusBadgeText, badgeConfig.textStyle]}>
                {badgeConfig.label}
              </Text>
            </View>
          </View>

          {/* Divider */}
          <View style={styles.cardDivider} />

          {/* Session Metadata Info */}
          <View style={styles.metaContainer}>
            <View style={styles.metaRow}>
              <Text style={styles.metaIcon}>🏫</Text>
              <Text style={styles.metaText}>
                {initialSession.classGroup} • {initialSession.roomName}
              </Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaIcon}>🕒</Text>
              <Text style={styles.metaText}>{initialSession.timeSlot}</Text>
            </View>
          </View>
        </View>

        {/* 2.2 Kontrol Siklus Sesi (Buka & Tutup Sesi) */}
        <View style={styles.actionSection}>
          <Text style={styles.sectionHeading}>Kontrol Siklus Sesi</Text>

          {currentStatus === 'BELUM_DIBUKA' && (
            <View>
              <TouchableOpacity
                style={[styles.mainActionButton, styles.btnOpenSession]}
                onPress={handleOpenSessionPress}
                activeOpacity={0.8}
              >
                <Text style={styles.mainActionButtonText}>▶ Buka Sesi Praktikum</Text>
              </TouchableOpacity>
              <Text style={styles.actionHint}>
                Praktikan akan dapat melakukan presensi kehadiran setelah sesi dibuka.
              </Text>
            </View>
          )}

          {currentStatus === 'BERJALAN' && (
            <View>
              <TouchableOpacity
                style={[styles.mainActionButton, styles.btnCloseSession]}
                onPress={handleCloseSessionPress}
                activeOpacity={0.8}
              >
                <Text style={styles.mainActionButtonText}>⏹ Tutup Sesi Praktikum</Text>
              </TouchableOpacity>
              <Text style={styles.actionHint}>
                Sesi sedang berlangsung. Tutup sesi jika waktu praktikum telah berakhir.
              </Text>
            </View>
          )}

          {currentStatus === 'SELESAI' && (
            <View>
              <TouchableOpacity
                style={[styles.mainActionButton, styles.btnDisabled]}
                disabled={true}
                activeOpacity={1}
              >
                <Text style={styles.mainActionButtonText}>🔒 Sesi Telah Ditutup (Selesai)</Text>
              </TouchableOpacity>
              <Text style={styles.actionHint}>
                Sesi praktikum telah diakhiri. Pengisian presensi telah dikunci dan tidak dapat diubah.
              </Text>
            </View>
          )}
        </View>

        {/* Interactive Demo Helpers (for Examiners/Reviewers) */}
        <View style={styles.demoBox}>
          <Text style={styles.demoTitle}>🛠️ Mode Pengujian Demo (Sprint 1)</Text>
          <Text style={styles.demoSubtitle}>
            Gunakan kontrol di bawah ini untuk menguji seluruh Acceptance Criteria:
          </Text>
          <View style={styles.demoButtonsRow}>
            <TouchableOpacity
              style={styles.demoButton}
              onPress={handleResetSession}
              activeOpacity={0.7}
            >
              <Text style={styles.demoButtonText}>🔄 Reset Sesi</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.demoButton}
              onPress={toggleEmptyAttendees}
              activeOpacity={0.7}
            >
              <Text style={styles.demoButtonText}>
                {attendees.length > 0 ? '🗑️ Kosongkan Data' : '📋 Isi Data Dummy'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.demoButton}
              onPress={handleAddSampleAttendee}
              activeOpacity={0.7}
            >
              <Text style={styles.demoButtonText}>➕ Tambah Hadir</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 2.3 Rekapitulasi Kehadiran Praktikan */}
        <AttendanceRecapList attendees={attendees} />
      </ScrollView>

      {/* Confirmation Modal */}
      <ConfirmModal
        visible={modalVisible}
        title={
          pendingAction === 'OPEN'
            ? 'Buka Sesi Praktikum?'
            : 'Tutup Sesi Praktikum?'
        }
        message={
          pendingAction === 'OPEN'
            ? 'Praktikan akan dapat melakukan presensi kehadiran setelah sesi dibuka.'
            : 'Sesi yang ditutup tidak dapat dibuka kembali dan presensi akan diakhiri.'
        }
        confirmText={
          pendingAction === 'OPEN' ? 'Ya, Buka Sekarang' : 'Ya, Tutup Sesi'
        }
        cancelText="Batal"
        confirmVariant={pendingAction === 'OPEN' ? 'success' : 'danger'}
        onConfirm={handleConfirmAction}
        onCancel={handleCancelAction}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  backButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  headerBarTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  headerSpacer: {
    width: 65,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  sessionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  titleContainer: {
    flex: 1,
    marginRight: 8,
  },
  courseTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  moduleName: {
    fontSize: 13,
    color: '#4B5563',
    lineHeight: 18,
  },
  statusBadge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  badgeBelumDibuka: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
  },
  badgeTextBelumDibuka: {
    color: '#B45309',
  },
  badgeBerjalan: {
    backgroundColor: '#DCFCE7',
    borderColor: '#22C55E',
  },
  badgeTextBerjalan: {
    color: '#15803D',
  },
  badgeSelesai: {
    backgroundColor: '#FEE2E2',
    borderColor: '#EF4444',
  },
  badgeTextSelesai: {
    color: '#B91C1C',
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 12,
  },
  metaContainer: {
    gap: 6,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaIcon: {
    fontSize: 14,
  },
  metaText: {
    fontSize: 13,
    color: '#4B5563',
    fontWeight: '500',
  },
  actionSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 12,
  },
  mainActionButton: {
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
  },
  btnOpenSession: {
    backgroundColor: '#16A34A', // Hijau/biru sesuai spesifikasi
  },
  btnCloseSession: {
    backgroundColor: '#DC2626', // Merah/oranye sesuai spesifikasi
  },
  btnDisabled: {
    backgroundColor: '#9CA3AF',
    opacity: 0.5,
  },
  mainActionButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  actionHint: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 16,
  },
  demoBox: {
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  demoTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0369A1',
    marginBottom: 2,
  },
  demoSubtitle: {
    fontSize: 11,
    color: '#0C4A6E',
    marginBottom: 8,
  },
  demoButtonsRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  demoButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#7DD3FC',
  },
  demoButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0284C7',
  },
});

export default AssistantSessionScreen;
