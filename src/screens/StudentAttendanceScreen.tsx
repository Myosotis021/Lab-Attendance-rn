import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import {
  AttendanceRecord,
  SessionItem,
  SessionStatus,
} from '../types/models';
import { AttendanceFeedbackModal } from '../components/AttendanceFeedbackModal';
import { StudentHistoryCard } from '../components/StudentHistoryCard';
import { OfflineBanner } from '../components/OfflineBanner';
import { useAuth } from '../context/AuthContext';
import { listenSession } from '../services/sessionService';
import {
  saveAttendance,
  listenMyAttendanceForSession,
} from '../services/attendanceService';
import { LoadingState } from '../components/LoadingState';
import { ErrorState } from '../components/ErrorState';
import { getErrorMessage } from '../utils/getErrorMessage';
import { theme } from '../theme';
import { getSessionStatusLabel, getRoleLabel } from '../utils/labelUtils';

export interface StudentAttendanceScreenProps {
  initialSession?: SessionItem;
  onBack?: () => void;
}

const getSessionBadgeStyle = (status: SessionStatus) => {
  switch (status) {
    case 'BELUM_DIBUKA':
      return {
        bg: theme.colors.status.belumDibuka.bg,
        text: theme.colors.status.belumDibuka.text,
        border: theme.colors.status.belumDibuka.border,
        label: getSessionStatusLabel('BELUM_DIBUKA'),
      };
    case 'BERJALAN':
      return {
        bg: theme.colors.status.berjalan.bg,
        text: theme.colors.status.berjalan.text,
        border: theme.colors.status.berjalan.border,
        label: getSessionStatusLabel('BERJALAN'),
      };
    case 'SELESAI':
      return {
        bg: theme.colors.status.selesai.bg,
        text: theme.colors.status.selesai.text,
        border: theme.colors.status.selesai.border,
        label: getSessionStatusLabel('SELESAI'),
      };
    default:
      return {
        bg: theme.colors.surfaceSubtle,
        text: theme.colors.textSecondary,
        border: theme.colors.border,
        label: getSessionStatusLabel(status),
      };
  }
};

export const StudentAttendanceScreen: React.FC<StudentAttendanceScreenProps> = ({
  initialSession,
  onBack,
}) => {
  const router = useRouter();
  const { profile } = useAuth();

  // ── Route guard: redirect ke login jika belum auth ──────────────
  useEffect(() => {
    if (profile === null) {
      router.replace('/login' as any);
    }
  }, [profile, router]);

  const searchParams = useLocalSearchParams<{
    id?: string;
    courseTitle?: string;
    moduleName?: string;
    classGroup?: string;
    roomName?: string;
    timeSlot?: string;
    status?: SessionStatus;
  }>();

  const sessionId = initialSession?.id || searchParams.id || '';

  // Session state from Firestore
  const [currentSession, setCurrentSession] = useState<SessionItem | null>(() => {
    if (initialSession) return initialSession;
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

  const [loadingSession, setLoadingSession] = useState(Boolean(sessionId));
  const [sessionError, setSessionError] = useState<string | null>(null);

  // Form input state
  const [notes, setNotes] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Attendance state
  const [attendanceRecord, setAttendanceRecord] = useState<AttendanceRecord | null>(null);
  const [loadingAttendance, setLoadingAttendance] = useState(
    Boolean(sessionId && profile?.uid)
  );

  // Success Feedback Modal state
  const [showFeedbackModal, setShowFeedbackModal] = useState<boolean>(false);

  // 1. Listen to session status in real-time
  useEffect(() => {
    if (!sessionId) {
      return;
    }

    const unsubscribe = listenSession(
      sessionId,
      (updatedSession) => {
        if (updatedSession) {
          setCurrentSession(updatedSession);
        }
        setLoadingSession(false);
        setSessionError(null);
      },
      (err) => {
        setSessionError(getErrorMessage(err));
        setLoadingSession(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [sessionId]);

  // 2. Real-time anti-double attendance listener
  useEffect(() => {
    if (!sessionId || !profile?.uid) {
      return;
    }

    const unsubscribe = listenMyAttendanceForSession(
      sessionId,
      profile.uid,
      (record) => {
        setAttendanceRecord(record);
        setLoadingAttendance(false);
      },
      (err) => {
        console.error('Error listening to user attendance:', err);
        setLoadingAttendance(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [sessionId, profile?.uid]);

  // 3. Handle submit attendance
  const handleSubmitAttendance = async () => {
    if (!profile) {
      Alert.alert('Gagal', 'Anda harus login untuk melakukan presensi');
      return;
    }

    if (!currentSession) {
      Alert.alert('Gagal', 'Data sesi tidak ditemukan');
      return;
    }

    if (currentSession.status !== 'BERJALAN') {
      Alert.alert(
        'Sesi Belum Dibuka',
        'Presensi hanya dapat dilakukan ketika sesi praktikum sedang berlangsung.'
      );
      return;
    }

    if (attendanceRecord) {
      Alert.alert(
        'Sudah Presensi',
        'Anda telah tercatat melakukan presensi untuk sesi ini. Presensi ganda tidak diperbolehkan.'
      );
      return;
    }

    try {
      setSubmitting(true);

      const saved = await saveAttendance({
        sessionId: currentSession.id,
        classId: currentSession.classId || '',
        uid: profile.uid,
        studentName: profile.name,
        studentNim: profile.nim || '',
        notes: notes.trim(),
      });

      setAttendanceRecord(saved);
      setShowFeedbackModal(true);
    } catch (err: unknown) {
      const errorMsg = getErrorMessage(err);
      Alert.alert('Gagal Melakukan Presensi', errorMsg);
    } finally {
      setSubmitting(false);
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

  if (profile?.role === 'asisten') {
    return (
      <LinearGradient colors={theme.colors.backgroundGradient} style={styles.flexOne}>
        <SafeAreaView style={styles.safeArea}>
          <ErrorState
            title="Akses Ditolak"
            message="Halaman ini khusus untuk Mahasiswa Praktikan melakukan presensi kehadiran."
            onRetry={handleBack}
            retryText="Kembali"
          />
        </SafeAreaView>
      </LinearGradient>
    );
  }

  if (loadingSession && !currentSession) {
    return (
      <LinearGradient colors={theme.colors.backgroundGradient} style={styles.flexOne}>
        <SafeAreaView style={styles.safeArea}>
          <LoadingState message="Memuat informasi sesi..." />
        </SafeAreaView>
      </LinearGradient>
    );
  }

  if (sessionError && !currentSession) {
    return (
      <LinearGradient colors={theme.colors.backgroundGradient} style={styles.flexOne}>
        <SafeAreaView style={styles.safeArea}>
          <ErrorState message={sessionError} onRetry={handleBack} retryText="Kembali" />
        </SafeAreaView>
      </LinearGradient>
    );
  }

  const sessionStatus = currentSession?.status || 'BELUM_DIBUKA';
  const sessionBadge = getSessionBadgeStyle(sessionStatus);
  const hasAttended = Boolean(attendanceRecord);

  return (
    <LinearGradient colors={theme.colors.backgroundGradient} style={styles.flexOne}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <StatusBar style="dark" />
        <OfflineBanner />

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Top Navigation Bar with Rounded Outline Back Button */}
          <View style={styles.topBar}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={handleBack}
              activeOpacity={0.7}
            >
              <Feather name="arrow-left" size={20} color={theme.colors.textPrimary} />
            </TouchableOpacity>

            <View style={styles.headerTitleGroup}>
              <Text style={styles.screenTitle}>Presensi Praktikan</Text>
              <Text style={styles.screenSubtitle}>Laboratorium Informatika</Text>
            </View>

            {/* Decorative curved shape in top corner */}
            <View style={styles.decorativeCorner} pointerEvents="none">
              <View style={styles.decorativeCurve} />
            </View>
          </View>

          {/* Session Info Header Card */}
          <View style={styles.sessionCard}>
            <View style={styles.sessionHeaderRow}>
              <View style={styles.sessionTitleWrapper}>
                <Text style={styles.sessionCourseTitle}>
                  {currentSession?.courseTitle}
                </Text>
                <Text style={styles.sessionModuleName}>
                  {currentSession?.moduleName}
                </Text>
              </View>
              <View
                style={[
                  styles.sessionBadge,
                  {
                    backgroundColor: sessionBadge.bg,
                    borderColor: sessionBadge.border,
                  },
                ]}
              >
                <Text style={[styles.sessionBadgeText, { color: sessionBadge.text }]}>
                  {sessionBadge.label}
                </Text>
              </View>
            </View>

            <View style={styles.sessionMetaDivider} />

            <View style={styles.sessionMetaGrid}>
              <View style={styles.sessionMetaItem}>
                <Text style={styles.metaLabel}>Kelas & Ruang:</Text>
                <Text style={styles.metaValue}>
                  {currentSession?.classGroup} • {currentSession?.roomName}
                </Text>
              </View>
              <View style={styles.sessionMetaItem}>
                <Text style={styles.metaLabel}>Jadwal Praktikum:</Text>
                <Text style={styles.metaValue}>{currentSession?.timeSlot}</Text>
              </View>
            </View>
          </View>

          {/* Student Identity Info Card */}
          <View style={styles.profileCard}>
            <View style={styles.avatarBox}>
              <Text style={styles.avatarText}>
                {(profile?.name || 'M')
                  .split(' ')
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join('')
                  .toUpperCase()}
              </Text>
            </View>
            <View style={styles.profileInfo}>
              <View style={styles.profileRoleBadge}>
                <Text style={styles.profileRoleBadgeText}>PRAKTIKAN AKTIF</Text>
              </View>
              <Text style={styles.profileName}>{profile?.name || 'Praktikan'}</Text>
              <Text style={styles.profileNim}>NIM: {profile?.nim || '-'}</Text>
            </View>
          </View>

          {/* Conditional Content based on Session Status and Attendance State */}
          {loadingAttendance ? (
            <LoadingState message="Memeriksa status kehadiran..." />
          ) : hasAttended && attendanceRecord ? (
            /* Anti-Double Attendance: Form hidden/locked and replaced by verified proof */
            <View style={styles.attendanceLockedContainer}>
              <StudentHistoryCard
                attendance={attendanceRecord}
                sessionTitle={`${currentSession?.courseTitle} (${currentSession?.classGroup})`}
                onViewFeedback={() => setShowFeedbackModal(true)}
              />
            </View>
          ) : sessionStatus === 'BELUM_DIBUKA' ? (
            /* Gating 1: Session not yet opened */
            <View style={styles.gatingCard}>
              <View style={styles.gatingIconBoxYellow}>
                <Feather name="clock" size={24} color="#D97706" />
              </View>
              <Text style={styles.gatingTitlePending}>Sesi Belum Dibuka</Text>
              <Text style={styles.gatingDescription}>
                Sesi praktikum belum dibuka oleh asisten lab. Pengisian presensi
                belum tersedia saat ini.
              </Text>
              <View style={styles.gatingHintBox}>
                <Text style={styles.gatingHintText}>
                  Status sesi akan diperbarui otomatis saat asisten membuka sesi.
                </Text>
              </View>
            </View>
          ) : sessionStatus === 'SELESAI' ? (
            /* Gating 2: Session already ended */
            <View style={styles.gatingCard}>
              <View style={styles.gatingIconBoxRed}>
                <Feather name="lock" size={24} color="#DC2626" />
              </View>
              <Text style={styles.gatingTitleClosed}>Sesi Telah Selesai</Text>
              <Text style={styles.gatingDescription}>
                Sesi praktikum telah ditutup. Pengisian presensi sudah berakhir.
              </Text>
              <View style={styles.gatingHintBox}>
                <Text style={styles.gatingHintText}>
                  Batas waktu presensi telah berakhir. Anda tidak dapat mengisi
                  presensi pada sesi ini lagi.
                </Text>
              </View>
            </View>
          ) : (
            /* Active Attendance Form (When BERJALAN and not yet attended) */
            <View style={styles.formCard}>
              <Text style={styles.formSectionTitle}>Formulir Kehadiran</Text>
              <Text style={styles.formSectionSubtitle}>
                Presensi mencatat kehadiran Anda secara langsung ke sistem lab.
              </Text>

              {/* Status Kehadiran (Otomatis Hadir) */}
              <Text style={styles.fieldLabel}>Status Kehadiran</Text>
              <View style={styles.statusFixedBox}>
                <Feather name="check-circle" size={16} color="#166534" />
                <Text style={styles.statusFixedText}>Hadir di Laboratorium</Text>
              </View>

              {/* Optional Notes (e.g. PC table number) */}
              <Text style={styles.fieldLabel}>Nomor Meja Lab / Catatan (Opsional)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Contoh: Meja PC-04"
                placeholderTextColor={theme.colors.textMuted}
                value={notes}
                onChangeText={setNotes}
                maxLength={100}
                editable={!submitting}
              />
              <Text style={styles.inputHelpText}>
                Masukkan nomor meja laboratorium tempat Anda praktikum.
              </Text>

              {/* Submit Button */}
              <TouchableOpacity
                style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
                onPress={handleSubmitAttendance}
                disabled={submitting}
                activeOpacity={0.85}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitButtonText}>
                    Kirim Presensi Sekarang
                  </Text>
                )}
              </TouchableOpacity>

              <View style={styles.secureNotice}>
                <Feather name="shield" size={14} color={theme.colors.textMuted} style={styles.shieldIcon} />
                <Text style={styles.secureNoticeText}>
                  Sistem anti-double attendance akan mengunci presensi setelah
                  diserahkan.
                </Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Pop-up Modal Feedback after successful submission */}
        <AttendanceFeedbackModal
          visible={showFeedbackModal}
          attendanceData={attendanceRecord}
          onClose={() => setShowFeedbackModal(false)}
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
    position: 'relative',
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
  decorativeCorner: {
    position: 'absolute',
    right: -10,
    top: -10,
    width: 80,
    height: 80,
    overflow: 'hidden',
  },
  decorativeCurve: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: 'rgba(201, 184, 245, 0.45)',
  },
  sessionCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xxl,
    padding: 20,
    marginBottom: 14,
    ...theme.shadows.card,
  },
  sessionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  sessionTitleWrapper: {
    flex: 1,
    marginRight: 10,
  },
  sessionCourseTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.textPrimary,
  },
  sessionModuleName: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginTop: 3,
  },
  sessionBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
  },
  sessionBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  sessionMetaDivider: {
    height: 1,
    backgroundColor: theme.colors.borderLight,
    marginVertical: 14,
  },
  sessionMetaGrid: {
    gap: 8,
  },
  sessionMetaItem: {
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
  profileCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    ...theme.shadows.card,
  },
  avatarBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#166534',
  },
  profileInfo: {
    flex: 1,
  },
  profileRoleBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 4,
  },
  profileRoleBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: theme.colors.textSecondary,
    letterSpacing: 0.5,
  },
  profileName: {
    fontSize: 15,
    fontWeight: '800',
    color: theme.colors.textPrimary,
  },
  profileNim: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginTop: 1,
  },
  attendanceLockedContainer: {
    marginBottom: 16,
  },
  locationNavButton: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1.5,
    borderColor: '#93C5FD',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    elevation: 2,
  },
  locationNavTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1D4ED8',
  },
  locationNavSubtitle: {
    fontSize: 11,
    color: '#3B82F6',
    marginTop: 2,
  },
  gatingCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xxl,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    ...theme.shadows.card,
  },
  gatingIconBoxYellow: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  gatingIconBoxRed: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  gatingTitlePending: {
    fontSize: 17,
    fontWeight: '800',
    color: '#92400E',
    marginBottom: 6,
  },
  gatingTitleClosed: {
    fontSize: 17,
    fontWeight: '800',
    color: '#991B1B',
    marginBottom: 6,
  },
  gatingDescription: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 16,
  },
  gatingHintBox: {
    backgroundColor: theme.colors.surfaceSubtle,
    borderRadius: theme.borderRadius.md,
    padding: 12,
    width: '100%',
  },
  gatingHintText: {
    fontSize: 11,
    color: theme.colors.textMuted,
    textAlign: 'center',
  },
  formCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xxl,
    padding: 22,
    marginBottom: 16,
    ...theme.shadows.card,
  },
  formSectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.textPrimary,
    marginBottom: 4,
  },
  formSectionSubtitle: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: 18,
    lineHeight: 18,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: 6,
    marginTop: 4,
  },
  statusFixedBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: theme.borderRadius.md,
    padding: 12,
    marginBottom: 16,
  },
  statusFixedText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#166534',
  },
  textInput: {
    backgroundColor: theme.colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: theme.colors.textPrimary,
    marginBottom: 4,
  },
  inputHelpText: {
    fontSize: 11,
    color: theme.colors.textMuted,
    marginBottom: 20,
  },
  submitButton: {
    backgroundColor: theme.colors.textPrimary,
    borderRadius: theme.borderRadius.md,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.subtle,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  secureNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
    gap: 6,
  },
  shieldIcon: {
    marginRight: 2,
  },
  secureNoticeText: {
    fontSize: 11,
    color: theme.colors.textMuted,
    flex: 1,
  },
  leaveButton: {
    borderWidth: 1.5,
    borderColor: '#0D9488',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    backgroundColor: '#F0FDFA',
    marginTop: 12,
    width: '100%',
  },
  leaveButtonText: {
    color: '#0D9488',
    fontSize: 13,
    fontWeight: '700',
  },
});

export default StudentAttendanceScreen;
