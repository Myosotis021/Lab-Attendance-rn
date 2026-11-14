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
import { useRouter } from 'expo-router';
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
    if (selectedClass) {
      await updateClass(selectedClass.id, data);
    } else {
      await createClass({
        ...data,
        createdBy: profile.name || 'Asisten',
      });
    }
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
      {/* Header Bar */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Text style={styles.backButtonText}>← Kembali</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Kelola Data Kelas</Text>
        <Text style={styles.headerSubtitle}>
          Daftar kelas praktikum & pengaturan mahasiswa praktikan
        </Text>
      </View>

      {/* Konten Utama */}
      {loading ? (
        <LoadingState message="Memuat daftar kelas praktikum..." />
      ) : error ? (
        <ErrorState message={error} onRetry={() => setError(null)} />
      ) : classes.length === 0 ? (
        <View style={styles.emptyWrapper}>
          <EmptyState
            message="Belum Ada Kelas"
            description="Silakan tambahkan kelas praktikum baru melalui tombol di bawah."
          />
        </View>
      ) : (
        <FlatList
          data={classes}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.titleCol}>
                  <Text style={styles.courseTitle}>{item.courseTitle}</Text>
                  <Text style={styles.classGroupBadge}>{item.classGroup}</Text>
                </View>
                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => handleOpenEditModal(item)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.editButtonText}>Ubah</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handlePromptDelete(item)}
                    activeOpacity={0.7}
                  >
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
        <Text style={styles.fabIcon}>+</Text>
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  titleCol: {
    flex: 1,
    marginRight: 10,
  },
  courseTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  classGroupBadge: {
    fontSize: 12,
    color: '#2563EB',
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  editButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1D4ED8',
  },
  deleteButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  deleteButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#DC2626',
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  infoLabel: {
    fontSize: 13,
    color: '#6B7280',
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
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

export default ClassManagementScreen;
