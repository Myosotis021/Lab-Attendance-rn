import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { ClassItem } from '../types/models';
import {
  listenClasses,
  createClass,
  updateClass,
  deleteClass,
} from '../services/classService';
import { useAuth } from '../hooks/useAuth';
import { LoadingState } from '../components/LoadingState';
import { ErrorState } from '../components/ErrorState';
import { EmptyState } from '../components/EmptyState';
import { ConfirmModal } from '../components/ConfirmModal';
import { ClassFormModal } from '../components/ClassFormModal';
import { getErrorMessage } from '../utils/getErrorMessage';
import { theme } from '../theme';

export const ClassManagementScreen: React.FC = () => {
  const router = useRouter();
  const { profile } = useAuth();

  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal Form state
  const [formModalVisible, setFormModalVisible] = useState(false);
  const [selectedClass, setSelectedClass] = useState<ClassItem | null>(null);

  // Confirm Delete Modal state
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [classToDelete, setClassToDelete] = useState<ClassItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (profile?.role !== 'asisten') return;
    const unsubscribe = listenClasses(
      (data) => {
        // Urutkan kelas berdasarkan judul/nama
        data.sort((a, b) => a.courseTitle.localeCompare(b.courseTitle));
        setClasses(data);
        setLoading(false);
        setError(null);
      },
      (err) => {
        setError(getErrorMessage(err));
        setLoading(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [profile?.role]);

  const handleOpenAddModal = () => {
    setSelectedClass(null);
    setFormModalVisible(true);
  };

  const handleOpenEditModal = (item: ClassItem) => {
    setSelectedClass(item);
    setFormModalVisible(true);
  };

  const handlePromptDelete = (item: ClassItem) => {
    setClassToDelete(item);
    setDeleteModalVisible(true);
  };

  const handleConfirmDelete = async () => {
    if (!classToDelete) return;
    try {
      setDeleting(true);
      await deleteClass(classToDelete.id);
      setDeleteModalVisible(false);
      setClassToDelete(null);
    } catch (err: unknown) {
      setDeleteModalVisible(false);
      const msg = getErrorMessage(err);
      Alert.alert('Gagal Menghapus Kelas', msg);
    } finally {
      setDeleting(false);
    }
  };

  const handleSubmitForm = async (data: {
    courseTitle: string;
    classGroup: string;
    roomName: string;
    participantIds: string[];
  }) => {
    try {
      if (profile?.uid && data.participantIds.includes(profile.uid)) {
        Alert.alert(
          'Validasi Gagal',
          'Anda tidak dapat menambahkan diri sendiri sebagai peserta kelas.'
        );
        throw new Error('Anda tidak dapat menambahkan diri sendiri sebagai peserta kelas.');
      }
      if (selectedClass) {
        await updateClass(selectedClass.id, data, profile?.uid);
      } else {
        await createClass({
          ...data,
          createdBy: profile?.name || 'Asisten',
          currentUserId: profile?.uid,
        });
      }
    } catch (err: unknown) {
      const msg = getErrorMessage(err);
      Alert.alert('Gagal Menyimpan Kelas', msg);
      throw err;
    }
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
            <Text style={styles.screenTitle}>Kelola Data Kelas</Text>
            <Text style={styles.screenSubtitle}>
              Daftar kelas praktikum & pengaturan mahasiswa
            </Text>
          </View>
        </View>

        {/* Konten Utama */}
        {loading ? (
          <LoadingState message="Memuat daftar kelas praktikum..." />
        ) : error ? (
          <ErrorState message={error} onRetry={() => setError(null)} />
        ) : classes.length === 0 ? (
          <View style={styles.emptyWrapper}>
            <EmptyState
              message="Belum Ada Kelas Praktikum"
              description="Silakan tambahkan kelas praktikum baru melalui tombol di bawah."
            />
          </View>
        ) : (
          <FlatList
            data={classes}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.titleCol}>
                    <Text style={styles.courseTitle}>{item.courseTitle}</Text>
                    <View style={styles.classGroupPill}>
                      <Text style={styles.classGroupText}>{item.classGroup}</Text>
                    </View>
                  </View>
                  <View style={styles.actionRow}>
                    <TouchableOpacity
                      style={styles.editButton}
                      onPress={() => handleOpenEditModal(item)}
                      activeOpacity={0.7}
                    >
                      <Feather name="edit-2" size={13} color={theme.colors.textPrimary} style={styles.btnIcon} />
                      <Text style={styles.editButtonText}>Ubah</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => handlePromptDelete(item)}
                      activeOpacity={0.7}
                    >
                      <Feather name="trash-2" size={13} color="#DC2626" style={styles.btnIcon} />
                      <Text style={styles.deleteButtonText}>Hapus</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.cardDivider} />

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Ruangan Lab:</Text>
                  <Text style={styles.infoValue}>{item.roomName}</Text>
                </View>

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Jumlah Peserta:</Text>
                  <Text style={styles.infoValue}>
                    {item.participantIds.length} Mahasiswa
                  </Text>
                </View>
              </View>
            )}
          />
        )}

        {/* Floating Action Button (FAB) Tambah Kelas */}
        <TouchableOpacity
          style={styles.fab}
          onPress={handleOpenAddModal}
          activeOpacity={0.85}
        >
          <Feather name="plus" size={18} color="#FFFFFF" style={styles.fabIcon} />
          <Text style={styles.fabText}>Tambah Kelas</Text>
        </TouchableOpacity>

        {/* Modal Form Tambah/Ubah Kelas */}
        <ClassFormModal
          visible={formModalVisible}
          initialData={selectedClass}
          onClose={() => setFormModalVisible(false)}
          onSubmit={handleSubmitForm}
        />

        {/* Modal Konfirmasi Hapus Kelas */}
        <ConfirmModal
          visible={deleteModalVisible}
          title="Hapus Kelas Praktikum?"
          message={`Apakah Anda yakin ingin menghapus kelas "${classToDelete?.courseTitle} - ${classToDelete?.classGroup}"? Tindakan ini tidak dapat dibatalkan.`}
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
  classGroupPill: {
    alignSelf: 'flex-start',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 4,
  },
  classGroupText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#2563EB',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 6,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.sm,
  },
  editButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECACA',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.sm,
  },
  deleteButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#DC2626',
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
    marginRight: 3,
  },
});

export default ClassManagementScreen;
