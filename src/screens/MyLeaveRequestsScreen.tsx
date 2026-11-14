import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import useAuth from '../hooks/useAuth';
import useMyLeaveRequests from '../hooks/useMyLeaveRequests';
import LeaveRequestCard from '../components/LeaveRequestCard';
import UserHeader from '../components/UserHeader';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';

interface MyLeaveRequestsScreenProps {
  onNavigateToForm?: () => void;
  onBack?: () => void;
}

export const MyLeaveRequestsScreen: React.FC<MyLeaveRequestsScreenProps> = ({
  onNavigateToForm,
  onBack,
}) => {
  const { profile } = useAuth();
  const { requests, loading, error, retry } = useMyLeaveRequests(profile?.uid);

  if (profile?.role === 'asisten') {
    return (
      <View style={styles.container}>
        <ErrorState
          title="Akses Ditolak"
          message="Halaman ini khusus untuk Mahasiswa Praktikan untuk memantau status izin."
          onRetry={onBack}
          retryText="Kembali"
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.headerRow}>
        {onBack && (
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Kembali</Text>
          </TouchableOpacity>
        )}
        <View style={styles.titleActionRow}>
          <Text style={styles.pageTitle}>Daftar Izin Saya</Text>
          {onNavigateToForm && (
            <TouchableOpacity
              style={styles.newRequestButton}
              onPress={onNavigateToForm}
              activeOpacity={0.8}
            >
              <Text style={styles.newRequestButtonText}>+ Ajukan Izin</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* User Header */}
      <UserHeader profile={profile} />

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
          <View style={styles.emptyIconCircle}>
            <Text style={styles.emptyIconText}>📋</Text>
          </View>
          <Text style={styles.emptyTitle}>Anda belum mengajukan izin</Text>
          <Text style={styles.emptySubtitle}>
            Jika berhalangan hadir pada sesi praktikum, ajukan permohonan izin sebelum sesi dibuka oleh asisten.
          </Text>
          {onNavigateToForm && (
            <TouchableOpacity
              style={styles.emptyActionButton}
              onPress={onNavigateToForm}
              activeOpacity={0.8}
            >
              <Text style={styles.emptyActionButtonText}>Ajukan Izin Sekarang</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={requests}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <LeaveRequestCard item={item} />}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={retry} colors={['#2563EB']} />
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    padding: 16,
  },
  headerRow: {
    marginBottom: 12,
  },
  backButton: {
    paddingVertical: 6,
    marginBottom: 6,
  },
  backButtonText: {
    color: '#2563EB',
    fontSize: 14,
    fontWeight: '600',
  },
  titleActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
  },
  newRequestButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  newRequestButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  listContent: {
    paddingBottom: 24,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    marginTop: 40,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyIconText: {
    fontSize: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  emptyActionButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  emptyActionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});

export default MyLeaveRequestsScreen;

