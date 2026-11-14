import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SessionItem, SessionStatus } from '../types/models';
import { ConfirmModal } from '../components/ConfirmModal';
import { AttendanceRecapList } from '../components/AttendanceRecapList';
import { listenSession, setSessionStatus } from '../services/sessionService';
import { useAttendanceBySession } from '../hooks/useAttendanceBySession';
import { LoadingState } from '../components/LoadingState';
import { ErrorState } from '../components/ErrorState';
import { getErrorMessage } from '../utils/getErrorMessage';

export interface AssistantSessionScreenProps {
  session?: SessionItem;
  onBack?: () => void;
}

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

  const sessionId = propSession?.id || searchParams.id || '';

  const [session, setSession] = useState<SessionItem | null>(() => {
    if (propSession) return propSession;
    if (searchParams.id) {
      return {
        id: searchParams.id,
        classId: '',
        courseTitle: searchParams.courseTitle || '',
        moduleName: searchParams.moduleName || '',
        classGroup: searchParams.classGroup || '',
        roomName: searchParams.roomName || '',
        timeSlot: searchParams.timeSlot || '',
        status: (searchParams.status as SessionStatus) || 'BELUM_DIBUKA',
        participantIds: [],
        createdBy: '',
        createdAt: null as any,
      };
    }
    return null;
  });

  const [sessionLoading, setSessionLoading] = useState(Boolean(sessionId));
  const [sessionError, setSessionError] = useState<string | null>(null);

  // Status updating state to prevent double-clicks
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Modal confirmation state
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [pendingAction, setPendingAction] = useState<'OPEN' | 'CLOSE' | null>(null);

  // Real-time Attendance from Firestore (SRS-11)
  const {
    attendanceList,
    loading: attendanceLoading,
    error: attendanceError,
  } = useAttendanceBySession(sessionId);

  // Listen to the session document in real-time
  useEffect(() => {
    if (!sessionId) {
      return;
    }

    const unsubscribe = listenSession(
      sessionId,
      (updatedSession) => {
        if (updatedSession) {
          setSession(updatedSession);
        }
        setSessionLoading(false);
        setSessionError(null);
      },
      (err) => {
        setSessionError(getErrorMessage(err));
        setSessionLoading(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [sessionId]);

  // Status badge config
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

  const handleOpenSessionPress = () => {
    if (session?.status !== 'BELUM_DIBUKA' || isUpdatingStatus) return;
    setPendingAction('OPEN');
    setModalVisible(true);
  };

  const handleCloseSessionPress = () => {
    if (session?.status !== 'BERJALAN' || isUpdatingStatus) return;
    setPendingAction('CLOSE');
    setModalVisible(true);
  };

  const handleConfirmAction = async () => {
    if (!session || !pendingAction) return;

    try {
      setIsUpdatingStatus(true);
      setModalVisible(false);

      if (pendingAction === 'OPEN') {
        await setSessionStatus(session.id, 'BERJALAN');
      } else if (pendingAction === 'CLOSE') {
        await setSessionStatus(session.id, 'SELESAI');
      }
    } catch (err: unknown) {
      const msg = getErrorMessage(err);
      Alert.alert('Gagal Mengubah Status', msg);
    } finally {
      setIsUpdatingStatus(false);
      setPendingAction(null);
    }
  };

  const handleCancelAction = () => {
    if (isUpdatingStatus) return;
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

  const currentStatus = session?.status || 'BELUM_DIBUKA';
  const badgeConfig = getStatusBadgeConfig(currentStatus);

  if (sessionLoading && !session) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <LoadingState message="Memuat informasi sesi..." />
      </SafeAreaView>
    );
  }

  if (sessionError && !session) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ErrorState message={sessionError} onRetry={() => router.back()} retryText="Kembali" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />

      {/* Header Bar */}
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
          <View style={styles.cardTopRow}>
            <View style={styles.titleContainer}>
              <Text style={styles.courseTitle}>{session?.courseTitle}</Text>
              <Text style={styles.moduleName}>{session?.moduleName}</Text>
            </View>
            <View style={[styles.statusBadge, badgeConfig.containerStyle]}>
              <Text style={[styles.statusBadgeText, badgeConfig.textStyle]}>
                {badgeConfig.label}
              </Text>
            </View>
          </View>

          <View style={styles.cardDivider} />

          <View style={styles.metaContainer}>
            <View style={styles.metaRow}>
              <Text style={styles.metaIcon}>🏫</Text>
              <Text style={styles.metaText}>
                {session?.classGroup} • {session?.roomName}
              </Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaIcon}>🕒</Text>
              <Text style={styles.metaText}>{session?.timeSlot}</Text>
            </View>
          </View>
        </View>

        {/* 2.2 Kontrol Siklus Sesi (Buka & Tutup Sesi) */}
        <View style={styles.actionSection}>
          <Text style={styles.sectionHeading}>Kontrol Siklus Sesi</Text>

          {currentStatus === 'BELUM_DIBUKA' && (
            <View>
              <TouchableOpacity
                style={[
                  styles.mainActionButton,
                  styles.btnOpenSession,
                  isUpdatingStatus && styles.btnDisabled,
                ]}
                onPress={handleOpenSessionPress}
                disabled={isUpdatingStatus}
                activeOpacity={0.8}
              >
                {isUpdatingStatus ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.mainActionButtonText}>▶ Buka Sesi Praktikum</Text>
                )}
              </TouchableOpacity>
              <Text style={styles.actionHint}>
                Praktikan akan dapat melakukan presensi kehadiran setelah sesi dibuka.
              </Text>
            </View>
          )}

          {currentStatus === 'BERJALAN' && (
            <View>
              <TouchableOpacity
                style={[
                  styles.mainActionButton,
                  styles.btnCloseSession,
                  isUpdatingStatus && styles.btnDisabled,
                ]}
                onPress={handleCloseSessionPress}
                disabled={isUpdatingStatus}
                activeOpacity={0.8}
              >
                {isUpdatingStatus ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.mainActionButtonText}>⏹ Tutup Sesi Praktikum</Text>
                )}
              </TouchableOpacity>
              <Text style={styles.actionHint}>
                Sesi sedang berlangsung secara real-time. Tutup sesi jika waktu praktikum telah berakhir.
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
                Sesi praktikum telah diakhiri. Pengisian presensi telah dikunci dan tidak dapat diubah kembali.
              </Text>
            </View>
          )}
        </View>

        {/* 2.3 Rekapitulasi Kehadiran Praktikan Real-time (SRS-11) */}
        {attendanceLoading ? (
          <LoadingState message="Memuat rekap presensi..." />
        ) : attendanceError ? (
          <ErrorState message={attendanceError} />
        ) : (
          <AttendanceRecapList attendees={attendanceList} />
        )}
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
            : 'Sesi yang ditutup tidak dapat dibuka kembali dan presensi akan diakhiri secara permanen.'
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
    paddingHorizontal: 8,
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563EB',
  },
  headerBarTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  headerSpacer: {
    width: 60,
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
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  titleContainer: {
    flex: 1,
    marginRight: 8,
  },
  courseTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  moduleName: {
    fontSize: 13,
    color: '#4B5563',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  badgeBelumDibuka: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
  },
  badgeTextBelumDibuka: {
    color: '#D97706',
  },
  badgeBerjalan: {
    backgroundColor: '#DCFCE7',
    borderColor: '#BBF7D0',
  },
  badgeTextBerjalan: {
    color: '#15803D',
  },
  badgeSelesai: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FECACA',
  },
  badgeTextSelesai: {
    color: '#DC2626',
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
  },
  metaIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  metaText: {
    fontSize: 13,
    color: '#4B5563',
  },
  actionSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  mainActionButton: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnOpenSession: {
    backgroundColor: '#10B981',
  },
  btnCloseSession: {
    backgroundColor: '#EF4444',
  },
  btnDisabled: {
    backgroundColor: '#9CA3AF',
    opacity: 0.6,
  },
  mainActionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  actionHint: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 16,
  },
});

export default AssistantSessionScreen;
