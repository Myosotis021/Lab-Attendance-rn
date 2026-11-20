import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import useAuth from '../hooks/useAuth';
import useMyLeaveRequests from '../hooks/useMyLeaveRequests';
import LeaveRequestCard from '../components/LeaveRequestCard';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';
import { theme } from '../theme';

interface MyLeaveRequestsScreenProps {
  onNavigateToForm?: () => void;
  onBack?: () => void;
}

export const MyLeaveRequestsScreen: React.FC<MyLeaveRequestsScreenProps> = ({
  onNavigateToForm,
  onBack,
}) => {
  const router = useRouter();
  const { profile } = useAuth();
  const { requests, loading, error, retry } = useMyLeaveRequests(profile?.uid);

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  const handleGoToForm = () => {
    if (onNavigateToForm) {
      onNavigateToForm();
    } else {
      router.push('/leave-request-form' as any);
    }
  };

  if (profile?.role === 'asisten') {
    return (
      <LinearGradient colors={theme.colors.backgroundGradient} style={styles.flexOne}>
        <SafeAreaView style={styles.safeArea}>
          <ErrorState
            title="Akses Ditolak"
            message="Halaman ini khusus untuk Mahasiswa Praktikan untuk memantau status izin."
            onRetry={handleBack}
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

        {/* Top Header */}
        <View style={styles.topBar}>
          <TouchableOpacity
            onPress={handleBack}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <Feather name="arrow-left" size={20} color={theme.colors.textPrimary} />
          </TouchableOpacity>

          <View style={styles.headerTitleGroup}>
            <Text style={styles.screenTitle}>Status Izin Saya</Text>
            <Text style={styles.screenSubtitle}>Pantau Riwayat & Keputusan</Text>
          </View>

          <TouchableOpacity
            style={styles.addActionButton}
            onPress={handleGoToForm}
            activeOpacity={0.8}
          >
            <Feather name="plus" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Content Area */}
        {loading && requests.length === 0 ? (
          <LoadingState message="Memuat daftar pengajuan izin Anda..." />
        ) : error ? (
          <ErrorState
            message={error}
            onRetry={retry}
            retryText="Coba Lagi"
          />
        ) : requests.length === 0 ? (
          <View style={styles.emptyContainer}>
            <EmptyState
              message="Anda Belum Mengajukan Izin"
              description="Jika berhalangan hadir pada sesi praktikum, ajukan permohonan izin sebelum sesi dibuka oleh asisten lab."
            />
            <TouchableOpacity
              style={styles.emptyActionButton}
              onPress={handleGoToForm}
              activeOpacity={0.85}
            >
              <Feather name="send" size={15} color="#FFFFFF" style={styles.btnIcon} />
              <Text style={styles.emptyActionButtonText}>Ajukan Izin Sekarang</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={requests}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <LeaveRequestCard item={item} />}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={loading}
                onRefresh={retry}
                colors={[theme.colors.textPrimary]}
              />
            }
          />
        )}
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
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
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
  addActionButton: {
    width: 44,
    height: 44,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.textPrimary,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.subtle,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  emptyContainer: {
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  emptyActionButton: {
    backgroundColor: theme.colors.textPrimary,
    paddingVertical: 13,
    paddingHorizontal: 22,
    borderRadius: theme.borderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
    ...theme.shadows.subtle,
  },
  emptyActionButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  btnIcon: {
    marginRight: 6,
  },
});

export default MyLeaveRequestsScreen;
