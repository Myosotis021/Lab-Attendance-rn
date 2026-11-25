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
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { ClassItem, UserProfile } from '../types/models';
import { getStudents } from '../services/classService';
import { useAuth } from '../hooks/useAuth';
import { RoomPlaceSelector } from './RoomPlaceSelector';
import { theme } from '../theme';

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
  const [roomName, setRoomName] = useState(initialData?.roomName || 'Lab B');
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

  const { profile } = useAuth();

  const toggleStudent = (uid: string) => {
    if (profile?.uid && uid === profile.uid) {
      Alert.alert(
        'Peringatan',
        'Anda tidak dapat menambahkan diri sendiri sebagai peserta kelas.'
      );
      return;
    }
    setParticipantIds((prev) =>
      prev.includes(uid) ? prev.filter((id) => id !== uid) : [...prev, uid]
    );
  };

  const handleSelectAllStudents = () => {
    if (participantIds.length > 0) {
      setParticipantIds([]);
    } else {
      const allowed = availableStudents
        .map((s) => s.uid)
        .filter((uid) => !profile?.uid || uid !== profile.uid);
      setParticipantIds(allowed);
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

    if (profile?.uid && participantIds.includes(profile.uid)) {
      setErrors({ submit: 'Anda tidak dapat menambahkan diri sendiri sebagai peserta kelas.' });
      Alert.alert('Peringatan', 'Anda tidak dapat menambahkan diri sendiri sebagai peserta kelas.');
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
          placeholder="Contoh: Pemrograman Perangkat Bergerak"
          placeholderTextColor={theme.colors.textMuted}
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
          placeholder="Contoh: Kelas A"
          placeholderTextColor={theme.colors.textMuted}
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

      {/* Ruangan / Tempat Lab */}
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Tempat / Ruangan Praktikum *</Text>
        <RoomPlaceSelector
          value={roomName}
          onChange={(nextRoom) => {
            setRoomName(nextRoom);
            if (errors.roomName) setErrors((prev) => ({ ...prev, roomName: undefined }));
          }}
          disabled={submitting}
          error={errors.roomName}
        />
      </View>

      {/* Peserta Praktikan */}
      <View style={styles.fieldContainer}>
        <View style={styles.studentHeaderRow}>
          <Text style={styles.label}>
            Peserta Praktikan ({participantIds.length} dipilih)
          </Text>
          {availableStudents.length > 0 && (
            <TouchableOpacity onPress={handleSelectAllStudents}>
              <Text style={styles.selectAllText}>
                {participantIds.length === availableStudents.length
                  ? 'Batal Semua'
                  : 'Pilih Semua'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {loadingStudents ? (
          <ActivityIndicator size="small" color={theme.colors.textPrimary} style={{ marginVertical: 8 }} />
        ) : availableStudents.length === 0 ? (
          <Text style={styles.emptyStudentText}>
            Belum ada mahasiswa praktikan yang terdaftar.
          </Text>
        ) : (
          <View style={styles.studentList}>
            {availableStudents.map((student) => {
              const selected = participantIds.includes(student.uid);
              return (
                <TouchableOpacity
                  key={student.uid}
                  style={[
                    styles.studentItem,
                    selected && styles.studentItemSelected,
                  ]}
                  onPress={() => toggleStudent(student.uid)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.checkbox, selected && styles.checkboxSelected]}>
                    {selected && <Feather name="check" size={12} color="#FFFFFF" />}
                  </View>
                  <View style={styles.studentInfo}>
                    <Text style={styles.studentName}>{student.name}</Text>
                    {student.nim ? (
                      <Text style={styles.studentNim}>NIM: {student.nim}</Text>
                    ) : (
                      <Text style={styles.studentNim}>{student.email}</Text>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={styles.cancelBtn}
          onPress={onClose}
          disabled={submitting}
          activeOpacity={0.8}
        >
          <Text style={styles.cancelBtnText}>Batal</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
          activeOpacity={0.85}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.submitBtnText}>
              {initialData ? 'Simpan Perubahan' : 'Tambah Kelas'}
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
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          <ClassFormContent
            key={initialData ? initialData.id : 'new'}
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
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.borderRadius.xxl,
    borderTopRightRadius: theme.borderRadius.xxl,
    padding: 24,
    maxHeight: '90%',
    ...theme.shadows.card,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: theme.colors.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: 18,
    lineHeight: 18,
  },
  errorAlert: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: theme.borderRadius.md,
    padding: 10,
    marginBottom: 14,
  },
  errorAlertText: {
    color: '#DC2626',
    fontSize: 12,
  },
  fieldContainer: {
    marginBottom: 14,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: 6,
  },
  input: {
    backgroundColor: theme.colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 13,
    color: theme.colors.textPrimary,
  },
  inputError: {
    borderColor: '#EF4444',
  },
  errorText: {
    fontSize: 11,
    color: '#EF4444',
    marginTop: 4,
  },
  studentHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  selectAllText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.primaryBlue,
  },
  emptyStudentText: {
    fontSize: 12,
    color: theme.colors.textMuted,
    fontStyle: 'italic',
  },
  studentList: {
    maxHeight: 160,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    padding: 6,
    backgroundColor: theme.colors.surfaceSubtle,
  },
  studentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  studentItemSelected: {
    backgroundColor: 'rgba(20, 20, 43, 0.05)',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface,
  },
  checkboxSelected: {
    backgroundColor: theme.colors.textPrimary,
    borderColor: theme.colors.textPrimary,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  studentNim: {
    fontSize: 11,
    color: theme.colors.textMuted,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
    marginBottom: 10,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceSubtle,
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.textSecondary,
  },
  submitBtn: {
    flex: 2,
    paddingVertical: 13,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.textPrimary,
    alignItems: 'center',
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});

export default ClassFormModal;
