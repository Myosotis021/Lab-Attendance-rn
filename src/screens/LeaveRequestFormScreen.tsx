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
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';
import useAuth from '../hooks/useAuth';
import { submitLeaveRequest, getExistingLeaveRequest } from '../services/leaveService';
import { LeaveRequest } from '../types/models';
import { getErrorMessage } from '../utils/errors';
import UserHeader from '../components/UserHeader';
import SentimentBadge from '../components/SentimentBadge';
import LeaveStatusBadge from '../components/LeaveStatusBadge';
import { INITIAL_SCHEDULES } from '../data/schedules';

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
  const { profile } = useAuth('praktikan');
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
        const q = query(
          collection(db, 'sessions'),
          where('status', '==', 'BELUM_DIBUKA')
        );
        const snapshot = await getDocs(q);
        const fetched: SessionOption[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          // Check if participantIds includes current student if field exists
          if (
            !data.participantIds ||
            data.participantIds.includes(profile.uid)
          ) {
            fetched.push({
              id: docSnap.id,
              courseTitle: data.courseTitle || 'Praktikum',
              moduleName: data.moduleName || 'Modul',
              classGroup: data.classGroup || '',
              roomName: data.roomName || '',
              timeSlot: data.timeSlot || '',
              status: data.status,
            });
          }
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
  }, [profile.uid]);

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

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Top Header */}
      <View style={styles.headerRow}>
        {onBack && (
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Kembali</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.pageTitle}>Pengajuan Izin Praktikan</Text>
      </View>

      {/* User Info Header */}
      <UserHeader profile={profile} />

      {/* Section 1: Choose Session */}
      <Text style={styles.sectionLabel}>Pilih Sesi Praktikum (BELUM DIBUKA)</Text>
      {loadingSessions ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="small" color="#2563EB" />
          <Text style={styles.loadingText}>Memuat sesi praktikum...</Text>
        </View>
      ) : sessions.length === 0 ? (
        <View style={styles.emptySessionBox}>
          <Text style={styles.emptySessionText}>
            Tidak ada sesi praktikum yang berstatus BELUM DIBUKA saat ini.
          </Text>
          <Text style={styles.emptySessionSubtext}>
            Pengajuan izin hanya dapat dilakukan sebelum sesi praktikum dibuka.
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
                activeOpacity={0.8}
              >
                <View style={styles.sessionCardHeader}>
                  <Text style={styles.sessionCourseTitle}>{sess.courseTitle}</Text>
                  <View style={styles.sessionStatusPill}>
                    <Text style={styles.sessionStatusText}>BELUM DIBUKA</Text>
                  </View>
                </View>
                <Text style={styles.sessionModuleName}>{sess.moduleName}</Text>
                {sess.timeSlot ? (
                  <Text style={styles.sessionTimeSlot}>🕒 {sess.timeSlot}</Text>
                ) : null}
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* Already Submitted Warning */}
      {checkingExisting ? (
        <ActivityIndicator size="small" color="#6B7280" style={{ marginVertical: 8 }} />
      ) : alreadySubmitted ? (
        <View style={styles.warningBox}>
          <Text style={styles.warningTitle}>⚠️ Perhatian</Text>
          <Text style={styles.warningText}>
            Anda sudah mengajukan izin untuk sesi ini. Satu praktikan hanya dapat
            mengajukan 1 kali per sesi.
          </Text>
        </View>
      ) : null}

      {/* Section 2: Reason Input */}
      <View style={styles.inputSection}>
        <View style={styles.labelRow}>
          <Text style={styles.sectionLabel}>Alasan Ketidakhadiran</Text>
          <Text
            style={[
              styles.charCounter,
              reason.length > 300 || (reason.length > 0 && reason.length < 10)
                ? styles.charCounterWarning
                : null,
            ]}
          >
            {reason.length}/300 karakter (min. 10)
          </Text>
        </View>

        <TextInput
          style={[
            styles.reasonInput,
            validationError ? styles.reasonInputError : null,
            alreadySubmitted ? styles.reasonInputDisabled : null,
          ]}
          placeholder="Contoh: Mengalami demam tinggi dan harus periksa ke dokter. Surat dokter akan saya susulkan."
          placeholderTextColor="#9CA3AF"
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
      </View>

      {/* Submit Error Box (with retry guidance, typed reason is kept intact) */}
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
        activeOpacity={0.8}
      >
        {submitting ? (
          <View style={styles.buttonLoadingRow}>
            <ActivityIndicator size="small" color="#FFFFFF" />
            <Text style={styles.submitButtonText}>Memproses Klasifikasi & Menyimpan...</Text>
          </View>
        ) : (
          <Text style={styles.submitButtonText}>Kirim Pengajuan</Text>
        )}
      </TouchableOpacity>

      {/* Success Modal / Summary Popup */}
      <Modal
        visible={Boolean(submittedResult)}
        transparent
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.summaryModal}>
            <View style={styles.successIconCircle}>
              <Text style={styles.successIconText}>✓</Text>
            </View>
            <Text style={styles.summaryTitle}>Pengajuan Izin Terkirim!</Text>
            <Text style={styles.summarySubtitle}>
              Pengajuan Anda telah berhasil dicatat di sistem dan menunggu keputusan asisten.
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
                <Text style={styles.summaryDisclaimer}>
                  *Hasil klasifikasi sentimen hanya informasi pendukung dan tidak menentukan keputusan izin.
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={styles.modalDoneButton}
              onPress={handleFinishSummary}
              activeOpacity={0.8}
            >
              <Text style={styles.modalDoneButtonText}>Lihat Daftar Izin Saya</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  headerRow: {
    marginBottom: 12,
  },
  backButton: {
    paddingVertical: 6,
    marginBottom: 8,
  },
  backButtonText: {
    color: '#2563EB',
    fontSize: 14,
    fontWeight: '600',
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 8,
  },
  loadingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 13,
    color: '#6B7280',
  },
  emptySessionBox: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FCD34D',
    borderWidth: 1,
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  emptySessionText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#92400E',
  },
  emptySessionSubtext: {
    fontSize: 12,
    color: '#B45309',
    marginTop: 4,
  },
  sessionList: {
    gap: 10,
    marginBottom: 16,
  },
  sessionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  sessionCardSelected: {
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
  },
  sessionCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  sessionCourseTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
    flex: 1,
  },
  sessionStatusPill: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  sessionStatusText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#D97706',
  },
  sessionModuleName: {
    fontSize: 13,
    color: '#4B5563',
  },
  sessionTimeSlot: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  warningBox: {
    backgroundColor: '#FEF2F2',
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#B91C1C',
    marginBottom: 2,
  },
  warningText: {
    fontSize: 13,
    color: '#991B1B',
    lineHeight: 18,
  },
  inputSection: {
    marginBottom: 16,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  charCounter: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '600',
  },
  charCounterWarning: {
    color: '#DC2626',
  },
  reasonInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CED4DA',
    borderRadius: 8,
    padding: 12,
    minHeight: 120,
    textAlignVertical: 'top',
    fontSize: 14,
    color: '#1F2937',
    marginTop: 4,
  },
  reasonInputError: {
    borderColor: '#DC2626',
    backgroundColor: '#FEF2F2',
  },
  reasonInputDisabled: {
    backgroundColor: '#F3F4F6',
    color: '#9CA3AF',
  },
  errorText: {
    fontSize: 12,
    color: '#DC2626',
    marginTop: 4,
    fontWeight: '500',
  },
  submitErrorBox: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  submitErrorText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#DC2626',
  },
  submitErrorSubtext: {
    fontSize: 12,
    color: '#7F1D1D',
    marginTop: 2,
  },
  submitButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  submitButtonDisabled: {
    backgroundColor: '#93C5FD',
    opacity: 0.6,
    elevation: 0,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  buttonLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  summaryModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    elevation: 8,
  },
  successIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  successIconText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#16A34A',
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 4,
  },
  summarySubtitle: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 18,
  },
  summaryCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 12,
    width: '100%',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 20,
    gap: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryFieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4B5563',
  },
  summaryFieldValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1F2937',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 4,
  },
  summaryDisclaimer: {
    fontSize: 10,
    color: '#6B7280',
    fontStyle: 'italic',
    lineHeight: 14,
    marginTop: 4,
  },
  modalDoneButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  modalDoneButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});

export default LeaveRequestFormScreen;

