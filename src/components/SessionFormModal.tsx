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
} from 'react-native';
import { SessionItem, ClassItem } from '../types/models';
import { listenClasses } from '../services/classService';
import { theme } from '../theme';

interface SessionFormModalProps {
  visible: boolean;
  initialData?: SessionItem | null;
  onClose: () => void;
  onSubmit: (data: {
    classId: string;
    courseTitle: string;
    moduleName: string;
    classGroup: string;
    roomName: string;
    timeSlot: string;
    participantIds: string[];
  }) => Promise<void>;
}

interface FormContentProps {
  initialData?: SessionItem | null;
  onClose: () => void;
  onSubmit: (data: {
    classId: string;
    courseTitle: string;
    moduleName: string;
    classGroup: string;
    roomName: string;
    timeSlot: string;
    participantIds: string[];
  }) => Promise<void>;
}

const SessionFormContent: React.FC<FormContentProps> = ({
  initialData,
  onClose,
  onSubmit,
}) => {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>(
    initialData?.classId || ''
  );
  const [moduleName, setModuleName] = useState(initialData?.moduleName || '');
  const [timeSlot, setTimeSlot] = useState(initialData?.timeSlot || '');

  const [loadingClasses, setLoadingClasses] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [errors, setErrors] = useState<{
    classId?: string;
    moduleName?: string;
    timeSlot?: string;
    submit?: string;
  }>({});

  useEffect(() => {
    const unsubscribe = listenClasses(
      (data) => {
        setClasses(data);
        setLoadingClasses(false);
      },
      () => {
        setLoadingClasses(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, []);

  const handleSubmit = async () => {
    const newErrors: typeof errors = {};

    if (!selectedClassId) {
      newErrors.classId = 'Silakan pilih kelas praktikum.';
    }
    if (!moduleName.trim()) {
      newErrors.moduleName = 'Topik / modul praktikum wajib diisi.';
    }
    if (!timeSlot.trim()) {
      newErrors.timeSlot = 'Jadwal / waktu pelaksanaan wajib diisi.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const chosenClass = classes.find((c) => c.id === selectedClassId);
    if (!chosenClass) {
      setErrors({ classId: 'Data kelas tidak valid.' });
      return;
    }

    try {
      setSubmitting(true);
      setErrors({});
      await onSubmit({
        classId: chosenClass.id,
        courseTitle: chosenClass.courseTitle,
        classGroup: chosenClass.classGroup,
        roomName: chosenClass.roomName,
        moduleName: moduleName.trim(),
        timeSlot: timeSlot.trim(),
        participantIds: chosenClass.participantIds,
      });
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal menyimpan sesi.';
      setErrors({ submit: msg });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>
        {initialData ? 'Ubah Data Sesi' : 'Tambah Sesi Praktikum'}
      </Text>
      <Text style={styles.subtitle}>
        Pilih kelas praktikum acuan, tentukan materi modul, serta jadwal pelaksanaan.
      </Text>

      {errors.submit ? (
        <View style={styles.errorAlert}>
          <Text style={styles.errorAlertText}>{errors.submit}</Text>
        </View>
      ) : null}

      {/* Pilih Kelas Acuan */}
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Pilih Kelas Praktikum *</Text>
        {loadingClasses ? (
          <ActivityIndicator size="small" color={theme.colors.textPrimary} style={{ marginVertical: 8 }} />
        ) : classes.length === 0 ? (
          <View style={styles.emptyClassBox}>
            <Text style={styles.emptyClassText}>
              Belum ada kelas praktikum. Buat kelas terlebih dahulu di menu Kelola Kelas.
            </Text>
          </View>
        ) : (
          <View style={styles.classList}>
            {classes.map((c) => {
              const selected = selectedClassId === c.id;
              return (
                <TouchableOpacity
                  key={c.id}
                  style={[
                    styles.classItem,
                    selected && styles.classItemSelected,
                  ]}
                  onPress={() => {
                    setSelectedClassId(c.id);
                    if (errors.classId) setErrors((prev) => ({ ...prev, classId: undefined }));
                  }}
                  activeOpacity={0.7}
                >
                  <View style={[styles.radioCircle, selected && styles.radioCircleSelected]}>
                    {selected && <View style={styles.radioInner} />}
                  </View>
                  <View style={styles.classInfo}>
                    <Text style={styles.classCourseTitle}>{c.courseTitle}</Text>
                    <Text style={styles.classMeta}>
                      {c.classGroup} • {c.roomName} • {c.participantIds.length} Mahasiswa
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
        {errors.classId ? (
          <Text style={styles.errorText}>{errors.classId}</Text>
        ) : null}
      </View>

      {/* Topik / Modul Praktikum */}
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Topik / Modul Praktikum *</Text>
        <TextInput
          style={[styles.input, errors.moduleName ? styles.inputError : null]}
          placeholder="Contoh: Modul 3: State Management & Navigation"
          placeholderTextColor={theme.colors.textMuted}
          value={moduleName}
          onChangeText={(text) => {
            setModuleName(text);
            if (errors.moduleName) setErrors((prev) => ({ ...prev, moduleName: undefined }));
          }}
          editable={!submitting}
        />
        {errors.moduleName ? (
          <Text style={styles.errorText}>{errors.moduleName}</Text>
        ) : null}
      </View>

      {/* Waktu Pelaksanaan */}
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Jadwal / Waktu Pelaksanaan *</Text>
        <TextInput
          style={[styles.input, errors.timeSlot ? styles.inputError : null]}
          placeholder="Contoh: Senin, 08:00 - 10:00 WIB"
          placeholderTextColor={theme.colors.textMuted}
          value={timeSlot}
          onChangeText={(text) => {
            setTimeSlot(text);
            if (errors.timeSlot) setErrors((prev) => ({ ...prev, timeSlot: undefined }));
          }}
          editable={!submitting}
        />
        {errors.timeSlot ? (
          <Text style={styles.errorText}>{errors.timeSlot}</Text>
        ) : null}
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
          disabled={submitting || classes.length === 0}
          activeOpacity={0.85}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.submitBtnText}>
              {initialData ? 'Simpan Perubahan' : 'Tambah Sesi'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export const SessionFormModal: React.FC<SessionFormModalProps> = ({
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
          <SessionFormContent
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
  emptyClassBox: {
    padding: 12,
    backgroundColor: theme.colors.surfaceSubtle,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  emptyClassText: {
    fontSize: 12,
    color: theme.colors.textMuted,
    lineHeight: 17,
  },
  classList: {
    maxHeight: 160,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    padding: 6,
    backgroundColor: theme.colors.surfaceSubtle,
  },
  classItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  classItemSelected: {
    backgroundColor: 'rgba(20, 20, 43, 0.05)',
  },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface,
  },
  radioCircleSelected: {
    borderColor: theme.colors.textPrimary,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.textPrimary,
  },
  classInfo: {
    flex: 1,
  },
  classCourseTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  classMeta: {
    fontSize: 11,
    color: theme.colors.textMuted,
    marginTop: 1,
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

export default SessionFormModal;
