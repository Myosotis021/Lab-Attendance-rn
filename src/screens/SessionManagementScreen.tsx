import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { SessionItem, SessionStatus } from '../types/models';
import {
  createSession,
  updateSession,
  deleteSession,
} from '../services/sessionService';
import { useSessions } from '../hooks/useSessions';
import { useAuth } from '../hooks/useAuth';
import { LoadingState } from '../components/LoadingState';
import { ErrorState } from '../components/ErrorState';
import { EmptyState } from '../components/EmptyState';
import { ConfirmModal } from '../components/ConfirmModal';
import { SessionFormModal } from '../components/SessionFormModal';
import { getErrorMessage } from '../utils/getErrorMessage';

const STATUS_CONFIG: Record<
  SessionStatus,
  { label: string; bg: string; text: string; border: string }
> = {
  BELUM_DIBUKA: {
    label: 'BELUM DIBUKA',
    bg: '#FEF3C7',
    text: '#D97706',
    border: '#FDE68A',
  },
  BERJALAN: {
    label: 'BERJALAN',
    bg: '#DCFCE7',
    text: '#15803D',
    border: '#BBF7D0',
  },
  SELESAI: {
    label: 'SELESAI',
    bg: '#FEE2E2',
    text: '#DC2626',
    border: '#FECACA',
  },
};

export const SessionManagementScreen: React.FC = () => {
  const router = useRouter();
  const { profile } = useAuth();
  const { sessions, loading, error, refresh } = useSessions();

  // Form Modal state
  const [formModalVisible, setFormModalVisible] = useState(false);
  const [selectedSession, setSelectedSession] = useState<SessionItem | null>(null);

  // Confirm Delete Modal state
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<SessionItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleOpenAddModal = () => {
    setSelectedSession(null);
    setFormModalVisible(true);
  };

  const handleOpenEditModal = (item: SessionItem) => {
    if (item.status !== 'BELUM_DIBUKA') {
      Alert.alert(
        'Tidak Dapat Mengubah',
        'Sesi hanya dapat diubah jika status masih BELUM DIBUKA.'
      );
      return;
    }
    setSelectedSession(item);
    setFormModalVisible(true);
  };

  const handlePromptDelete = (item: SessionItem) => {
    if (item.status !== 'BELUM_DIBUKA') {
      Alert.alert(
        'Tidak Dapat Menghapus',
        'Sesi hanya dapat dihapus jika status masih BELUM DIBUKA.'
      );
      return;
    }
    setSessionToDelete(item);
    setDeleteModalVisible(true);
  };

  const handleConfirmDelete = async () => {
    if (!sessionToDelete) return;
    try {
      setDeleting(true);
      await deleteSession(sessionToDelete.id);
      setDeleteModalVisible(false);
      setSessionToDelete(null);
    } catch (err: unknown) {
      setDeleteModalVisible(false);
      const msg = getErrorMessage(err);
      Alert.alert('Gagal Menghapus Sesi', msg);
    } finally {
      setDeleting(false);
    }
  };

  const handleSubmitForm = async (data: {
    classId: string;
    courseTitle: string;
    moduleName: string;
    classGroup: string;
    roomName: string;
    timeSlot: string;
    participantIds: string[];
  }) => {
    if (selectedSession) {
      await updateSession(selectedSession.id, {
        moduleName: data.moduleName,
        timeSlot: data.timeSlot,
        courseTitle: data.courseTitle,
        classGroup: data.classGroup,
        roomName: data.roomName,
        participantIds: data.participantIds,
      });
    } else {
      await createSession({
        ...data,
        createdBy: profile.name || 'Asisten',
      });
    }
  };

  const handleGoToAssistantSession = (session: SessionItem) => {
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
  };

  if (profile?.role !== 'asisten') {
    return (
      <SafeAreaView style={styles.container}>
        <ErrorState
          title="Akses Ditolak"
          message="Anda tidak memiliki izin untuk mengakses halaman ini. Halaman ini khusus untuk Asisten Laboratorium."
          onRetry={() => router.replace('/')}
          retryText="Kembali ke Beranda"
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Text style={styles.backButtonText}>← Kembali</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Kelola Jadwal & Sesi</Text>
        <Text style={styles.headerSubtitle}>
          Atur jadwal, modul, dan siklus pelaksanaan praktikum
        </Text>
      </View>

      {/* Konten Utama */}
      {loading ? (
        <LoadingState message="Memuat daftar sesi praktikum..." />
      ) : error ? (
        <ErrorState message={error} onRetry={refresh} />
      ) : sessions.length === 0 ? (
        <View style={styles.emptyWrapper}>
          <EmptyState
            message="Belum Ada Jadwal Sesi"
            description="Silakan buat sesi praktikum baru melalui tombol di bawah."
          />
        </View>
      ) : (
        <FlatList
          data={sessions}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => {
            const badge = STATUS_CONFIG[item.status];
            const isBelumDibuka = item.status === 'BELUM_DIBUKA';

            return (
              <View style={styles.card}>
                {/* Header baris: Nama Matkul & Status Badge */}
                <View style={styles.topRow}>
                  <Text style={styles.courseTitle} numberOfLines={2}>
                    {item.courseTitle}
                  </Text>
                  <View
                    style={[
                      styles.badge,
                      {
                        backgroundColor: badge.bg,
                        borderColor: badge.border,
                      },
                    ]}
                  >
                    <Text style={[styles.badgeText, { color: badge.text }]}>
                      {badge.label}
                    </Text>
                  </View>
                </View>

                {/* Modul */}
                <Text style={styles.moduleName}>{item.moduleName}</Text>

                <View style={styles.divider} />

                {/* Detail */}
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Kelas & Ruang:</Text>
                  <Text style={styles.infoValue}>
                    {item.classGroup} - {item.roomName}
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Waktu:</Text>
                  <Text style={styles.infoValue}>{item.timeSlot}</Text>
                </View>

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Peserta Terdaftar:</Text>
                  <Text style={styles.infoValue}>
                    {item.participantIds.length} Mahasiswa
                  </Text>
                </View>

                {/* Baris Tombol Aksi */}
                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={styles.openDetailButton}
                    onPress={() => handleGoToAssistantSession(item)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.openDetailButtonText}>Buka Detail Sesi</Text>
                  </TouchableOpacity>

                  <View style={styles.subActionGroup}>
                    <TouchableOpacity
                      style={[
                        styles.subActionButton,
                        !isBelumDibuka && styles.actionDisabled,
                      ]}
                      onPress={() => handleOpenEditModal(item)}
                      disabled={!isBelumDibuka}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.subActionTextEdit,
                          !isBelumDibuka && styles.textDisabled,
                        ]}
                      >
                        Ubah
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.subActionButton,
                        !isBelumDibuka && styles.actionDisabled,
                      ]}
                      onPress={() => handlePromptDelete(item)}
                      disabled={!isBelumDibuka}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.subActionTextDelete,
                          !isBelumDibuka && styles.textDisabled,
                        ]}
                      >
                        Hapus
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          }}
        />
      )}

      {/* FAB Tambah Sesi */}
      <TouchableOpacity
        style={styles.fab}
        onPress={handleOpenAddModal}
        activeOpacity={0.85}
      >
        <Text style={styles.fabIcon}>+</Text>
        <Text style={styles.fabText}>Tambah Sesi</Text>
      </TouchableOpacity>

      {/* Modal Form */}
      <SessionFormModal
        visible={formModalVisible}
        initialData={selectedSession}
        onClose={() => setFormModalVisible(false)}
        onSubmit={handleSubmitForm}
      />

      {/* Modal Konfirmasi Hapus */}
      <ConfirmModal
        visible={deleteModalVisible}
        title="Hapus Sesi Praktikum?"
        message={`Apakah Anda yakin ingin menghapus jadwal "${sessionToDelete?.moduleName}"? Tindakan ini tidak dapat dibatalkan.`}
        confirmText={deleting ? 'Menghapus...' : 'Ya, Hapus'}
        cancelText="Batal"
        confirmVariant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          if (!deleting) setDeleteModalVisible(false);
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    padding: 16,
  },
  header: {
    marginBottom: 16,
  },
  backButton: {
    paddingVertical: 4,
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  backButtonText: {
    color: '#2563EB',
    fontSize: 14,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  listContent: {
    paddingBottom: 90,
  },
  emptyWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  courseTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
    flex: 1,
    marginRight: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  moduleName: {
    fontSize: 13,
    color: '#4B5563',
    marginBottom: 10,
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginBottom: 10,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  infoLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  infoValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1F2937',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  openDetailButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  openDetailButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  subActionGroup: {
    flexDirection: 'row',
    gap: 6,
  },
  subActionButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FAFAFA',
  },
  subActionTextEdit: {
    fontSize: 12,
    color: '#2563EB',
    fontWeight: '600',
  },
  subActionTextDelete: {
    fontSize: 12,
    color: '#DC2626',
    fontWeight: '600',
  },
  actionDisabled: {
    opacity: 0.4,
    backgroundColor: '#F3F4F6',
    borderColor: '#E5E7EB',
  },
  textDisabled: {
    color: '#9CA3AF',
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 20,
    backgroundColor: '#2563EB',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 30,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  fabIcon: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginRight: 6,
  },
  fabText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});

export default SessionManagementScreen;
