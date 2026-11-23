import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { SessionItem, SessionStatus } from '../types/models';
import { ConfirmModal } from '../components/ConfirmModal';
import { AttendanceRecapList } from '../components/AttendanceRecapList';
import { listenSession, setSessionStatus } from '../services/sessionService';
import { useAttendanceBySession } from '../hooks/useAttendanceBySession';
import { LoadingState } from '../components/LoadingState';
import { ErrorState } from '../components/ErrorState';
import { useAuth } from '../hooks/useAuth';
import { getErrorMessage } from '../utils/getErrorMessage';
import { getSessionStatusLabel } from '../utils/labelUtils';
import { theme } from '../theme';

export interface AssistantSessionScreenProps {
  session?: SessionItem;
  onBack?: () => void;
}

export const AssistantSessionScreen: React.FC<AssistantSessionScreenProps> = ({
  session: propSession,
  onBack,
}) => {
  const router = useRouter();
  const { profile } = useAuth();
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

  const getStatusBadgeConfig = (status: SessionStatus) => {
    switch (status) {
      case 'BELUM_DIBUKA':
        return {
          label: getSessionStatusLabel('BELUM_DIBUKA'),
          containerStyle: styles.badgeBelumDibuka,
          textStyle: styles.badgeTextBelumDibuka,
        };
      case 'BERJALAN':
        return {
          label: getSessionStatusLabel('BERJALAN'),
          containerStyle: styles.badgeBerjalan,
          textStyle: styles.badgeTextBerjalan,
        };
      case 'SELESAI':
        return {
          label: getSessionStatusLabel('SELESAI'),
          containerStyle: styles.badgeSelesai,
          textStyle: styles.badgeTextSelesai,
        };
      default:
        return {
          label: getSessionStatusLabel(status),
          containerStyle: styles.badgeBelumDibuka,
          textStyle: styles.badgeTextBelumDibuka,
        };
    }
  };

  const handleOpenSessionPress = () => {
    setPendingAction('OPEN');
    setModalVisible(true);
  };

  const handleCloseSessionPress = () => {
    setPendingAction('CLOSE');
    setModalVisible(true);
  };

  const handleConfirmStatusChange = async () => {
    if (!session || !pendingAction) return;

    const newStatus: SessionStatus =
      pendingAction === 'OPEN' ? 'BERJALAN' : 'SELESAI';

    try {
      setIsUpdatingStatus(true);
      await setSessionStatus(session.id, newStatus);
      setModalVisible(false);
      setPendingAction(null);
    } catch (err: unknown) {
      const errorMsg = getErrorMessage(err);
      Alert.alert('Gagal Mengubah Status', errorMsg);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  if (profile?.role !== 'asisten') {
    return (
      <LinearGradient colors={theme.colors.backgroundGradient} style={styles.flexOne}>
        <SafeAreaView style={styles.safeArea}>
          <ErrorState
            title="Akses Ditolak"
            message="Halaman ini khusus untuk Asisten Laboratorium untuk mengelola sesi praktikum."
            onRetry={handleBack}
            retryText="Kembali"
          />
        </SafeAreaView>
      </LinearGradient>
    );
  }

  if (sessionLoading && !session) {
    return (
      <LinearGradient colors={theme.colors.backgroundGradient} style={styles.flexOne}>
        <SafeAreaView style={styles.safeArea}>
          <LoadingState message="Memuat informasi sesi praktikum..." />
        </SafeAreaView>
      </LinearGradient>
    );
  }

  if (sessionError && !session) {
    return (
      <LinearGradient colors={theme.colors.backgroundGradient} style={styles.flexOne}>
        <SafeAreaView style={styles.safeArea}>
          <ErrorState message={sessionError} onRetry={handleBack} retryText="Kembali" />
        </SafeAreaView>
      </LinearGradient>
    );
  }

  const currentStatus = session?.status || 'BELUM_DIBUKA';
  const badgeConfig = getStatusBadgeConfig(currentStatus);

  return (
    <LinearGradient colors={theme.colors.backgroundGradient} style={styles.flexOne}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <StatusBar style="dark" />

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Top Bar with Rounded Back Button */}
          <View style={styles.topBar}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={handleBack}
              activeOpacity={0.7}
            >
              <Feather name="arrow-left" size={20} color={theme.colors.textPrimary} />
            </TouchableOpacity>

            <View style={styles.headerTitleGroup}>
              <Text style={styles.screenTitle}>Kelola Sesi Praktikum</Text>
              <Text style={styles.screenSubtitle}>Panel Kontrol Asisten</Text>
            </View>
          </View>

          {/* Session Overview Card */}
          <View style={styles.sessionCard}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.titleWrapper}>
                <Text style={styles.courseTitle}>{session?.courseTitle}</Text>
                <Text style={styles.moduleName}>{session?.moduleName}</Text>
              </View>
              <View style={[styles.badge, badgeConfig.containerStyle]}>
                <Text style={[styles.badgeText, badgeConfig.textStyle]}>
                  {badgeConfig.label}
                </Text>
              </View>
            </View>

            <View style={styles.metaDivider} />

            <View style={styles.metaGrid}>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Kelas & Ruangan:</Text>
                <Text style={styles.metaValue}>
                  {session?.classGroup} • {session?.roomName}
                </Text>
              </View>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Waktu:</Text>
                <Text style={styles.metaValue}>{session?.timeSlot}</Text>
              </View>
            </View>

            {/* Action Buttons based on Session Status */}
            <View style={styles.statusActionSection}>
              {currentStatus === 'BELUM_DIBUKA' && (
                <TouchableOpacity
                  style={styles.openSessionBtn}
                  onPress={handleOpenSessionPress}
                  disabled={isUpdatingStatus}
                  activeOpacity={0.85}
                >
                  {isUpdatingStatus ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <>
                      <Feather name="play-circle" size={17} color="#FFFFFF" style={styles.btnIcon} />
                      <Text style={styles.openSessionBtnText}>
                        Buka Sesi Praktikum
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              )}

              {currentStatus === 'BERJALAN' && (
                <View style={styles.runningActionGroup}>
                  <View style={styles.liveIndicatorBox}>
                    <View style={styles.liveDot} />
                    <Text style={styles.liveText}>
                      Sesi sedang berjalan. Mahasiswa dapat melakukan presensi.
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.closeSessionBtn}
                    onPress={handleCloseSessionPress}
                    disabled={isUpdatingStatus}
                    activeOpacity={0.85}
                  >
                    {isUpdatingStatus ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <>
                        <Feather name="check-circle" size={16} color="#FFFFFF" style={styles.btnIcon} />
                        <Text style={styles.closeSessionBtnText}>
                          Tutup & Selesaikan Sesi
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              )}

              {currentStatus === 'SELESAI' && (
                <View style={styles.endedNoticeBox}>
                  <Feather name="check-circle" size={16} color="#991B1B" style={styles.btnIcon} />
                  <Text style={styles.endedNoticeText}>
                    Sesi praktikum telah ditutup secara permanen.
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Real-time Attendance Recap List */}
          {attendanceLoading ? (
            <LoadingState message="Memuat rekapitulasi kehadiran..." />
          ) : attendanceError ? (
            <ErrorState message={attendanceError} />
          ) : (
            <AttendanceRecapList attendees={attendanceList} />
          )}
        </ScrollView>

        {/* Status Confirmation Modal */}
        <ConfirmModal
          visible={modalVisible}
          title={
            pendingAction === 'OPEN'
              ? 'Buka Sesi Praktikum?'
              : 'Tutup Sesi Praktikum?'
          }
          message={
            pendingAction === 'OPEN'
              ? 'Membuka sesi akan memungkinkan praktikan untuk mengisi presensi kehadiran sekarang.'
              : 'Menutup sesi akan mengakhiri pengisian presensi. Praktikan tidak akan dapat mengisi presensi lagi.'
          }
          confirmText={
            pendingAction === 'OPEN' ? 'Ya, Buka Sesi' : 'Ya, Tutup Sesi'
          }
          confirmVariant={pendingAction === 'OPEN' ? 'primary' : 'danger'}
          onConfirm={handleConfirmStatusChange}
          onCancel={() => setModalVisible(false)}
        />
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  flexOne: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    marginBottom: 6,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.subtle,
  },
  headerTitleGroup: {
    marginLeft: 14,
    flex: 1,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: theme.colors.textPrimary,
    letterSpacing: -0.5,
  },
  screenSubtitle: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginTop: 1,
  },
  sessionCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xxl,
    padding: 20,
    marginBottom: 16,
    ...theme.shadows.card,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  titleWrapper: {
    flex: 1,
    marginRight: 10,
  },
  courseTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.textPrimary,
  },
  moduleName: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginTop: 3,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  badgeBelumDibuka: {
    backgroundColor: theme.colors.status.belumDibuka.bg,
    borderColor: theme.colors.status.belumDibuka.border,
  },
  badgeTextBelumDibuka: {
    color: theme.colors.status.belumDibuka.text,
  },
  badgeBerjalan: {
    backgroundColor: theme.colors.status.berjalan.bg,
    borderColor: theme.colors.status.berjalan.border,
  },
  badgeTextBerjalan: {
    color: theme.colors.status.berjalan.text,
  },
  badgeSelesai: {
    backgroundColor: theme.colors.status.selesai.bg,
    borderColor: theme.colors.status.selesai.border,
  },
  badgeTextSelesai: {
    color: theme.colors.status.selesai.text,
  },
  metaDivider: {
    height: 1,
    backgroundColor: theme.colors.borderLight,
    marginVertical: 14,
  },
  metaGrid: {
    gap: 8,
    marginBottom: 16,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  metaValue: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  statusActionSection: {
    marginTop: 4,
  },
  openSessionBtn: {
    backgroundColor: theme.colors.textPrimary,
    borderRadius: theme.borderRadius.md,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.subtle,
  },
  openSessionBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
  runningActionGroup: {
    gap: 10,
  },
  liveIndicatorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    padding: 10,
    borderRadius: theme.borderRadius.md,
    gap: 8,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#166534',
  },
  liveText: {
    fontSize: 11,
    color: '#166534',
    fontWeight: '600',
    flex: 1,
  },
  closeSessionBtn: {
    backgroundColor: '#DC2626',
    borderRadius: theme.borderRadius.md,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeSessionBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  endedNoticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: theme.borderRadius.md,
    gap: 6,
  },
  endedNoticeText: {
    fontSize: 12,
    color: '#991B1B',
    fontWeight: '600',
  },
  btnIcon: {
    marginRight: 6,
  },
});

export default AssistantSessionScreen;
