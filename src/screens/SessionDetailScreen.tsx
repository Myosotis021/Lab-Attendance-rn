import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SessionItem, SessionStatus } from '../types/models';
import { listenSession } from '../services/sessionService';

export interface SessionDetailScreenProps {
  sessionId?: string;
  onBack?: () => void;
}

export const SessionDetailScreen: React.FC<SessionDetailScreenProps> = ({
  sessionId: propSessionId,
  onBack,
}) => {
  const router = useRouter();
  const searchParams = useLocalSearchParams<{
    id?: string;
    sessionId?: string;
    courseTitle?: string;
    moduleName?: string;
    classGroup?: string;
    roomName?: string;
    timeSlot?: string;
    status?: SessionStatus;
  }>();

  const sessionId =
    propSessionId || searchParams.sessionId || searchParams.id || 'ses-1';

  const [session, setSession] = useState<SessionItem | null>(() => {
    if (searchParams.courseTitle) {
      return {
        id: sessionId,
        classId: '',
        courseTitle: searchParams.courseTitle,
        moduleName: searchParams.moduleName || '',
        classGroup: searchParams.classGroup || '',
        roomName: searchParams.roomName || 'Lab Komputer 1',
        timeSlot: searchParams.timeSlot || '',
        status: (searchParams.status as SessionStatus) || 'BELUM_DIBUKA',
        participantIds: [],
        createdBy: '',
        createdAt: null as any,
      };
    }
    return null;
  });

  const [loading, setLoading] = useState<boolean>(!session);

  useEffect(() => {
    if (!sessionId) return;
    const unsub = listenSession(sessionId, (data) => {
      if (data) {
        setSession(data);
      }
      setLoading(false);
    });
    return () => unsub();
  }, [sessionId]);

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  const handleNavigateToAttendance = () => {
    if (!session) return;
    router.push({
      pathname: '/attendance',
      params: {
        sessionId: session.id,
        courseTitle: session.courseTitle,
        moduleName: session.moduleName,
        classGroup: session.classGroup,
        roomName: session.roomName,
        timeSlot: session.timeSlot,
        status: session.status,
      },
    });
  };

  const handleOpenMap = () => {
    router.push('/lab-map');
  };

  const isSessionOpen = session?.status === 'BERJALAN';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar style="dark" />

      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBack}
          activeOpacity={0.7}
        >
          <Text style={{ fontSize: 18, fontWeight: '700', color: '#111827' }}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detail Sesi Praktikum</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {loading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color="#2563EB" />
            <Text style={styles.loadingText}>Memuat detail sesi...</Text>
          </View>
        ) : !session ? (
          <View style={styles.centerBox}>
            <Text style={{ fontSize: 36 }}>⚠️</Text>
            <Text style={styles.emptyText}>Data sesi tidak ditemukan.</Text>
          </View>
        ) : (
          <>
            {/* Info Card Utama */}
            <View style={styles.card}>
              <View style={styles.badgeRow}>
                <View
                  style={[
                    styles.statusBadge,
                    session.status === 'BERJALAN'
                      ? styles.badgeOpen
                      : session.status === 'SELESAI'
                      ? styles.badgeClosed
                      : styles.badgeUpcoming,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusBadgeText,
                      session.status === 'BERJALAN'
                        ? styles.badgeTextOpen
                        : session.status === 'SELESAI'
                        ? styles.badgeTextClosed
                        : styles.badgeTextUpcoming,
                    ]}
                  >
                    {session.status}
                  </Text>
                </View>
                <Text style={styles.classGroupText}>{session.classGroup}</Text>
              </View>

              <Text style={styles.courseTitle}>{session.courseTitle}</Text>
              <Text style={styles.moduleName}>{session.moduleName}</Text>

              <View style={styles.divider} />

              <View style={styles.metaRow}>
                <Text style={{ fontSize: 14 }}>📍</Text>
                <Text style={styles.metaText}>Ruang: {session.roomName}</Text>
              </View>
              <View style={styles.metaRow}>
                <Text style={{ fontSize: 14 }}>🕒</Text>
                <Text style={styles.metaText}>Waktu: {session.timeSlot}</Text>
              </View>
            </View>

            {/* Tombol Aksi Navigasi ke Halaman Presensi Terpisah */}
            <TouchableOpacity
              style={[
                styles.primaryButton,
                !isSessionOpen && styles.primaryButtonDisabled,
              ]}
              onPress={handleNavigateToAttendance}
              activeOpacity={0.8}
            >
              <Text style={{ color: '#FFFFFF', fontWeight: '800' }}>✓</Text>
              <Text style={styles.primaryButtonText}>
                {isSessionOpen
                  ? 'Buka Halaman Presensi (GPS)'
                  : 'Presensi (Sesi Belum Dibuka)'}
              </Text>
            </TouchableOpacity>

            {/* Tombol Peta Lab */}
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={handleOpenMap}
              activeOpacity={0.8}
            >
              <Text style={{ fontSize: 16 }}>🗺️</Text>
              <Text style={styles.secondaryButtonText}>
                Lihat Lokasi Lab di Peta
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
  header: {
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
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  scrollContent: {
    padding: 16,
    gap: 14,
  },
  centerBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    gap: 10,
  },
  loadingText: {
    fontSize: 13,
    color: '#6B7280',
  },
  emptyText: {
    fontSize: 14,
    color: '#DC2626',
    fontWeight: '700',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  badgeOpen: {
    backgroundColor: '#DCFCE7',
  },
  badgeTextOpen: {
    color: '#15803D',
  },
  badgeUpcoming: {
    backgroundColor: '#FEF3C7',
  },
  badgeTextUpcoming: {
    color: '#B45309',
  },
  badgeClosed: {
    backgroundColor: '#FEE2E2',
  },
  badgeTextClosed: {
    color: '#B91C1C',
  },
  classGroupText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
  },
  courseTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  moduleName: {
    fontSize: 13,
    color: '#4B5563',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 14,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  metaText: {
    fontSize: 13,
    color: '#374151',
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
    elevation: 2,
  },
  primaryButtonDisabled: {
    backgroundColor: '#93C5FD',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
  },
  secondaryButtonText: {
    color: '#1D4ED8',
    fontSize: 14,
    fontWeight: '700',
  },
});

export default SessionDetailScreen;
