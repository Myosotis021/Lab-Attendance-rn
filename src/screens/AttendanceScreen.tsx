import React, { useState, useEffect, useMemo } from 'react';
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
import {
  AttendanceRecord,
  SessionItem,
  SessionStatus,
  LocationSnapshot,
  LabLocation,
} from '../types/models';
import { LocationStatusCard } from '../components/LocationStatusCard';
import { useCurrentLocation } from '../hooks/useCurrentLocation';
import { useLabLocations } from '../hooks/useLabLocations';
import { isWithinLabRadius } from '../services/locationService';
import {
  submitAttendance,
  listenMyAttendanceForSession,
} from '../services/attendanceService';
import { listenSession } from '../services/sessionService';
import { useAuth } from '../hooks/useAuth';

export interface AttendanceScreenProps {
  sessionId?: string;
  onBack?: () => void;
}

export const AttendanceScreen: React.FC<AttendanceScreenProps> = ({
  sessionId: propSessionId,
  onBack,
}) => {
  const router = useRouter();
  const searchParams = useLocalSearchParams<{
    sessionId?: string;
    id?: string;
    courseTitle?: string;
    moduleName?: string;
    classGroup?: string;
    roomName?: string;
    timeSlot?: string;
    status?: SessionStatus;
  }>();

  const sessionId =
    propSessionId || searchParams.sessionId || searchParams.id || 'ses-1';

  const { profile } = useAuth();
  const { labs } = useLabLocations();
  const {
    location,
    permissionStatus,
    refreshLocation,
  } = useCurrentLocation(true);

  // Session state
  const [session, setSession] = useState<SessionItem | null>(() => {
    if (searchParams.courseTitle) {
      return {
        id: sessionId,
        courseTitle: searchParams.courseTitle,
        moduleName: searchParams.moduleName || '',
        classGroup: searchParams.classGroup || '',
        roomName: searchParams.roomName || 'Lab Komputer 1',
        timeSlot: searchParams.timeSlot || '',
        status: (searchParams.status as SessionStatus) || 'BERJALAN',
      };
    }
    return null;
  });

  const [loadingSession, setLoadingSession] = useState<boolean>(!session);
  const [notes, setNotes] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [attendanceRecord, setAttendanceRecord] =
    useState<AttendanceRecord | null>(null);

  // 1. Listen ke data sesi secara real-time
  useEffect(() => {
    if (!sessionId) return;
    const unsub = listenSession(sessionId, (updated) => {
      if (updated) {
        setSession(updated);
      }
      setLoadingSession(false);
    });
    return () => unsub();
  }, [sessionId]);

  // 2. Listen ke data riwayat presensi saya pada sesi ini
  const currentUid = profile?.uid || 'student-220101001';
  useEffect(() => {
    if (!sessionId || !currentUid) return;
    const unsub = listenMyAttendanceForSession(sessionId, currentUid, (rec) => {
      setAttendanceRecord(rec);
    });
    return () => unsub();
  }, [sessionId, currentUid]);

  // 3. Cocokkan sesi dengan lab lokasi terdaftar
  const matchedLab: LabLocation | null = useMemo(() => {
    if (!session || labs.length === 0) return labs[0] || null;
    const room = (session.roomName || '').toLowerCase().trim();

    // Cocokkan persis atau sebagian
    const found = labs.find(
      (l) =>
        l.name.toLowerCase().includes(room) ||
        room.includes(l.name.toLowerCase()) ||
        l.id.toLowerCase().includes(room)
    );

    return found || labs[0] || null;
  }, [session, labs]);

  // 4. Kalkulasi radius dan jarak dengan formula Haversine
  const radiusCalculation = useMemo(() => {
    if (!location?.coords || !matchedLab) {
      return { withinRadius: null, distanceMeters: null };
    }
    return isWithinLabRadius(
      location.coords.latitude,
      location.coords.longitude,
      matchedLab
    );
  }, [location, matchedLab]);

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  const handleOpenMap = () => {
    router.push('/lab-map');
  };

  const handleSubmit = async () => {
    if (!session) {
      Alert.alert('Error', 'Data sesi tidak ditemukan.');
      return;
    }

    // A. Validasi status sesi (Hanya boleh presensi jika BERJALAN)
    if (session.status !== 'BERJALAN') {
      Alert.alert(
        'Presensi Ditolak',
        'Sesi praktikum belum dibuka oleh asisten.'
      );
      return;
    }

    // B. Validasi izin & ketersediaan lokasi
    if (permissionStatus === 'denied' || location?.error === 'DENIED') {
      Alert.alert(
        'Akses Lokasi Ditolak',
        'Akses lokasi diperlukan untuk presensi. Aktifkan di pengaturan.'
      );
      return;
    }

    if (location?.error === 'UNAVAILABLE') {
      Alert.alert(
        'GPS Tidak Aktif',
        'Layanan lokasi tidak aktif. Nyalakan GPS perangkat Anda.'
      );
      return;
    }

    if (!location?.coords) {
      Alert.alert(
        'Lokasi Belum Tersedia',
        'Lokasi belum tersedia. Pindah ke tempat dengan sinyal GPS lebih baik.'
      );
      return;
    }

    // C. Validasi radius lokasi (Haversine)
    if (!matchedLab) {
      Alert.alert('Error', 'Data lokasi laboratorium tidak ditemukan.');
      return;
    }

    if (!radiusCalculation.withinRadius) {
      Alert.alert(
        'Di Luar Radius Presensi',
        `Anda berada ${radiusCalculation.distanceMeters ?? '?'} meter dari lab. Radius presensi: ${matchedLab.radiusMeters} meter.`
      );
      return;
    }

    // D. Anti-double presensi
    if (attendanceRecord) {
      Alert.alert(
        'Sudah Presensi',
        'Anda sudah melakukan presensi pada sesi ini.'
      );
      return;
    }

    // E. Semua lolos -> Submit dengan snapshot lokasi
    setSubmitting(true);
    try {
      const locationSnapshot: LocationSnapshot = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
        distanceToLab: radiusCalculation.distanceMeters || 0,
        withinRadius: true,
      };

      const result = await submitAttendance({
        sessionId: session.id,
        classId: session.classId || '',
        uid: currentUid,
        studentName: profile?.name || 'Ahmad Fauzi',
        studentNim: profile?.nim || '220101001',
        notes,
        locationSnapshot,
      });

      setAttendanceRecord(result);
      Alert.alert(
        'Presensi Berhasil!',
        `Presensi Anda tercatat pada ${result.timestamp}.\nJarak ke lab: ${locationSnapshot.distanceToLab} meter.`
      );
    } catch (err: any) {
      Alert.alert('Gagal Presensi', err?.message || 'Terjadi kesalahan sistem.');
    } finally {
      setSubmitting(false);
    }
  };

  // Status Badge styling
  const isSessionOpen = session?.status === 'BERJALAN';
  const isSessionFinished = session?.status === 'SELESAI';

  let badgeBg = '#FEF3C7';
  let badgeText = '#B45309';
  let badgeLabel = 'BELUM DIBUKA';

  if (isSessionOpen) {
    badgeBg = '#DCFCE7';
    badgeText = '#15803D';
    badgeLabel = 'BERJALAN';
  } else if (isSessionFinished) {
    badgeBg = '#FEE2E2';
    badgeText = '#B91C1C';
    badgeLabel = 'SELESAI';
  }

  const canSubmit =
    isSessionOpen &&
    radiusCalculation.withinRadius === true &&
    permissionStatus === 'granted' &&
    !submitting &&
    !attendanceRecord;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar style="dark" />

      {/* Header Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBack}
          activeOpacity={0.7}
        >
          <Text style={{ fontSize: 18, fontWeight: '700', color: '#111827' }}>←</Text>
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Presensi Laboratorium</Text>
        <TouchableOpacity
          style={styles.mapIconButton}
          onPress={handleOpenMap}
          activeOpacity={0.7}
        >
          <Text style={{ fontSize: 16 }}>🗺️</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {loadingSession ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#2563EB" />
            <Text style={styles.loadingText}>Memuat informasi sesi...</Text>
          </View>
        ) : !session ? (
          <View style={styles.emptyBox}>
            <Text style={{ fontSize: 36 }}>⚠️</Text>
            <Text style={styles.emptyTitle}>Sesi Tidak Ditemukan</Text>
            <Text style={styles.emptySubtitle}>
              Silakan kembali dan pilih sesi praktikum yang valid.
            </Text>
          </View>
        ) : (
          <>
            {/* Kartu Informasi Sesi */}
            <View style={styles.sessionCard}>
              <View style={styles.sessionCardHeader}>
                <View style={[styles.badgeContainer, { backgroundColor: badgeBg }]}>
                  <Text style={[styles.badgeText, { color: badgeText }]}>
                    {badgeLabel}
                  </Text>
                </View>
                <Text style={styles.classGroupText}>{session.classGroup}</Text>
              </View>

              <Text style={styles.courseTitle}>{session.courseTitle}</Text>
              <Text style={styles.moduleName}>{session.moduleName}</Text>

              <View style={styles.metaDivider} />

              <View style={styles.metaRow}>
                <Text style={{ fontSize: 14 }}>📍</Text>
                <Text style={styles.metaValue}>Ruang: {session.roomName}</Text>
              </View>
              <View style={styles.metaRow}>
                <Text style={{ fontSize: 14 }}>🕒</Text>
                <Text style={styles.metaValue}>{session.timeSlot}</Text>
              </View>
            </View>

            {/* Kartu Profil Praktikan */}
            <View style={styles.studentCard}>
              <View style={styles.avatarBox}>
                <Text style={styles.avatarText}>
                  {(profile?.name || 'A').charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.studentInfo}>
                <Text style={styles.studentName}>
                  {profile?.name || 'Ahmad Fauzi'}
                </Text>
                <Text style={styles.studentNim}>
                  NIM: {profile?.nim || '220101001'}
                </Text>
              </View>
            </View>

            {/* Kartu Validasi Lokasi GPS */}
            <LocationStatusCard
              labName={matchedLab?.name || session.roomName}
              distanceMeters={radiusCalculation.distanceMeters}
              radiusMeters={matchedLab?.radiusMeters || 100}
              withinRadius={radiusCalculation.withinRadius}
              permissionStatus={permissionStatus}
              accuracy={location?.coords?.accuracy ?? null}
              onRefresh={refreshLocation}
              errorMessage={location?.errorMessage}
            />

            {/* Tampilan Konfirmasi Presensi jika sudah presensi (Anti-Double & Sembunyikan Doc ID) */}
            {attendanceRecord ? (
              <View style={styles.confirmedCard}>
                <View style={styles.confirmedHeader}>
                  <View style={styles.confirmedIconBox}>
                    <Text style={{ fontSize: 20, color: '#16A34A', fontWeight: '800' }}>✓</Text>
                  </View>
                  <View style={styles.confirmedTitleColumn}>
                    <Text style={styles.confirmedTitle}>Presensi Terverifikasi</Text>
                    <Text style={styles.confirmedTime}>
                      Waktu: {attendanceRecord.timestamp || 'Baru saja'}
                    </Text>
                  </View>
                </View>

                <View style={styles.confirmedDivider} />

                <View style={styles.confirmedDetails}>
                  <Text style={styles.confirmedDetailText}>
                    Status: <Text style={styles.boldGreen}>Hadir (Tepat Waktu)</Text>
                  </Text>
                  {attendanceRecord.locationSnapshot && (
                    <Text style={styles.confirmedDetailText}>
                      Jarak Saat Presensi:{' '}
                      <Text style={styles.bold}>
                        {attendanceRecord.locationSnapshot.distanceToLab} meter
                      </Text>{' '}
                      dari lab
                    </Text>
                  )}
                  {Boolean(attendanceRecord.notes) && (
                    <Text style={styles.confirmedDetailText}>
                      {`Catatan: "${attendanceRecord.notes}"`}
                    </Text>
                  )}
                </View>

                <View style={styles.confirmedBanner}>
                  <Text style={{ fontSize: 14 }}>🛡️</Text>
                  <Text style={styles.confirmedBannerText}>
                    Presensi berhasil diverifikasi berbasis lokasi GPS.
                  </Text>
                </View>
              </View>
            ) : (
              /* Form Pengisian Presensi jika belum submit */
              <View style={styles.formCard}>
                <Text style={styles.formTitle}>Formulir Presensi</Text>
                <Text style={styles.formSubtitle}>
                  Pastikan Anda berada di area laboratorium saat menekan tombol presensi.
                </Text>

                <Text style={styles.inputLabel}>Catatan Praktikum (Opsional):</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Tambahkan catatan jika diperlukan..."
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                  numberOfLines={2}
                  editable={!submitting}
                />

                {/* Tombol Presensi Sekarang */}
                <TouchableOpacity
                  style={[
                    styles.submitButton,
                    !canSubmit && styles.submitButtonDisabled,
                  ]}
                  onPress={handleSubmit}
                  disabled={!canSubmit || submitting}
                  activeOpacity={0.8}
                >
                  {submitting ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 16 }}>✓</Text>
                      <Text style={styles.submitButtonText}>Presensi Sekarang</Text>
                    </>
                  )}
                </TouchableOpacity>

                {!isSessionOpen && (
                  <Text style={styles.warningHint}>
                    ⚠️ Tombol presensi hanya aktif ketika status sesi BERJALAN.
                  </Text>
                )}

                {isSessionOpen && radiusCalculation.withinRadius === false && (
                  <Text style={styles.warningHint}>
                    ⚠️ Anda berada di luar radius laboratorium. Dekatilah lab untuk melakukan presensi.
                  </Text>
                )}
              </View>
            )}

            {/* Quick Action: Buka Peta Lab */}
            <TouchableOpacity
              style={styles.openMapButton}
              onPress={handleOpenMap}
              activeOpacity={0.8}
            >
              <Text style={{ fontSize: 16 }}>🗺️</Text>
              <Text style={styles.openMapButtonText}>
                Lihat Semua Lokasi Lab di Peta
              </Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  topBar: {
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
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  mapIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  loadingBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#6B7280',
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#DC2626',
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
  },
  sessionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  sessionCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  badgeContainer: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  classGroupText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4B5563',
  },
  courseTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 2,
  },
  moduleName: {
    fontSize: 13,
    color: '#4B5563',
  },
  metaDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 12,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  metaValue: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '500',
  },
  studentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  avatarBox: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#15803D',
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  studentNim: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 1,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    marginTop: 8,
    marginBottom: 14,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  formSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#111827',
    marginBottom: 16,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#16A34A',
    borderRadius: 10,
    paddingVertical: 14,
    gap: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  warningHint: {
    fontSize: 12,
    color: '#B45309',
    marginTop: 10,
    textAlign: 'center',
  },
  confirmedCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1.5,
    borderColor: '#86EFAC',
    marginTop: 8,
    marginBottom: 14,
  },
  confirmedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  confirmedIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  confirmedTitleColumn: {
    flex: 1,
  },
  confirmedTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#15803D',
  },
  confirmedTime: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 1,
  },
  confirmedDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 12,
  },
  confirmedDetails: {
    gap: 6,
  },
  confirmedDetailText: {
    fontSize: 13,
    color: '#374151',
  },
  bold: {
    fontWeight: '700',
    color: '#111827',
  },
  boldGreen: {
    fontWeight: '700',
    color: '#15803D',
  },
  confirmedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    padding: 10,
    borderRadius: 8,
    gap: 6,
    marginTop: 12,
  },
  confirmedBannerText: {
    fontSize: 11,
    color: '#166534',
    fontWeight: '600',
    flex: 1,
  },
  openMapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 10,
    paddingVertical: 12,
    gap: 8,
  },
  openMapButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1D4ED8',
  },
});

export default AttendanceScreen;
