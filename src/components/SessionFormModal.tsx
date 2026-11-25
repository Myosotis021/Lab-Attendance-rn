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
import { Timestamp } from 'firebase/firestore';
import { SessionItem, ClassItem, SessionType } from '../types/models';
import { listenClasses } from '../services/classService';
import { TimeSlotPicker, TimeSlotPickerValue } from './TimeSlotPicker';
import { RoomPlaceSelector } from './RoomPlaceSelector';
import { isOnlineRoom } from '../data/labLocations';
import {
  formatSessionScheduleLabel,
  getDefaultSessionSchedule,
  toJakartaDate,
} from '../utils/timeUtils';
import { theme } from '../theme';

export interface SessionFormSubmitData {
  classId: string;
  courseTitle: string;
  moduleName: string;
  classGroup: string;
  roomName: string;
  sessionType: SessionType;
  timeSlot: string;
  scheduledAt: Timestamp;
  scheduledEndAt: Timestamp;
  participantIds: string[];
}

interface SessionFormModalProps {
  visible: boolean;
  initialData?: SessionItem | null;
  onClose: () => void;
  onSubmit: (data: SessionFormSubmitData) => Promise<void>;
}

interface FormContentProps {
  initialData?: SessionItem | null;
  onClose: () => void;
  onSubmit: (data: SessionFormSubmitData) => Promise<void>;
}

const buildInitialTimeSlotValue = (
  initialData?: SessionItem | null
): TimeSlotPickerValue => {
  const def = getDefaultSessionSchedule();
  if (
    initialData?.usesDateTimePicker &&
    initialData.scheduledAt &&
    initialData.scheduledEndAt
  ) {
    const sDate = toJakartaDate(initialData.scheduledAt) || def.startDate;
    const eDate = toJakartaDate(initialData.scheduledEndAt) || def.endDate;
    const sHHMM = `${String(sDate.getHours()).padStart(2, '0')}:${String(
      sDate.getMinutes()
    ).padStart(2, '0')}`;
    const eHHMM = `${String(eDate.getHours()).padStart(2, '0')}:${String(
      eDate.getMinutes()
    ).padStart(2, '0')}`;
    return {
      date: sDate,
      startTime: sHHMM,
      endTime: eHHMM,
      scheduledAt: Timestamp.fromDate(sDate),
      scheduledEndAt: Timestamp.fromDate(eDate),
      timeSlot: formatSessionScheduleLabel(sDate, eDate),
    };
  }

  return {
    date: def.startDate,
    startTime: `${String(def.startDate.getHours()).padStart(2, '0')}:${String(
      def.startDate.getMinutes()
    ).padStart(2, '0')}`,
    endTime: `${String(def.endDate.getHours()).padStart(2, '0')}:${String(
      def.endDate.getMinutes()
    ).padStart(2, '0')}`,
    scheduledAt: def.scheduledAt,
    scheduledEndAt: def.scheduledEndAt,
    timeSlot: def.timeSlot,
  };
};

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
  const [roomName, setRoomName] = useState(initialData?.roomName || 'Lab B');
  const [sessionType, setSessionType] = useState<SessionType>(
    initialData?.sessionType ||
      (isOnlineRoom(initialData?.roomName) ? 'ONLINE' : 'OFFLINE')
  );
  const [scheduleValue, setScheduleValue] = useState<TimeSlotPickerValue>(() =>
    buildInitialTimeSlotValue(initialData)
  );

  const [loadingClasses, setLoadingClasses] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [errors, setErrors] = useState<{
    classId?: string;
    moduleName?: string;
    roomName?: string;
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

  const handleSelectClass = (chosen: ClassItem) => {
    setSelectedClassId(chosen.id);
    if (!initialData && chosen.roomName) {
      setRoomName(chosen.roomName);
      setSessionType(isOnlineRoom(chosen.roomName) ? 'ONLINE' : 'OFFLINE');
    }
    if (errors.classId) {
      setErrors((prev) => ({ ...prev, classId: undefined }));
    }
  };

  const handleSubmit = async () => {
    const newErrors: typeof errors = {};

    if (!selectedClassId) {
      newErrors.classId = 'Silakan pilih kelas praktikum.';
    }
    if (!moduleName.trim()) {
      newErrors.moduleName = 'Topik / modul praktikum wajib diisi.';
    }
    if (sessionType !== 'ONLINE' && !roomName.trim()) {
      newErrors.roomName = 'Tempat / ruangan sesi wajib dipilih atau diisi.';
    }
    if (!scheduleValue.scheduledAt || !scheduleValue.scheduledEndAt) {
      newErrors.timeSlot = 'Jadwal tanggal dan jam sesi wajib dipilih.';
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

    const def = getDefaultSessionSchedule(scheduleValue.date);

    try {
      setSubmitting(true);
      setErrors({});
      await onSubmit({
        classId: chosenClass.id,
        courseTitle: chosenClass.courseTitle,
        classGroup: chosenClass.classGroup,
        roomName: sessionType === 'ONLINE' ? 'Online' : roomName.trim(),
        sessionType,
        moduleName: moduleName.trim(),
        timeSlot: scheduleValue.timeSlot || def.timeSlot,
        scheduledAt: scheduleValue.scheduledAt || def.scheduledAt,
        scheduledEndAt: scheduleValue.scheduledEndAt || def.scheduledEndAt,
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
        Pilih kelas, tempat pelaksanaan (Lab B/C/D/AP, Online, atau Lainnya), serta jadwal via DateTimePicker.
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
                  onPress={() => handleSelectClass(c)}
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

      {/* Tempat Pelaksanaan (Lab B/C/D/AP, Online, Lainnya) */}
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Tempat Pelaksanaan *</Text>
        <RoomPlaceSelector
          value={roomName}
          onChange={(nextRoom, nextType) => {
            setRoomName(nextRoom);
            setSessionType(nextType);
            if (errors.roomName) setErrors((prev) => ({ ...prev, roomName: undefined }));
          }}
          disabled={submitting}
          error={errors.roomName}
        />
      </View>

      {/* Waktu Pelaksanaan (DateTimePicker) */}
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Jadwal / Waktu Pelaksanaan *</Text>
        <TimeSlotPicker
          value={scheduleValue}
          onChange={(val) => {
            setScheduleValue(val);
            if (errors.timeSlot) setErrors((prev) => ({ ...prev, timeSlot: undefined }));
          }}
          disabled={submitting}
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
    maxHeight: '92%',
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
    marginBottom: 16,
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
    maxHeight: 150,
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
    marginTop: 14,
    marginBottom: 14,
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
