import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { ClassItem, UserProfile } from '../types/models';
import { getStudents } from '../services/classService';

interface ClassFormModalProps {
  visible: boolean;
  initialData?: ClassItem | null;
  onClose: () => void;
  onSubmit: (data: {
    courseTitle: string;
    classGroup: string;
    roomName: string;
    participantIds: string[];
  }) => Promise<void>;
}

interface FormContentProps {
  initialData?: ClassItem | null;
  onClose: () => void;
  onSubmit: (data: {
    courseTitle: string;
    classGroup: string;
    roomName: string;
    participantIds: string[];
  }) => Promise<void>;
}

const ClassFormContent: React.FC<FormContentProps> = ({
  initialData,
  onClose,
  onSubmit,
}) => {
  const [courseTitle, setCourseTitle] = useState(initialData?.courseTitle || '');
  const [classGroup, setClassGroup] = useState(initialData?.classGroup || '');
  const [roomName, setRoomName] = useState(initialData?.roomName || '');
  const [participantIds, setParticipantIds] = useState<string[]>(
    initialData?.participantIds || []
  );

  const [availableStudents, setAvailableStudents] = useState<UserProfile[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [errors, setErrors] = useState<{
    courseTitle?: string;
    classGroup?: string;
    roomName?: string;
    submit?: string;
  }>({});

  useEffect(() => {
    let isMounted = true;
    getStudents()
      .then((students) => {
        if (isMounted) {
          setAvailableStudents(students);
          setLoadingStudents(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setLoadingStudents(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const toggleStudent = (uid: string) => {
    setParticipantIds((prev) =>
      prev.includes(uid) ? prev.filter((id) => id !== uid) : [...prev, uid]
    );
  };

  const handleSelectAllStudents = () => {
    if (participantIds.length === availableStudents.length) {
      setParticipantIds([]);
    } else {
      setParticipantIds(availableStudents.map((s) => s.uid));
    }
  };

  const handleSubmit = async () => {
    const newErrors: typeof errors = {};

    if (!courseTitle.trim()) {
      newErrors.courseTitle = 'Mata praktikum wajib diisi.';
    }
    if (!classGroup.trim()) {
      newErrors.classGroup = 'Kelas praktikum wajib diisi.';
    }
    if (!roomName.trim()) {
      newErrors.roomName = 'Ruangan lab wajib diisi.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setSubmitting(true);
      setErrors({});
      await onSubmit({
        courseTitle: courseTitle.trim(),
        classGroup: classGroup.trim(),
        roomName: roomName.trim(),
        participantIds,
      });
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal menyimpan kelas.';
      setErrors({ submit: msg });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>
        {initialData ? 'Ubah Data Kelas' : 'Tambah Kelas Baru'}
      </Text>
      <Text style={styles.subtitle}>
        Kelola mata praktikum, grup kelas, ruangan, dan daftar mahasiswa praktikan.
      </Text>

      {errors.submit ? (
        <View style={styles.errorAlert}>
          <Text style={styles.errorAlertText}>{errors.submit}</Text>
        </View>
      ) : null}

      {/* Mata Praktikum */}
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Mata Praktikum *</Text>
        <TextInput
          style={[styles.input, errors.courseTitle ? styles.inputError : null]}
          placeholder="Contoh: Pemrograman Perangkat Komputasi"
          value={courseTitle}
          onChangeText={(text) => {
            setCourseTitle(text);
            if (errors.courseTitle) setErrors((prev) => ({ ...prev, courseTitle: undefined }));
          }}
          editable={!submitting}
        />
        {errors.courseTitle ? (
          <Text style={styles.errorText}>{errors.courseTitle}</Text>
        ) : null}
      </View>

      {/* Grup Kelas */}
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Kelas Praktikum *</Text>
        <TextInput
          style={[styles.input, errors.classGroup ? styles.inputError : null]}
          placeholder="Contoh: Kelas A / Praktikum 1"
          value={classGroup}
          onChangeText={(text) => {
            setClassGroup(text);
            if (errors.classGroup) setErrors((prev) => ({ ...prev, classGroup: undefined }));
          }}
          editable={!submitting}
        />
        {errors.classGroup ? (
          <Text style={styles.errorText}>{errors.classGroup}</Text>
        ) : null}
      </View>

      {/* Ruangan Lab */}
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Ruangan Lab *</Text>
        <TextInput
          style={[styles.input, errors.roomName ? styles.inputError : null]}
          placeholder="Contoh: Lab Komputer 2 (Gedung B)"
          value={roomName}
          onChangeText={(text) => {
            setRoomName(text);
            if (errors.roomName) setErrors((prev) => ({ ...prev, roomName: undefined }));
          }}
          editable={!submitting}
        />
        {errors.roomName ? (
          <Text style={styles.errorText}>{errors.roomName}</Text>
        ) : null}
      </View>

      {/* Peserta Praktikan */}
      <View style={styles.fieldContainer}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.label}>
            Peserta Praktikan ({participantIds.length} dipilih)
          </Text>
          {availableStudents.length > 0 && (
            <TouchableOpacity onPress={handleSelectAllStudents} activeOpacity={0.7}>
              <Text style={styles.selectAllText}>
                {participantIds.length === availableStudents.length
                  ? 'Batal Pilih Semua'
                  : 'Pilih Semua'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {loadingStudents ? (
          <ActivityIndicator size="small" color="#2563EB" style={{ marginVertical: 12 }} />
        ) : (
          <View style={styles.studentsListContainer}>
            <FlatList
              data={availableStudents}
              keyExtractor={(item) => item.uid}
              scrollEnabled={false}
              renderItem={({ item }) => {
                const isSelected = participantIds.includes(item.uid);
                return (
                  <TouchableOpacity
                    style={[
                      styles.studentRow,
                      isSelected && styles.studentRowSelected,
                    ]}
                    onPress={() => toggleStudent(item.uid)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                      {isSelected && <Text style={styles.checkmark}>✓</Text>}
                    </View>
                    <View style={styles.studentInfo}>
                      <Text style={styles.studentName}>{item.name}</Text>
                      <Text style={styles.studentNim}>NIM: {item.nim || '-'}</Text>
                    </View>
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={
                <Text style={styles.emptyStudentsText}>
                  Tidak ada mahasiswa praktikan terdaftar.
                </Text>
              }
            />
          </View>
        )}
      </View>

      {/* Buttons */}
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={onClose}
          disabled={submitting}
          activeOpacity={0.7}
        >
          <Text style={styles.cancelButtonText}>Batal</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.submitButton, submitting && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
          activeOpacity={0.8}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.submitButtonText}>
              {initialData ? 'Simpan Perubahan' : 'Buat Kelas'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export const ClassFormModal: React.FC<ClassFormModalProps> = ({
  visible,
  initialData,
  onClose,
  onSubmit,
}) => {
  if (!visible) return null;

  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.dialogBox} onPress={(e) => e.stopPropagation()}>
          <ClassFormContent
            key={initialData?.id || 'new_class'}
            initialData={initialData}
            onClose={onClose}
            onSubmit={onSubmit}
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  dialogBox: {
    width: '94%',
    maxHeight: '85%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 16,
    lineHeight: 16,
  },
  errorAlert: {
    backgroundColor: '#FEE2E2',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  errorAlertText: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '600',
  },
  fieldContainer: {
    marginBottom: 14,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#CED4DA',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    minHeight: 48,
    backgroundColor: '#FAFAFA',
    color: '#1F2937',
  },
  inputError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 11,
    marginTop: 4,
    fontWeight: '500',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  selectAllText: {
    fontSize: 12,
    color: '#2563EB',
    fontWeight: '600',
  },
  studentsListContainer: {
    maxHeight: 240,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
    padding: 6,
  },
  studentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 6,
    marginBottom: 4,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  studentRowSelected: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#9CA3AF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  checkboxSelected: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
  },
  studentNim: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 1,
  },
  emptyStudentsText: {
    textAlign: 'center',
    padding: 12,
    fontSize: 12,
    color: '#9CA3AF',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 18,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  cancelButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4B5563',
  },
  submitButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#2563EB',
    minWidth: 120,
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});

export default ClassFormModal;
