import React from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { EmptyState } from '../components/EmptyState';
import { SessionCard } from '../components/SessionCard';
import { UserHeader } from '../components/UserHeader';
import { LoadingState } from '../components/LoadingState';
import { ErrorState } from '../components/ErrorState';
import { SessionItem, RoleType } from '../types/models';
import { useAuth } from '../hooks/useAuth';
import { useSessions } from '../hooks/useSessions';

interface ScheduleListScreenProps {
  onSelectSession?: (session: SessionItem, role: RoleType) => void;
}

export const ScheduleListScreen: React.FC<ScheduleListScreenProps> = ({
  onSelectSession,
}) => {
  const router = useRouter();
  const { profile, switchRole } = useAuth();
  const { sessions, loading, error, refresh } = useSessions();

  const isAsisten = profile.role === 'asisten';

  const handleSelectSession = (session: SessionItem, role: RoleType) => {
    if (onSelectSession) {
      onSelectSession(session, role);
    } else {
      if (role === 'asisten') {
        router.push({
          pathname: '/assistant-session',
          params: {
            id: session.id,
            courseTitle: session.courseTitle,
            moduleName: session.moduleName,
            classGroup: session.classGroup,
            roomName: session.roomName,
            timeSlot: session.timeSlot,
            status: session.status,
          },
        });
      } else {
        router.push({
          pathname: '/student-attendance',
          params: {
            id: session.id,
            courseTitle: session.courseTitle,
            moduleName: session.moduleName,
            classGroup: session.classGroup,
            roomName: session.roomName,
            timeSlot: session.timeSlot,
            status: session.status,
          },
        });
      }
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
      {/* Header Aplikasi */}
      <View style={styles.headerArea}>
        <Text style={styles.appTitle}>Lab Attendance</Text>
        <Text style={styles.appSubtitle}>Sistem Presensi Praktikum Laboratorium</Text>
      </View>

      {/* User Header menggantikan RoleSwitcher */}
      <UserHeader
        profile={profile}
        onSwitchRole={(nextRole) => switchRole(nextRole)}
      />

      {/* Quick Action Navigation untuk Asisten */}
      {isAsisten && (
        <View style={styles.assistantQuickNav}>
          <TouchableOpacity
            style={styles.navButtonPrimary}
            onPress={() => router.push('/class-management' as any)}
            activeOpacity={0.8}
          >
            <Text style={styles.navButtonIcon}>📚</Text>
            <Text style={styles.navButtonTextPrimary}>Kelola Kelas</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navButtonSecondary}
            onPress={() => router.push('/session-management' as any)}
            activeOpacity={0.8}
          >
            <Text style={styles.navButtonIcon}>🗓️</Text>
            <Text style={styles.navButtonTextSecondary}>Kelola Sesi</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Fitur Izin & AI (Developer 3 / AI Leave) */}
      <View style={styles.featureBox}>
        <View style={styles.featureBoxHeader}>
          <Text style={styles.featureBoxTitle}>
            {isAsisten ? '📋 Pengelolaan Izin Praktikan' : '✉️ Layanan Izin Praktikan'}
          </Text>
          <View style={styles.aiTag}>
            <Text style={styles.aiTagText}>AI Powered</Text>
          </View>
        </View>

        {isAsisten ? (
          <TouchableOpacity
            style={styles.featureActionPrimary}
            onPress={() => router.push('/assistant-leave-review' as any)}
            activeOpacity={0.8}
          >
            <Text style={styles.featureActionPrimaryText}>Review Pengajuan Izin</Text>
            <Text style={styles.featureActionSubtext}>Periksa dan putuskan izin praktikan</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.featureRowButtons}>
            <TouchableOpacity
              style={[styles.featureActionSecondary, styles.flexOne]}
              onPress={() => router.push('/leave-request-form' as any)}
              activeOpacity={0.8}
            >
              <Text style={styles.featureActionSecondaryText}>+ Ajukan Izin</Text>
              <Text style={styles.featureActionSmallSubtext}>Sesi Belum Dibuka</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.featureActionSecondary, styles.flexOne]}
              onPress={() => router.push('/my-leave-requests' as any)}
              activeOpacity={0.8}
            >
              <Text style={styles.featureActionSecondaryText}>Status Izin Saya</Text>
              <Text style={styles.featureActionSmallSubtext}>Pantau Real-time</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Judul Bagian Jadwal */}
      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionTitle}>
            {isAsisten ? 'Semua Jadwal Praktikum' : 'Jadwal Praktikum Anda'}
          </Text>
          <Text style={styles.sectionSubtitle}>
            {loading
              ? 'Memuat data dari Firestore...'
              : sessions.length > 0
              ? `${sessions.length} sesi tersedia`
              : 'Tidak ada sesi'}
          </Text>
        </View>
      </View>

      {/* Daftar Sesi, Loading, Error, atau Empty State */}
      {loading ? (
        <LoadingState message="Memuat jadwal praktikum real-time..." />
      ) : error ? (
        <ErrorState
          message={error}
          onRetry={refresh}
          retryText="Coba Muat Ulang"
        />
      ) : sessions.length === 0 ? (
        <View style={styles.emptyContainer}>
          <EmptyState
            message="Tidak Ada Jadwal Praktikum"
            description={
              isAsisten
                ? 'Belum ada sesi praktikum yang dibuat. Silakan tambahkan melalui menu Kelola Sesi.'
                : 'Anda belum terdaftar dalam sesi praktikum aktif manapun.'
            }
          />
        </View>
      ) : (
        <FlatList
          data={sessions}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <SessionCard
              session={item}
              currentRole={profile.role}
              onSelectSession={handleSelectSession}
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  headerArea: {
    marginBottom: 12,
  },
  appTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1E3A8A',
    letterSpacing: -0.5,
  },
  appSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  assistantQuickNav: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  navButtonPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    elevation: 2,
  },
  navButtonSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#2563EB',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    elevation: 1,
  },
  navButtonIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  navButtonTextPrimary: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  navButtonTextSecondary: {
    color: '#2563EB',
    fontWeight: '700',
    fontSize: 13,
  },
  featureBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  featureBoxHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  featureBoxTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  aiTag: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  aiTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4F46E5',
  },
  featureActionPrimary: {
    backgroundColor: '#2563EB',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  featureActionPrimaryText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  featureActionSubtext: {
    color: '#BFDBFE',
    fontSize: 11,
    marginTop: 2,
  },
  featureRowButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  featureActionSecondary: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  featureActionSecondaryText: {
    color: '#1E293B',
    fontSize: 13,
    fontWeight: '700',
  },
  featureActionSmallSubtext: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 2,
  },
  flexOne: {
    flex: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  listContent: {
    paddingBottom: 24,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ScheduleListScreen;
