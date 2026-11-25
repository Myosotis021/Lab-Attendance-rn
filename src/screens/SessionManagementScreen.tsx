import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
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
import {
  SessionFormModal,
  SessionFormSubmitData,
} from '../components/SessionFormModal';
import { getErrorMessage } from '../utils/getErrorMessage';
import { getSessionStatusLabel } from '../utils/labelUtils';
import { theme } from '../theme';

const STATUS_CONFIG: Record<
  SessionStatus,
  { label: string; bg: string; text: string; border: string }
> = {
  BELUM_DIBUKA: {
    label: getSessionStatusLabel('BELUM_DIBUKA'),
    bg: theme.colors.status.belumDibuka.bg,
    text: theme.colors.status.belumDibuka.text,
    border: theme.colors.status.belumDibuka.border,
  },
  BERJALAN: {
    label: getSessionStatusLabel('BERJALAN'),
    bg: theme.colors.status.berjalan.bg,
    text: theme.colors.status.berjalan.text,
    border: theme.colors.status.berjalan.border,
  },
  SELESAI: {
    label: getSessionStatusLabel('SELESAI'),
    bg: theme.colors.status.selesai.bg,
    text: theme.colors.status.selesai.text,
    border: theme.colors.status.selesai.border,
  },
};

export const SessionManagementScreen: React.FC = () => {
  const router = useRouter();
  const { profile } = useAuth();
  const { sessions, loading, refreshing, error, refresh } = useSessions();

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

  const handleSubmitForm = async (data: SessionFormSubmitData) => {
    if (selectedSession) {
      await updateSession(selectedSession.id, {
        moduleName: data.moduleName,
        timeSlot: data.timeSlot,
        scheduledAt: data.scheduledAt,
        scheduledEndAt: data.scheduledEndAt,
        courseTitle: data.courseTitle,
        classGroup: data.classGroup,
        roomName: data.roomName,
        sessionType: data.sessionType,
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
      <LinearGradient colors={theme.colors.backgroundGradient} style={styles.flexOne}>
        <SafeAreaView style={styles.safeArea}>
          <ErrorState
            title="Akses Ditolak"
            message="Anda tidak memiliki izin untuk mengakses halaman ini. Halaman ini khusus untuk Asisten Laboratorium."
            onRetry={() => router.replace('/')}
            retryText="Kembali ke Beranda"
          />
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={theme.colors.backgroundGradient} style={styles.flexOne}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <StatusBar style="dark" />

        {/* Header Bar */}
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Feather name="arrow-left" size={20} color={theme.colors.textPrimary} />
          </TouchableOpacity>

          <View style={styles.headerTitleGroup}>
            <Text style={styles.screenTitle}>Kelola Jadwal & Sesi</Text>
            <Text style={styles.screenSubtitle}>
              Pengaturan sesi praktikum laboratorium
            </Text>
          </View>
        </View>

        {/* Main List */}
        {loading ? (
          <LoadingState message="Memuat jadwal sesi praktikum..." />
        ) : error ? (
          <ErrorState message={error} onRetry={refresh} retryText="Muat Ulang" />
        ) : sessions.length === 0 ? (
          <View style={styles.emptyWrapper}>
            <EmptyState
              message="Belum Ada Sesi Praktikum"
              description="Silakan tambahkan jadwal sesi praktikum baru melalui tombol di bawah."
            />
          </View>
        ) : (
          <FlatList
            data={sessions}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={refresh} />
            }
            renderItem={({ item }) => {
              const statusCfg =
                STATUS_CONFIG[item.status] || STATUS_CONFIG.BELUM_DIBUKA;
              const isEditable = item.status === 'BELUM_DIBUKA';

              return (
                <View style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View style={styles.titleCol}>
                      <Text style={styles.courseTitle}>{item.courseTitle}</Text>
                      <Text style={styles.moduleName}>{item.moduleName}</Text>
                    </View>
                    <View
                      style={[
                        styles.badge,
                        {
                          backgroundColor: statusCfg.bg,
                          borderColor: statusCfg.border,
                        },
                      ]}
                    >
                      <Text
                        style={[styles.badgeText, { color: statusCfg.text }]}
                      >
                        {statusCfg.label}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.cardDivider} />

                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Kelas & Ruang:</Text>
                    <Text style={styles.infoValue}>
                      {item.classGroup} • {item.roomName}
                    </Text>
                  </View>

                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Waktu Pelaksanaan:</Text>
                    <Text style={styles.infoValue}>{item.timeSlot}</Text>
                  </View>

                  {/* Action Buttons */}
                  <View style={styles.cardActionsRow}>
                    <TouchableOpacity
                      style={styles.openControlBtn}
                      onPress={() => handleGoToAssistantSession(item)}
                      activeOpacity={0.8}
                    >
                      <Feather name="external-link" size={13} color="#FFFFFF" style={styles.btnIcon} />
                      <Text style={styles.openControlBtnText}>
                        Buka Kontrol Sesi
                      </Text>
                    </TouchableOpacity>

                    {isEditable && (
                      <View style={styles.editDeleteGroup}>
                        <TouchableOpacity
                          style={styles.editBtn}
                          onPress={() => handleOpenEditModal(item)}
                          activeOpacity={0.7}
                        >
                          <Feather name="edit-2" size={13} color={theme.colors.textPrimary} style={styles.btnIcon} />
                          <Text style={styles.editBtnText}>Ubah</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.deleteBtn}
                          onPress={() => handlePromptDelete(item)}
                          activeOpacity={0.7}
                        >
                          <Feather name="trash-2" size={13} color="#DC2626" style={styles.btnIcon} />
                          <Text style={styles.deleteBtnText}>Hapus</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                </View>
              );
            }}
          />
        )}

        {/* Floating Action Button (FAB) Tambah Sesi */}
        <TouchableOpacity
          style={styles.fab}
          onPress={handleOpenAddModal}
          activeOpacity={0.85}
        >
          <Feather name="plus" size={18} color="#FFFFFF" style={styles.fabIcon} />
          <Text style={styles.fabText}>Tambah Sesi</Text>
        </TouchableOpacity>

        {/* Modal Form Tambah/Ubah Sesi */}
        <SessionFormModal
          visible={formModalVisible}
          initialData={selectedSession}
          onClose={() => setFormModalVisible(false)}
          onSubmit={handleSubmitForm}
        />

        {/* Modal Konfirmasi Hapus Sesi */}
        <ConfirmModal
          visible={deleteModalVisible}
          title="Hapus Sesi Praktikum?"
          message={`Apakah Anda yakin ingin menghapus sesi "${sessionToDelete?.courseTitle} - ${sessionToDelete?.moduleName}"? Tindakan ini tidak dapat dibatalkan.`}
          confirmText={deleting ? 'Menghapus...' : 'Ya, Hapus'}
          cancelText="Batal"
          confirmVariant="danger"
          onConfirm={handleConfirmDelete}
          onCancel={() => {
            if (!deleting) setDeleteModalVisible(false);
          }}
        />
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
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 90,
  },
  emptyWrapper: {
    paddingHorizontal: 16,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl,
    padding: 18,
    marginBottom: 14,
    ...theme.shadows.card,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  titleCol: {
    flex: 1,
    marginRight: 8,
  },
  courseTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.colors.textPrimary,
  },
  moduleName: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  cardDivider: {
    height: 1,
    backgroundColor: theme.colors.borderLight,
    marginVertical: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  infoLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  infoValue: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  cardActionsRow: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderColor: theme.colors.borderLight,
    gap: 8,
  },
  openControlBtn: {
    backgroundColor: theme.colors.textPrimary,
    borderRadius: theme.borderRadius.md,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  openControlBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  editDeleteGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  editBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingVertical: 8,
    borderRadius: theme.borderRadius.md,
  },
  editBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  deleteBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECACA',
    paddingVertical: 8,
    borderRadius: theme.borderRadius.md,
  },
  deleteBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#DC2626',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    backgroundColor: theme.colors.textPrimary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 20,
    borderRadius: theme.borderRadius.full,
    ...theme.shadows.card,
  },
  fabIcon: {
    marginRight: 6,
  },
  fabText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  btnIcon: {
    marginRight: 4,
  },
});

export default SessionManagementScreen;
