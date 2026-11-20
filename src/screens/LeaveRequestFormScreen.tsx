import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';
import useAuth from '../hooks/useAuth';
import { submitLeaveRequest, getExistingLeaveRequest } from '../services/leaveService';
import { LeaveRequest } from '../types/models';
import { getErrorMessage } from '../utils/errors';
import SentimentBadge from '../components/SentimentBadge';
import LeaveStatusBadge from '../components/LeaveStatusBadge';
import ErrorState from '../components/ErrorState';
import { INITIAL_SCHEDULES } from '../data/schedules';
import { theme } from '../theme';

interface SessionOption {
  id: string;
  courseTitle: string;
  moduleName: string;
  classGroup?: string;
  roomName?: string;
  timeSlot?: string;
  status: string;
}

interface LeaveRequestFormScreenProps {
  onSuccessNavigate?: () => void;
  onBack?: () => void;
}

export const LeaveRequestFormScreen: React.FC<LeaveRequestFormScreenProps> = ({
  onSuccessNavigate,
  onBack,
}) => {
  const { profile } = useAuth();
  const [sessions, setSessions] = useState<SessionOption[]>([]);
  const [loadingSessions, setLoadingSessions] = useState<boolean>(true);
  const [selectedSession, setSelectedSession] = useState<SessionOption | null>(null);

  const [reason, setReason] = useState<string>('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const [alreadySubmitted, setAlreadySubmitted] = useState<boolean>(false);
  const [checkingExisting, setCheckingExisting] = useState<boolean>(false);

  // Success modal/summary
  const [submittedResult, setSubmittedResult] = useState<LeaveRequest | null>(null);

  // Load BELUM_DIBUKA sessions
  useEffect(() => {
    let isMounted = true;
    async function loadSessions() {
      setLoadingSessions(true);
      try {
        const q = profile?.uid
          ? query(
              collection(db, 'sessions'),
              where('status', '==', 'BELUM_DIBUKA'),
              where('participantIds', 'array-contains', profile.uid)
            )
          : query(
              collection(db, 'sessions'),
              where('status', '==', 'BELUM_DIBUKA')
            );
        const snapshot = await getDocs(q);
        const fetched: SessionOption[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          fetched.push({
            id: docSnap.id,
            courseTitle: data.courseTitle || 'Praktikum',
            moduleName: data.moduleName || 'Modul',
            classGroup: data.classGroup || '',
            roomName: data.roomName || '',
            timeSlot: data.timeSlot || '',
            status: data.status,
          });
        });

        if (fetched.length > 0 && isMounted) {
          setSessions(fetched);
          setSelectedSession(fetched[0]);
        } else if (isMounted) {
          // Fallback to local schedules for demo/offline
          const localBelum = INITIAL_SCHEDULES.filter(
            (s) => s.status === 'BELUM_DIBUKA'
          );
          setSessions(localBelum);
          if (localBelum.length > 0) {
            setSelectedSession(localBelum[0]);
          }
        }
      } catch {
        // Fallback to local schedules
        if (isMounted) {
          const localBelum = INITIAL_SCHEDULES.filter(
            (s) => s.status === 'BELUM_DIBUKA'
          );
          setSessions(localBelum);
          if (localBelum.length > 0) {
            setSelectedSession(localBelum[0]);
          }
        }
      } finally {
        if (isMounted) setLoadingSessions(false);
      }
    }

    loadSessions();
    return () => {
      isMounted = false;
    };
  }, [profile?.uid]);

  // Check if current student already submitted request for the selected session
  useEffect(() => {
    let isMounted = true;
    async function checkExisting() {
      if (!selectedSession || !profile.uid) return;
      setCheckingExisting(true);
      setAlreadySubmitted(false);
      try {
        const existing = await getExistingLeaveRequest(
          selectedSession.id,
          profile.uid
        );
        if (existing && isMounted) {
          setAlreadySubmitted(true);
        }
      } catch {
        // If offline check fails, ignore here
      } finally {
        if (isMounted) setCheckingExisting(false);
      }
    }

    checkExisting();
    return () => {
      isMounted = false;
    };
  }, [selectedSession, profile.uid]);

  const handleReasonChange = (text: string) => {
    setReason(text);
    if (validationError) {
      if (text.trim().length >= 10 && text.length <= 300) {
        setValidationError(null);
      }
    }
  };

  const handleSubmit = async () => {
    setSubmitError(null);

    // Validation
    if (!selectedSession) {
      setValidationError('Silakan pilih sesi praktikum terlebih dahulu.');
      return;
    }

    const trimmed = reason.trim();
    if (!trimmed) {
      setValidationError('Alasan ketidakhadiran wajib diisi.');
      return;
    }

    if (trimmed.length < 10) {
      setValidationError(
        `Alasan minimal 10 karakter (saat ini ${trimmed.length} karakter).`
      );
      return;
    }

    if (trimmed.length > 300) {
      setValidationError(
        `Alasan maksimal 300 karakter (saat ini ${trimmed.length} karakter).`
      );
      return;
    }

    setValidationError(null);
    setSubmitting(true);

    try {
      const result = await submitLeaveRequest({
        session: {
          id: selectedSession.id,
          courseTitle: selectedSession.courseTitle,
          moduleName: selectedSession.moduleName,
        },
        profile: {
          uid: profile.uid,
          name: profile.name,
          nim: profile.nim || undefined,
        },
        reason: trimmed,
      });

      setSubmittedResult(result);
    } catch (err: any) {
      const msg = getErrorMessage(err);
      setSubmitError(msg);
      if (msg.includes('sudah mengajukan izin')) {
        setAlreadySubmitted(true);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleFinishSummary = () => {
    setSubmittedResult(null);
    setReason('');
    if (onSuccessNavigate) {
      onSuccessNavigate();
    }
  };

  if (profile?.role === 'asisten') {
    return (
      <LinearGradient colors={theme.colors.backgroundGradient} style={styles.flexOne}>
        <SafeAreaView style={styles.safeArea}>
          <ErrorState
            title="Akses Ditolak"
            message="Halaman pengajuan izin khusus untuk Mahasiswa Praktikan."
            onRetry={onBack}
            retryText="Kembali"
          />
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={theme.colors.backgroundGradient} style={styles.flexOne}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <StatusBar style="dark" />

        <ScrollView
          style={styles.flexOne}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Top Header */}
          <View style={styles.topBar}>
            {onBack && (
              <TouchableOpacity
                onPress={onBack}
                style={styles.backButton}
                activeOpacity={0.7}
              >
                <Feather name="arrow-left" size={20} color={theme.colors.textPrimary} />
              </TouchableOpacity>
            )}
            <View style={styles.headerTitleGroup}>
              <Text style={styles.screenTitle}>Pengajuan Izin</Text>
              <Text style={styles.screenSubtitle}>Layanan Mandiri Praktikan</Text>
            </View>
          </View>

          {/* Section 1: Choose Session */}
          <Text style={styles.sectionLabel}>Pilih Sesi Praktikum</Text>
          {loadingSessions ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="small" color={theme.colors.textPrimary} />
              <Text style={styles.loadingText}>Memuat sesi praktikum...</Text>
            </View>
          ) : sessions.length === 0 ? (
            <View style={styles.emptySessionCard}>
              <Feather name="calendar" size={24} color={theme.colors.textMuted} />
              <Text style={styles.emptySessionText}>
                Tidak ada sesi praktikum berstatus BELUM DIBUKA.
              </Text>
              <Text style={styles.emptySessionSubtext}>
                Pengajuan izin hanya dapat dilakukan sebelum sesi praktikum dibuka oleh asisten.
              </Text>
            </View>
          ) : (
            <View style={styles.sessionList}>
              {sessions.map((sess) => {
                const isSelected = selectedSession?.id === sess.id;
                return (
                  <TouchableOpacity
                    key={sess.id}
                    style={[
                      styles.sessionCard,
                      isSelected && styles.sessionCardSelected,
                    ]}
                    onPress={() => setSelectedSession(sess)}
                    activeOpacity={0.85}
                  >
                    <View style={styles.sessionCardHeader}>
                      <Text style={styles.sessionCourseTitle} numberOfLines={1}>
                        {sess.courseTitle}
                      </Text>
                      <View style={styles.sessionStatusPill}>
                        <Text style={styles.sessionStatusText}>BELUM DIBUKA</Text>
                      </View>
                    </View>
                    <Text style={styles.sessionModuleName}>{sess.moduleName}</Text>
                    {sess.timeSlot ? (
                      <View style={styles.timeRow}>
                        <Feather name="clock" size={12} color={theme.colors.textMuted} />
                        <Text style={styles.sessionTimeSlot}>{sess.timeSlot}</Text>
                      </View>
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* Already Submitted Warning */}
          {checkingExisting ? (
            <ActivityIndicator size="small" color={theme.colors.textMuted} style={{ marginVertical: 8 }} />
          ) : alreadySubmitted ? (
            <View style={styles.warningBox}>
              <Feather name="alert-triangle" size={16} color="#D97706" style={styles.warningIcon} />
              <View style={styles.warningTextCol}>
                <Text style={styles.warningTitle}>Perhatian</Text>
                <Text style={styles.warningText}>
                  Anda sudah mengajukan izin untuk sesi ini. Satu praktikan hanya dapat
                  mengajukan 1 kali per sesi.
                </Text>
              </View>
            </View>
          ) : null}

          {/* Section 2: Reason Input Card */}
          <View style={styles.formCard}>
            <View style={styles.labelRow}>
              <Text style={styles.formCardTitle}>Alasan Ketidakhadiran</Text>
              <Text
                style={[
                  styles.charCounter,
                  reason.length > 300 || (reason.length > 0 && reason.length < 10)
                    ? styles.charCounterWarning
                    : null,
                ]}
              >
                {reason.length}/300 (min. 10)
              </Text>
            </View>

            <TextInput
              style={[
                styles.reasonInput,
                validationError ? styles.reasonInputError : null,
                alreadySubmitted ? styles.reasonInputDisabled : null,
              ]}
              placeholder="Contoh: Mengalami demam tinggi dan harus periksa ke dokter. Surat dokter akan saya susulkan."
              placeholderTextColor={theme.colors.textMuted}
              multiline
              numberOfLines={5}
              value={reason}
              onChangeText={handleReasonChange}
              maxLength={350}
              editable={!submitting && !alreadySubmitted}
            />

            {validationError && (
              <Text style={styles.errorText}>{validationError}</Text>
            )}

            {/* Submit Error Box */}
            {submitError && (
              <View style={styles.submitErrorBox}>
                <Text style={styles.submitErrorText}>Gagal mengirim: {submitError}</Text>
                <Text style={styles.submitErrorSubtext}>
                  Alasan Anda tetap tersimpan. Silakan periksa koneksi dan coba lagi.
                </Text>
              </View>
            )}

            {/* Submit Button */}
            <TouchableOpacity
              style={[
                styles.submitButton,
                (submitting || alreadySubmitted || sessions.length === 0) &&
                  styles.submitButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={submitting || alreadySubmitted || sessions.length === 0}
              activeOpacity={0.85}
            >
              {submitting ? (
                <View style={styles.buttonLoadingRow}>
                  <ActivityIndicator size="small" color="#FFFFFF" />
                  <Text style={styles.submitButtonText}>Memproses & Menganalisis AI...</Text>
                </View>
              ) : (
                <Text style={styles.submitButtonText}>Kirim Pengajuan Izin</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Success Modal / Summary Popup */}
        <Modal
          visible={Boolean(submittedResult)}
          transparent
          animationType="fade"
        >
          <View style={styles.modalOverlay}>
            <View style={styles.summaryModal}>
              <View style={styles.successIconCircle}>
                <Feather name="check" size={26} color="#FFFFFF" />
              </View>
              <Text style={styles.summaryTitle}>Pengajuan Izin Terkirim!</Text>
              <Text style={styles.summarySubtitle}>
                Pengajuan Anda telah berhasil dicatat di sistem dan menunggu keputusan asisten lab.
              </Text>

              {submittedResult && (
                <View style={styles.summaryCard}>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryFieldLabel}>Praktikum:</Text>
                    <Text style={styles.summaryFieldValue}>
                      {submittedResult.courseTitle}
                    </Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryFieldLabel}>Modul:</Text>
                    <Text style={styles.summaryFieldValue}>
                      {submittedResult.moduleName}
                    </Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryFieldLabel}>Status:</Text>
                    <LeaveStatusBadge status={submittedResult.status} />
                  </View>
                  <View style={styles.summaryDivider} />
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryFieldLabel}>Hasil AI:</Text>
                    <SentimentBadge sentiment={submittedResult.sentiment} />
                  </View>
                </View>
              )}

              <TouchableOpacity
                style={styles.modalFinishButton}
                onPress={handleFinishSummary}
                activeOpacity={0.85}
              >
                <Text style={styles.modalFinishButtonText}>Selesai & Tutup</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
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
    marginRight: 12,
    ...theme.shadows.subtle,
  },
  headerTitleGroup: {
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
  sectionLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: theme.colors.textPrimary,
    marginBottom: 10,
    marginTop: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  loadingBox: {
    backgroundColor: theme.colors.surface,
    padding: 18,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  emptySessionCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    gap: 6,
    ...theme.shadows.card,
  },
  emptySessionText: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    textAlign: 'center',
    marginTop: 4,
  },
  emptySessionSubtext: {
    fontSize: 12,
    color: theme.colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
  sessionList: {
    gap: 10,
    marginBottom: 16,
  },
  sessionCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: 16,
    borderWidth: 1.5,
    borderColor: 'transparent',
    ...theme.shadows.card,
  },
  sessionCardSelected: {
    borderColor: theme.colors.textPrimary,
    backgroundColor: '#FAF9FC',
  },
  sessionCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  sessionCourseTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: theme.colors.textPrimary,
    flex: 1,
    marginRight: 8,
  },
  sessionStatusPill: {
    backgroundColor: theme.colors.status.belumDibuka.bg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.borderRadius.full,
  },
  sessionStatusText: {
    fontSize: 9,
    fontWeight: '800',
    color: theme.colors.status.belumDibuka.text,
  },
  sessionModuleName: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginBottom: 6,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sessionTimeSlot: {
    fontSize: 11,
    color: theme.colors.textMuted,
    fontWeight: '500',
  },
  warningBox: {
    flexDirection: 'row',
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: theme.borderRadius.lg,
    padding: 14,
    marginBottom: 16,
  },
  warningIcon: {
    marginRight: 8,
    marginTop: 2,
  },
  warningTextCol: {
    flex: 1,
  },
  warningTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#92400E',
    marginBottom: 2,
  },
  warningText: {
    fontSize: 12,
    color: '#78350F',
    lineHeight: 17,
  },
  formCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xxl,
    padding: 20,
    marginBottom: 16,
    ...theme.shadows.card,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  formCardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: theme.colors.textPrimary,
  },
  charCounter: {
    fontSize: 11,
    color: theme.colors.textMuted,
  },
  charCounterWarning: {
    color: '#D97706',
    fontWeight: '700',
  },
  reasonInput: {
    backgroundColor: theme.colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    padding: 14,
    fontSize: 13,
    color: theme.colors.textPrimary,
    minHeight: 110,
    textAlignVertical: 'top',
    marginBottom: 6,
  },
  reasonInputError: {
    borderColor: '#EF4444',
    backgroundColor: '#FFF5F5',
  },
  reasonInputDisabled: {
    opacity: 0.6,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginBottom: 12,
  },
  submitErrorBox: {
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: theme.borderRadius.md,
    marginBottom: 14,
  },
  submitErrorText: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '700',
  },
  submitErrorSubtext: {
    color: '#991B1B',
    fontSize: 11,
    marginTop: 2,
  },
  submitButton: {
    backgroundColor: theme.colors.textPrimary,
    borderRadius: theme.borderRadius.md,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    ...theme.shadows.subtle,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  buttonLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  summaryModal: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xxl,
    padding: 24,
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
    ...theme.shadows.card,
  },
  successIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#166534',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: theme.colors.textPrimary,
    textAlign: 'center',
    marginBottom: 6,
  },
  summarySubtitle: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 18,
  },
  summaryCard: {
    backgroundColor: theme.colors.surfaceSubtle,
    borderRadius: theme.borderRadius.lg,
    padding: 14,
    width: '100%',
    gap: 8,
    marginBottom: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryFieldLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  summaryFieldValue: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: theme.colors.borderLight,
    marginVertical: 4,
  },
  modalFinishButton: {
    backgroundColor: theme.colors.textPrimary,
    borderRadius: theme.borderRadius.md,
    paddingVertical: 13,
    width: '100%',
    alignItems: 'center',
  },
  modalFinishButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
});

export default LeaveRequestFormScreen;
