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

        // If no class selected yet, pick the first class
        setSelectedClassId((current) => {
          if (!current && data.length > 0) {
            return data[0].id;
          }
          return current;
        });
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
      newErrors.classId = 'Pilih kelas praktikum.';
    }
    if (!moduleName.trim()) {
      newErrors.moduleName = 'Nama modul / topik praktikum wajib diisi.';
    }
    if (!timeSlot.trim()) {
      newErrors.timeSlot = 'Waktu pelaksanaan wajib diisi.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const matchedClass = classes.find((c) => c.id === selectedClassId);
    if (!matchedClass) {
      setErrors({ classId: 'Kelas yang dipilih tidak valid.' });
      return;
    }

    try {
      setSubmitting(true);
      setErrors({});
      await onSubmit({
        classId: matchedClass.id,
        courseTitle: matchedClass.courseTitle,
        moduleName: moduleName.trim(),
        classGroup: matchedClass.classGroup,
        roomName: matchedClass.roomName,
        timeSlot: timeSlot.trim(),
        participantIds: matchedClass.participantIds || [],
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
        {initialData ? 'Ubah Sesi Praktikum' : 'Tambah Sesi Baru'}
      </Text>
      <Text style={styles.subtitle}>
        Atur jadwal sesi praktikum. Status awal akan otomatis ditetapkan ke BELUM DIBUKA.
      </Text>

      {errors.submit ? (
        <View style={styles.errorAlert}>
          <Text style={styles.errorAlertText}>{errors.submit}</Text>
        </View>
      ) : null}

      {/* Pilih Kelas */}
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Pilih Kelas Praktikum *</Text>
        {loadingClasses ? (
          <ActivityIndicator size="small" color="#2563EB" style={{ marginVertical: 8 }} />
        ) : classes.length === 0 ? (
          <View style={styles.noClassWarning}>
            <Text style={styles.noClassWarningText}>
              Belum ada kelas tersedia. Silakan buat kelas terlebih dahulu di menu Kelola Kelas.
            </Text>
          </View>
        ) : (
          <View style={styles.classListContainer}>
            {classes.map((cls) => {
              const isSelected = selectedClassId === cls.id;
              return (
                <TouchableOpacity
                  key={cls.id}
                  style={[
                    styles.classOption,
                    isSelected && styles.classOptionSelected,
                  ]}
                  onPress={() => {
                    setSelectedClassId(cls.id);
                    if (errors.classId) setErrors((prev) => ({ ...prev, classId: undefined }));
                  }}
                  activeOpacity={0.7}
                  disabled={submitting}
                >
                  <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
                    {isSelected && <View style={styles.radioInnerCircle} />}
                  </View>
                  <View style={styles.classInfo}>
                    <Text style={styles.classTitle}>
                      {cls.courseTitle} ({cls.classGroup})
                    </Text>
                    <Text style={styles.classSubtitle}>
                      {cls.roomName} • {cls.participantIds.length} Peserta
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

      {/* Modul Praktikum */}
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Nama Modul / Topik *</Text>
        <TextInput
          style={[styles.input, errors.moduleName ? styles.inputError : null]}
          placeholder="Contoh: Modul 2 - Pemrograman Asinkron & Firebase"
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
        <Text style={styles.label}>Waktu Pelaksanaan *</Text>
        <TextInput
          style={[styles.input, errors.timeSlot ? styles.inputError : null]}
          placeholder="Contoh: Jumat, 13:00 - 15:30 WIB"
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

      {/* Tombol Aksi */}
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
          style={[
            styles.submitButton,
            (submitting || classes.length === 0) && styles.buttonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={submitting || classes.length === 0}
          activeOpacity={0.8}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.submitButtonText}>
              {initialData ? 'Simpan Perubahan' : 'Buat Sesi'}
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
          <SessionFormContent
            key={initialData?.id || 'new_session'}
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
  noClassWarning: {
    padding: 12,
    backgroundColor: '#FFFBEB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  noClassWarningText: {
    fontSize: 12,
    color: '#B45309',
    lineHeight: 16,
  },
  classListContainer: {
    maxHeight: 160,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 6,
    backgroundColor: '#F9FAFB',
  },
  classOption: {
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
  classOptionSelected: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#9CA3AF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  radioCircleSelected: {
    borderColor: '#2563EB',
  },
  radioInnerCircle: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#2563EB',
  },
  classInfo: {
    flex: 1,
  },
  classTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
  },
  classSubtitle: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 1,
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

export default SessionFormModal;
