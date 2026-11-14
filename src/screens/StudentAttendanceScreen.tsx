import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter, useLocalSearchParams } from 'expo-router';
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

export interface StudentAttendanceScreenProps {
  initialSession?: SessionItem;
  onBack?: () => void;
}

const getSessionBadgeStyle = (status: SessionStatus) => {
  switch (status) {
    case 'BELUM_DIBUKA':
      return {
        bg: '#FEF3C7',
        text: '#B45309',
        border: '#FCD34D',
        label: 'BELUM DIBUKA',
      };
    case 'BERJALAN':
      return {
        bg: '#DCFCE7',
        text: '#15803D',
        border: '#86EFAC',
        label: 'BERJALAN',
      };
    case 'SELESAI':
      return {
        bg: '#FEE2E2',
        text: '#B91C1C',
        border: '#FCA5A5',
        label: 'SELESAI',
      };
    default:
      return {
        bg: '#F3F4F6',
        text: '#4B5563',
        border: '#E5E7EB',
        label: status,
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
      (sess) => {
        if (sess) {
          setCurrentSession(sess);
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

  // 2. Listen to student's attendance on this session
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
        console.error('Error listening attendance:', err);
        setLoadingAttendance(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [sessionId, profile?.uid]);

  // Handler for submitting attendance (SRS-10)
  const handleSubmitAttendance = async () => {
    if (!currentSession) return;
    if (!profile) {
      Alert.alert('Autentikasi Diperlukan', 'Silakan login terlebih dahulu.');
      return;
    }

    if (currentSession.status !== 'BERJALAN') {
      Alert.alert(
        'Sesi Tidak Aktif',
        'Presensi hanya dapat dilakukan saat status sesi BERJALAN.'
      );
      return;
    }

    if (attendanceRecord) {
      Alert.alert('Sudah Presensi', 'Anda sudah melakukan presensi pada sesi ini.');
      return;
    }

    try {
      setSubmitting(true);
      const saved = await saveAttendance({
        sessionId: currentSession.id,
        classId: currentSession.classId,
        uid: profile.uid,
        studentName: profile.name,
        studentNim: profile.nim || '',
        notes: notes.trim(),
      });

      setAttendanceRecord(saved);
      setShowFeedbackModal(true);
    } catch (err: unknown) {
      const msg = getErrorMessage(err);
      Alert.alert('Gagal Presensi', msg);
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

  if (loadingSession && !currentSession) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <LoadingState message="Memuat informasi sesi..." />
      </SafeAreaView>
    );
  }

  if (sessionError && !currentSession) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ErrorState message={sessionError} onRetry={handleBack} retryText="Kembali" />
      </SafeAreaView>
    );
  }

  const sessionStatus = currentSession?.status || 'BELUM_DIBUKA';
  const sessionBadge = getSessionBadgeStyle(sessionStatus);
  const hasAttended = Boolean(attendanceRecord);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <OfflineBanner />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Navigation Bar */}
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBack}
            activeOpacity={0.7}
          >
            <Text style={styles.backButtonText}>← Kembali</Text>
          </TouchableOpacity>
          <View style={styles.appTitleContainer}>
            <Text style={styles.appTitle}>Presensi Praktikan</Text>
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

        {/* Read-only Student Identity Info Card (from useAuth profile) */}
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
            <Text style={styles.profileRoleBadge}>PRAKTIKAN AKTIF</Text>
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
          <View style={styles.gatingCardPending}>
            <View style={styles.gatingIconBoxYellow}>
              <Text style={styles.gatingIcon}>⏳</Text>
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
          <View style={styles.gatingCardClosed}>
            <View style={styles.gatingIconBoxRed}>
              <Text style={styles.gatingIcon}>🔒</Text>
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
              <Text style={styles.statusFixedText}>✓ Hadir di Laboratorium</Text>
            </View>

            {/* Optional Notes (e.g. PC table number) */}
            <Text style={styles.fieldLabel}>Nomor Meja Lab / Catatan (Opsional)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Contoh: Meja PC-04"
              placeholderTextColor="#9CA3AF"
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
              <Text style={styles.secureNoticeText}>
                🛡️ Sistem anti-double attendance akan mengunci presensi setelah
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
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  backButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#E5E7EB',
    borderRadius: 8,
    marginRight: 12,
  },
  backButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  appTitleContainer: {
    flex: 1,
  },
  appTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E3A8A',
  },
  sessionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sessionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  sessionTitleWrapper: {
    flex: 1,
    marginRight: 8,
  },
  sessionCourseTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  sessionModuleName: {
    fontSize: 13,
    color: '#4B5563',
    marginTop: 2,
  },
  sessionBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  sessionBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  sessionMetaDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 12,
  },
  sessionMetaGrid: {
    gap: 6,
  },
  sessionMetaItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  metaValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1F2937',
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  avatarBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
  profileInfo: {
    flex: 1,
  },
  profileRoleBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: '#059669',
    letterSpacing: 0.5,
  },
  profileName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 1,
  },
  profileNim: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 1,
  },
  attendanceLockedContainer: {
    marginBottom: 16,
  },
  gatingCardPending: {
    backgroundColor: '#FFFBEB',
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  gatingCardClosed: {
    backgroundColor: '#FEF2F2',
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  gatingIconBoxYellow: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  gatingIconBoxRed: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  gatingIcon: {
    fontSize: 24,
  },
  gatingTitlePending: {
    fontSize: 16,
    fontWeight: '700',
    color: '#B45309',
    marginBottom: 6,
  },
  gatingTitleClosed: {
    fontSize: 16,
    fontWeight: '700',
    color: '#B91C1C',
    marginBottom: 6,
  },
  gatingDescription: {
    fontSize: 13,
    color: '#4B5563',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 12,
  },
  gatingHintBox: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  gatingHintText: {
    fontSize: 11,
    color: '#6B7280',
    textAlign: 'center',
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 18,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  formSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  formSectionSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  statusFixedBox: {
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#86EFAC',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 16,
  },
  statusFixedText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#15803D',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#CED4DA',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    minHeight: 48,
    backgroundColor: '#FAFAFA',
    color: '#1F2937',
  },
  inputHelpText: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 4,
    marginBottom: 18,
  },
  submitButton: {
    backgroundColor: '#16A34A',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  secureNotice: {
    marginTop: 12,
    alignItems: 'center',
  },
  secureNoticeText: {
    fontSize: 11,
    color: '#6B7280',
    textAlign: 'center',
  },
});

export default StudentAttendanceScreen;
