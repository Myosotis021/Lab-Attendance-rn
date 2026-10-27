import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  AttendanceRecord,
  AttendanceStatus,
  SessionItem,
  SessionStatus,
} from '../types';
import AttendanceFeedbackModal from '../components/AttendanceFeedbackModal';
import StudentHistoryCard from '../components/StudentHistoryCard';

export interface StudentAttendanceScreenProps {
  initialSession?: SessionItem;
  onBack?: () => void;
}

// Default mock session matching SRS document
export const DEFAULT_MOCK_SESSION: SessionItem = {
  id: 'ses-1',
  courseTitle: 'Pemrograman Perangkat Komputasi',
  moduleName: 'Modul 1: Antarmuka & Alur Praktikum',
  classGroup: 'Kelas A',
  roomName: 'Lab Komputer 2',
  timeSlot: 'Jumat, 13:00 - 15:30 WIB',
  status: 'BERJALAN', // Default to active so student can test attendance immediately
};

// Dummy student identity specified in Developer 3 SRS
export const DUMMY_STUDENT_PROFILE = {
  name: 'Ahmad Fauzi',
  nim: '220101001',
  role: 'Praktikan' as const,
};

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
  }
};

export const StudentAttendanceScreen: React.FC<StudentAttendanceScreenProps> = ({
  initialSession,
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

  // Combine params or props with default session
  const fallbackSession: SessionItem = {
    id: initialSession?.id || searchParams.id || DEFAULT_MOCK_SESSION.id,
    courseTitle:
      initialSession?.courseTitle ||
      searchParams.courseTitle ||
      DEFAULT_MOCK_SESSION.courseTitle,
    moduleName:
      initialSession?.moduleName ||
      searchParams.moduleName ||
      DEFAULT_MOCK_SESSION.moduleName,
    classGroup:
      initialSession?.classGroup ||
      searchParams.classGroup ||
      DEFAULT_MOCK_SESSION.classGroup,
    roomName:
      initialSession?.roomName ||
      searchParams.roomName ||
      DEFAULT_MOCK_SESSION.roomName,
    timeSlot:
      initialSession?.timeSlot ||
      searchParams.timeSlot ||
      DEFAULT_MOCK_SESSION.timeSlot,
    status:
      initialSession?.status ||
      (searchParams.status as SessionStatus) ||
      DEFAULT_MOCK_SESSION.status,
  };

  // Current active session & simulation status state
  const [currentSession, setCurrentSession] = useState<SessionItem>(fallbackSession);

  // Form input state
  const [selectedStatus, setSelectedStatus] = useState<AttendanceStatus>('Hadir');
  const [notes, setNotes] = useState<string>('');

  // Attendance submission and anti-double attendance state
  const [hasAttended, setHasAttended] = useState<boolean>(false);
  const [attendanceRecord, setAttendanceRecord] = useState<AttendanceRecord | null>(null);

  // Success Feedback Modal state
  const [showFeedbackModal, setShowFeedbackModal] = useState<boolean>(false);

  // Handler for submitting attendance
  const handleSubmitAttendance = () => {
    // Only allow when session is active and not already attended
    if (currentSession.status !== 'BERJALAN' || hasAttended) {
      return;
    }

    // Record local system timestamp
    const now = new Date();
    const formattedTime =
      now.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }) + ' WIB';

    const newRecord: AttendanceRecord = {
      id: `att-${Date.now()}`,
      studentName: DUMMY_STUDENT_PROFILE.name,
      studentNim: DUMMY_STUDENT_PROFILE.nim,
      timestamp: formattedTime,
      status: selectedStatus,
      notes: notes.trim() ? notes.trim() : undefined,
    };

    setAttendanceRecord(newRecord);
    setHasAttended(true);
    setShowFeedbackModal(true);
  };

  // Helper to change session status dynamically for demo/testing
  const handleStatusChange = (newStatus: SessionStatus) => {
    setCurrentSession((prev) => ({
      ...prev,
      status: newStatus,
    }));
  };

  // Helper to reset attendance state for testing demo
  const handleResetForDemo = () => {
    setHasAttended(false);
    setAttendanceRecord(null);
    setNotes('');
    setSelectedStatus('Hadir');
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (router.canGoBack()) {
      router.back();
    }
  };

  const sessionBadge = getSessionBadgeStyle(currentSession.status);
  const canGoBack = Boolean(onBack || router.canGoBack());

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Navigation Bar / Title */}
        <View style={styles.topBar}>
          {canGoBack ? (
            <TouchableOpacity
              style={styles.backButton}
              onPress={handleBack}
              activeOpacity={0.7}
            >
              <Text style={styles.backButtonText}>← Kembali</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.appTitleContainer}>
              <Text style={styles.appSubtitle}>PRESENSI PRAKTIKUM</Text>
              <Text style={styles.appTitle}>Portal Praktikan</Text>
            </View>
          )}
          <View style={styles.devBadge}>
            <Text style={styles.devBadgeText}>DEV 3</Text>
          </View>
        </View>

        {/* Demo Session Status Switcher (As suggested in SRS 2.1 tips) */}
        <View style={styles.simulationContainer}>
          <Text style={styles.simulationLabel}>
            Simulasi Status Sesi (Demo Tester):
          </Text>
          <View style={styles.simulationButtonsRow}>
            {(['BELUM_DIBUKA', 'BERJALAN', 'SELESAI'] as SessionStatus[]).map(
              (status) => {
                const isActive = currentSession.status === status;
                return (
                  <TouchableOpacity
                    key={status}
                    style={[
                      styles.simBtn,
                      isActive && styles.simBtnActive,
                      status === 'BELUM_DIBUKA' && isActive && styles.simBtnPending,
                      status === 'BERJALAN' && isActive && styles.simBtnOpen,
                      status === 'SELESAI' && isActive && styles.simBtnClosed,
                    ]}
                    onPress={() => handleStatusChange(status)}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.simBtnText,
                        isActive && styles.simBtnTextActive,
                      ]}
                    >
                      {status === 'BELUM_DIBUKA'
                        ? 'Belum Dibuka'
                        : status === 'BERJALAN'
                        ? 'Berjalan'
                        : 'Selesai'}
                    </Text>
                  </TouchableOpacity>
                );
              }
            )}
          </View>
        </View>

        {/* Session Info Header Card */}
        <View style={styles.sessionCard}>
          <View style={styles.sessionHeaderRow}>
            <View style={styles.sessionTitleWrapper}>
              <Text style={styles.sessionCourseTitle}>
                {currentSession.courseTitle}
              </Text>
              <Text style={styles.sessionModuleName}>
                {currentSession.moduleName}
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
                {currentSession.classGroup} • {currentSession.roomName}
              </Text>
            </View>
            <View style={styles.sessionMetaItem}>
              <Text style={styles.metaLabel}>Jadwal Praktikum:</Text>
              <Text style={styles.metaValue}>{currentSession.timeSlot}</Text>
            </View>
          </View>
        </View>

        {/* Read-only Student Identity Info Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarBox}>
            <Text style={styles.avatarText}>AF</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileRoleBadge}>PRAKTIKAN AKTIF</Text>
            <Text style={styles.profileName}>{DUMMY_STUDENT_PROFILE.name}</Text>
            <Text style={styles.profileNim}>NIM: {DUMMY_STUDENT_PROFILE.nim}</Text>
          </View>
        </View>

        {/* Conditional Content based on Session Status and Attendance State */}
        {currentSession.status === 'BELUM_DIBUKA' ? (
          /* Gating 1: Session not yet opened */
          <View style={styles.gatingCardPending}>
            <View style={styles.gatingIconBoxYellow}>
              <Text style={styles.gatingIcon}>⏳</Text>
            </View>
            <Text style={styles.gatingTitlePending}>Sesi Belum Dibuka</Text>
            <Text style={styles.gatingDescription}>
              Sesi praktikum belum dibuka oleh asisten lab. Pengisian presensi
              belum tersedia.
            </Text>
            <View style={styles.gatingHintBox}>
              <Text style={styles.gatingHintText}>
                Silakan tunggu hingga asisten membuka sesi praktikum ini.
              </Text>
            </View>
          </View>
        ) : currentSession.status === 'SELESAI' ? (
          /* Gating 2: Session already ended */
          <View style={styles.gatingCardClosed}>
            <View style={styles.gatingIconBoxRed}>
              <Text style={styles.gatingIcon}>🔒</Text>
            </View>
            <Text style={styles.gatingTitleClosed}>Sesi Telah Selesai</Text>
            <Text style={styles.gatingDescription}>
              Sesi praktikum telah ditutup. Pengisian presensi sudah berakhir.
            </Text>

            {/* If the student previously attended before closing, show history */}
            {hasAttended && attendanceRecord ? (
              <View style={styles.historyWrapper}>
                <StudentHistoryCard
                  attendance={attendanceRecord}
                  sessionTitle={`${currentSession.courseTitle} (${currentSession.classGroup})`}
                  onViewFeedback={() => setShowFeedbackModal(true)}
                  onResetForDemo={handleResetForDemo}
                />
              </View>
            ) : (
              <View style={styles.gatingHintBox}>
                <Text style={styles.gatingHintText}>
                  Batas waktu presensi telah berakhir. Anda tidak dapat mengisi
                  presensi pada sesi ini lagi.
                </Text>
              </View>
            )}
          </View>
        ) : hasAttended && attendanceRecord ? (
          /* Anti-Double Attendance: Form hidden/locked and replaced by history proof */
          <View style={styles.attendanceLockedContainer}>
            <StudentHistoryCard
              attendance={attendanceRecord}
              sessionTitle={`${currentSession.courseTitle} (${currentSession.classGroup})`}
              onViewFeedback={() => setShowFeedbackModal(true)}
              onResetForDemo={handleResetForDemo}
            />
          </View>
        ) : (
          /* Active Attendance Form (When BERJALAN and not yet attended) */
          <View style={styles.formCard}>
            <Text style={styles.formSectionTitle}>Formulir Kehadiran</Text>
            <Text style={styles.formSectionSubtitle}>
              Pilih status kehadiran Anda dan isi nomor meja laboratorium.
            </Text>

            {/* Status Pills Selection */}
            <Text style={styles.fieldLabel}>Status Kehadiran *</Text>
            <View style={styles.pillsRow}>
              {(['Hadir', 'Izin', 'Sakit'] as AttendanceStatus[]).map((status) => {
                const isSelected = selectedStatus === status;

                let activeBg = '#16A34A';
                let activeBorder = '#15803D';
                let activeColor = '#FFFFFF';

                if (status === 'Izin') {
                  activeBg = '#D97706';
                  activeBorder = '#B45309';
                  activeColor = '#FFFFFF';
                } else if (status === 'Sakit') {
                  activeBg = '#2563EB';
                  activeBorder = '#1D4ED8';
                  activeColor = '#FFFFFF';
                }

                return (
                  <TouchableOpacity
                    key={status}
                    style={[
                      styles.pillButton,
                      isSelected && {
                        backgroundColor: activeBg,
                        borderColor: activeBorder,
                      },
                    ]}
                    onPress={() => setSelectedStatus(status)}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.pillText,
                        isSelected && {
                          color: activeColor,
                          fontWeight: '700',
                        },
                      ]}
                    >
                      {status === 'Hadir' ? '✓ Hadir' : status}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Optional Notes (e.g. PC table number) */}
            <Text style={styles.fieldLabel}>Catatan Tambahan (Opsional)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Contoh: Nomor Meja Lab: PC-04"
              placeholderTextColor="#9CA3AF"
              value={notes}
              onChangeText={setNotes}
              maxLength={100}
            />
            <Text style={styles.inputHelpText}>
              Bisa diisi nomor PC lab atau keterangan izin / sakit Anda.
            </Text>

            {/* Submit Button */}
            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleSubmitAttendance}
              activeOpacity={0.85}
            >
              <Text style={styles.submitButtonText}>
                Kirim Presensi Sekarang
              </Text>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  backButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#E5E7EB',
    borderRadius: 8,
  },
  backButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  appTitleContainer: {
    flex: 1,
  },
  appSubtitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.8,
  },
  appTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  devBadge: {
    backgroundColor: '#E0E7FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  devBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#4338CA',
  },
  simulationContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  simulationLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  simulationButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  simBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  simBtnActive: {
    borderWidth: 1.5,
  },
  simBtnPending: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
  },
  simBtnOpen: {
    backgroundColor: '#DCFCE7',
    borderColor: '#16A34A',
  },
  simBtnClosed: {
    backgroundColor: '#FEE2E2',
    borderColor: '#EF4444',
  },
  simBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  simBtnTextActive: {
    color: '#0F172A',
    fontWeight: '700',
  },
  sessionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
  },
  sessionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  sessionTitleWrapper: {
    flex: 1,
    paddingRight: 8,
  },
  sessionCourseTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  sessionModuleName: {
    fontSize: 13,
    fontWeight: '500',
    color: '#475569',
    marginTop: 2,
  },
  sessionBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  sessionBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  sessionMetaDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
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
    color: '#64748B',
    fontWeight: '500',
  },
  metaValue: {
    fontSize: 12,
    color: '#1E293B',
    fontWeight: '600',
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  avatarBox: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  profileInfo: {
    flex: 1,
  },
  profileRoleBadge: {
    fontSize: 10,
    fontWeight: '800',
    color: '#2563EB',
    letterSpacing: 0.5,
  },
  profileName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  profileNim: {
    fontSize: 12,
    color: '#64748B',
    fontFamily: 'monospace',
    marginTop: 1,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
  },
  formSectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  formSectionSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 18,
    lineHeight: 17,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 8,
  },
  pillsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 18,
  },
  pillButton: {
    flex: 1,
    minHeight: 46,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#CED4DA',
    borderRadius: 8,
    padding: 12,
    minHeight: 48,
    fontSize: 14,
    color: '#0F172A',
    backgroundColor: '#FFFFFF',
  },
  inputHelpText: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 6,
    marginBottom: 20,
  },
  submitButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  secureNotice: {
    marginTop: 14,
    alignItems: 'center',
  },
  secureNoticeText: {
    fontSize: 11,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 16,
  },
  gatingCardPending: {
    backgroundColor: '#FFFBEB',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginBottom: 20,
  },
  gatingCardClosed: {
    backgroundColor: '#FEF2F2',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FECACA',
    marginBottom: 20,
  },
  gatingIconBoxYellow: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  gatingIconBoxRed: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  gatingIcon: {
    fontSize: 28,
  },
  gatingTitlePending: {
    fontSize: 17,
    fontWeight: '800',
    color: '#B45309',
    marginBottom: 8,
    textAlign: 'center',
  },
  gatingTitleClosed: {
    fontSize: 17,
    fontWeight: '800',
    color: '#B91C1C',
    marginBottom: 8,
    textAlign: 'center',
  },
  gatingDescription: {
    fontSize: 13,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 19,
    paddingHorizontal: 10,
    marginBottom: 16,
  },
  gatingHintBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  gatingHintText: {
    fontSize: 11,
    color: '#64748B',
    textAlign: 'center',
  },
  historyWrapper: {
    width: '100%',
    marginTop: 10,
  },
  attendanceLockedContainer: {
    width: '100%',
  },
});

export default StudentAttendanceScreen;
