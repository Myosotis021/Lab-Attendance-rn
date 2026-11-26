import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import {
  AttendanceRecord,
  SessionItem,
  SessionStatus,
  LocationSnapshot,
  LabLocation,
} from '../types/models';
import { LocationStatusCard } from '../components/LocationStatusCard';
import { QRScannerModal } from '../components/QRScannerModal';
import { AttendanceFeedbackModal } from '../components/AttendanceFeedbackModal';
import { OfflineBanner } from '../components/OfflineBanner';
import { useCurrentLocation } from '../hooks/useCurrentLocation';
import { useLabLocations } from '../hooks/useLabLocations';
import { calculateDistance } from '../services/locationService';
import {
  submitAttendance,
  listenMyAttendanceForSession,
} from '../services/attendanceService';
import { listenSession, getSessionById } from '../services/sessionService';
import { useAuth } from '../hooks/useAuth';
import {
  DEFAULT_ATTENDANCE_RADIUS_METERS,
  findPredefinedLabByName,
  isOnlineRoom,
} from '../data/labLocations';

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

  const [session, setSession] = useState<SessionItem | null>(() => {
    if (searchParams.courseTitle) {
      return {
        id: sessionId,
        classId: '',
        courseTitle: searchParams.courseTitle,
        moduleName: searchParams.moduleName || '',
        classGroup: searchParams.classGroup || '',
        roomName: searchParams.roomName || 'Lab B',
        timeSlot: searchParams.timeSlot || '',
        status: (searchParams.status as SessionStatus) || 'BELUM_DIBUKA',
        sessionType: isOnlineRoom(searchParams.roomName) ? 'ONLINE' : 'OFFLINE',
        participantIds: [],
        createdBy: '',
        createdAt: null as any,
      };
    }
    return null;
  });

  const isOnlineSession = Boolean(
    session && isOnlineRoom(session.roomName, session.sessionType)
  );

  // Untuk sesi Online, lokasi praktikan TIDAK dilacak sama sekali
  const shouldTrackLocation = Boolean(session && !isOnlineSession);
  const { location, permissionStatus, refreshLocation } =
    useCurrentLocation(shouldTrackLocation);

  const [loadingSession, setLoadingSession] = useState<boolean>(!session);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [notes, setNotes] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [scannerVisible, setScannerVisible] = useState<boolean>(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState<boolean>(false);
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

  // Pull-to-refresh (scroll mentok atas)
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      if (sessionId) {
        const latest = await getSessionById(sessionId);
        if (latest) {
          setSession(latest);
        }
      }
      if (shouldTrackLocation) {
        refreshLocation();
      }
    } finally {
      setRefreshing(false);
    }
  }, [sessionId, shouldTrackLocation, refreshLocation]);

  // 3. Tentukan target koordinat (Lab terdaftar vs Device Asprak untuk tempat lainnya)
  const locationTarget = useMemo(() => {
    if (!session || isOnlineSession) return null;

    const predefined = findPredefinedLabByName(session.roomName);
    if (predefined) {
      const firestoreLab: LabLocation | undefined = labs.find(
        (l) => l.id === predefined.id
      );
      return {
        mode: 'GPS_LAB' as const,
        label: predefined.name,
        latitude: firestoreLab?.latitude ?? predefined.latitude,
        longitude: firestoreLab?.longitude ?? predefined.longitude,
        radiusMeters: DEFAULT_ATTENDANCE_RADIUS_METERS,
      };
    }

    // Tempat lainnya (mengisi sendiri) -> balik ke rule 1: radius 150m dari device Asprak
    if (
      typeof session.assistantLat === 'number' &&
      typeof session.assistantLng === 'number'
    ) {
      return {
        mode: 'GPS_ASSISTANT' as const,
        label: `Device Asprak (${session.roomName || 'Lokasi Sesi'})`,
        latitude: session.assistantLat,
        longitude: session.assistantLng,
        radiusMeters: DEFAULT_ATTENDANCE_RADIUS_METERS,
      };
    }

    return {
      mode: 'GPS_ASSISTANT_MISSING' as const,
      label: `Device Asprak (${session.roomName || 'Lokasi Sesi'})`,
      latitude: null,
      longitude: null,
      radiusMeters: DEFAULT_ATTENDANCE_RADIUS_METERS,
    };
  }, [session, isOnlineSession, labs]);

  // 4. Kalkulasi radius dan jarak dengan formula Haversine (maks. 150m)
  const radiusCalculation = useMemo(() => {
    if (
      isOnlineSession ||
      !location?.coords ||
      !locationTarget ||
      locationTarget.latitude === null ||
      locationTarget.longitude === null
    ) {
      return { withinRadius: null, distanceMeters: null };
    }
    const distance = calculateDistance(
      location.coords.latitude,
      location.coords.longitude,
      locationTarget.latitude,
      locationTarget.longitude
    );
    const distanceMeters = Math.round(distance);
    return {
      distanceMeters,
      withinRadius: distanceMeters <= locationTarget.radiusMeters,
    };
  }, [isOnlineSession, location, locationTarget]);

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  const handleOpenMap = () => {
    router.push('/lab-map');
  };

  // Submit untuk Sesi OFFLINE (validasi GPS <= 150m)
  const handleSubmitOffline = async () => {
    if (!session) {
      Alert.alert('Error', 'Data sesi tidak ditemukan.');
      return;
    }

    if (session.status !== 'BERJALAN') {
      Alert.alert(
        'Presensi Ditolak',
        'Sesi praktikum belum dibuka oleh asisten.'
      );
      return;
    }

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

    if (!locationTarget || locationTarget.mode === 'GPS_ASSISTANT_MISSING') {
      Alert.alert(
        'Menunggu Lokasi Asisten',
        'Koordinat perangkat Asisten belum tersedia. Tarik layar ke bawah untuk memuat ulang.'
      );
      return;
    }

    if (!radiusCalculation.withinRadius) {
      Alert.alert(
        'Di Luar Radius Presensi',
        `Anda berada ${
          radiusCalculation.distanceMeters ?? '?'
        } meter dari ${locationTarget.label}. Radius maksimal presensi: ${
          locationTarget.radiusMeters
        } meter.`
      );
      return;
    }

    if (attendanceRecord) {
      Alert.alert(
        'Sudah Presensi',
        'Anda sudah melakukan presensi pada sesi ini.'
      );
      return;
    }

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
        attendanceMode: locationTarget.mode,
      });

      setAttendanceRecord(result);
      setShowFeedbackModal(true);
    } catch (err: any) {
      Alert.alert('Gagal Presensi', err?.message || 'Terjadi kesalahan sistem.');
    } finally {
      setSubmitting(false);
    }
  };

  // Scan & Submit untuk Sesi ONLINE (QR Code, tanpa GPS)
  const handleOpenQrScanner = () => {
    if (!session || session.status !== 'BERJALAN') {
      Alert.alert(
        'Sesi Belum Dibuka',
        'Presensi QR hanya dapat dilakukan saat sesi berstatus BERJALAN.'
      );
      return;
    }
    if (attendanceRecord) {
      Alert.alert('Sudah Presensi', 'Anda sudah melakukan presensi pada sesi ini.');
      return;
    }
    setScannerVisible(true);
  };

  const handleQrScanned = async (scannedData: string) => {
    setScannerVisible(false);
    if (!session) return;

    const expectedToken = (session.qrToken || '').trim();
    if (!expectedToken || scannedData.trim() !== expectedToken) {
      Alert.alert(
        'QR Code Tidak Valid',
        'QR Code yang dipindai tidak cocok dengan sesi praktikum ini atau sudah diperbarui oleh Asisten. Silakan pindai ulang QR terbaru.'
      );
      return;
    }

    setSubmitting(true);
    try {
      const result = await submitAttendance({
        sessionId: session.id,
        classId: session.classId || '',
        uid: currentUid,
        studentName: profile?.name || 'Ahmad Fauzi',
        studentNim: profile?.nim || '220101001',
        notes,
        attendanceMode: 'ONLINE_QR',
      });

      setAttendanceRecord(result);
      setShowFeedbackModal(true);
    } catch (err: any) {
      Alert.alert('Gagal Presensi Online', err?.message || 'Terjadi kesalahan sistem.');
    } finally {
      setSubmitting(false);
    }
  };

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

  const canSubmitOffline =
    isSessionOpen &&
    radiusCalculation.withinRadius === true &&
    permissionStatus === 'granted' &&
    !submitting &&
    !attendanceRecord;

  const canSubmitOnline =
    isSessionOpen && !submitting && !attendanceRecord;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar style="dark" />
      <OfflineBanner />

      {/* Header Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBack}
          activeOpacity={0.7}
        >
          <Feather name="arrow-left" size={20} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>
          {isOnlineSession ? 'Presensi Online (QR)' : 'Presensi Laboratorium'}
        </Text>
        {!isOnlineSession ? (
          <TouchableOpacity
            style={styles.mapIconButton}
            onPress={handleOpenMap}
            activeOpacity={0.7}
          >
            <Text style={{ fontSize: 16 }}>🗺️</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 36 }} />
        )}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
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
                <Text style={{ fontSize: 14 }}>
                  {isOnlineSession ? '🌐' : '📍'}
                </Text>
                <Text style={styles.metaValue}>
                  Tempat: {isOnlineSession ? 'Online (QR Code)' : session.roomName}
                </Text>
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

            {/* Status Online atau Status Lokasi GPS */}
            {isOnlineSession ? (
              <View style={styles.onlineStatusCard}>
                <View style={styles.onlineIconBox}>
                  <Feather name="wifi" size={20} color="#1D4ED8" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.onlineStatusTitle}>
                    Sesi Dilaksanakan Secara Online
                  </Text>
                  <Text style={styles.onlineStatusDesc}>
                    Lokasi Anda tidak dilacak. Pindai QR Code dari Asisten untuk
                    mencatat kehadiran jarak jauh.
                  </Text>
                </View>
              </View>
            ) : (
              <LocationStatusCard
                labName={locationTarget?.label || session.roomName}
                distanceMeters={radiusCalculation.distanceMeters}
                radiusMeters={DEFAULT_ATTENDANCE_RADIUS_METERS}
                withinRadius={radiusCalculation.withinRadius}
                permissionStatus={permissionStatus}
                accuracy={location?.coords?.accuracy ?? null}
                errorMessage={
                  locationTarget?.mode === 'GPS_ASSISTANT_MISSING'
                    ? 'Menunggu koordinat device Asisten saat sesi dibuka. Tarik ke bawah untuk refresh.'
                    : location?.errorMessage
                }
              />
            )}

            {/* Tampilan Konfirmasi Presensi jika sudah presensi */}
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
                  {attendanceRecord.locationSnapshot ? (
                    <Text style={styles.confirmedDetailText}>
                      Jarak Saat Presensi:{' '}
                      <Text style={styles.bold}>
                        {attendanceRecord.locationSnapshot.distanceToLab} meter
                      </Text>{' '}
                      dari titik acuan
                    </Text>
                  ) : (
                    <Text style={styles.confirmedDetailText}>
                      Metode: <Text style={styles.bold}>Scan QR Code (Online)</Text>
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
                    {attendanceRecord.locationSnapshot
                      ? 'Presensi berhasil diverifikasi berbasis lokasi GPS (radius 100 m).'
                      : 'Presensi online berhasil diverifikasi melalui QR Code.'}
                  </Text>
                </View>
              </View>
            ) : (
              /* Form Pengisian Presensi */
              <View style={styles.formCard}>
                <Text style={styles.formTitle}>Formulir Presensi</Text>
                <Text style={styles.formSubtitle}>
                  {isOnlineSession
                    ? 'Tekan tombol Scan QR Code saat Asisten menampilkan QR sesi online.'
                    : `Pastikan Anda berada dalam radius ${DEFAULT_ATTENDANCE_RADIUS_METERS} meter saat menekan tombol presensi.`}
                </Text>

                <Text style={styles.inputLabel}>Catatan Praktikum (Opsional):</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder={
                    isOnlineSession
                      ? 'Tambahkan catatan jika diperlukan...'
                      : 'Contoh: Meja PC-04'
                  }
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                  numberOfLines={2}
                  editable={!submitting}
                />

                {isOnlineSession ? (
                  <TouchableOpacity
                    style={[
                      styles.qrScanButton,
                      !canSubmitOnline && styles.submitButtonDisabled,
                    ]}
                    onPress={handleOpenQrScanner}
                    disabled={!canSubmitOnline || submitting}
                    activeOpacity={0.8}
                  >
                    {submitting ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <Feather name="camera" size={18} color="#FFFFFF" />
                        <Text style={styles.submitButtonText}>
                          Scan QR Code Presensi
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={[
                      styles.submitButton,
                      !canSubmitOffline && styles.submitButtonDisabled,
                    ]}
                    onPress={handleSubmitOffline}
                    disabled={!canSubmitOffline || submitting}
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
                )}

                {!isSessionOpen && (
                  <Text style={styles.warningHint}>
                    ⚠️ Tombol presensi hanya aktif ketika status sesi BERJALAN.
                  </Text>
                )}

                {!isOnlineSession &&
                  isSessionOpen &&
                  radiusCalculation.withinRadius === false && (
                    <Text style={styles.warningHint}>
                      ⚠️ Anda berada di luar radius {DEFAULT_ATTENDANCE_RADIUS_METERS} meter. Dekatilah lokasi untuk melakukan presensi.
                    </Text>
                  )}
              </View>
            )}

            {/* Quick Action: Buka Peta Lab (hanya untuk sesi Offline) */}
            {!isOnlineSession && (
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
            )}
          </>
        )}
      </ScrollView>

      {/* Modal QR Scanner untuk Sesi Online */}
      <QRScannerModal
        visible={scannerVisible}
        onClose={() => setScannerVisible(false)}
        onScanSuccess={handleQrScanned}
      />

      {/* Pop-up Modal Feedback setelah presensi berhasil */}
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
  onlineStatusCard: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1.5,
    borderColor: '#93C5FD',
    borderRadius: 12,
    padding: 14,
    marginVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  onlineIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  onlineStatusTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E3A8A',
  },
  onlineStatusDesc: {
    fontSize: 12,
    color: '#1D4ED8',
    marginTop: 2,
    lineHeight: 17,
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
  qrScanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
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
