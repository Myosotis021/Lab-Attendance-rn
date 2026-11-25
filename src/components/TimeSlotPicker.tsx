import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { Timestamp } from 'firebase/firestore';
import {
  formatSessionScheduleLabel,
  getDefaultSessionSchedule,
} from '../utils/timeUtils';

export interface TimeSlotPickerValue {
  date: Date;
  startTime: string; // "HH:MM"
  endTime: string;   // "HH:MM"
  scheduledAt?: Timestamp;
  scheduledEndAt?: Timestamp;
  timeSlot?: string;
}

export interface TimeSlotPickerProps {
  value: TimeSlotPickerValue | null;
  onChange: (value: TimeSlotPickerValue) => void;
  disabled?: boolean;
}

type ActivePicker = 'date' | 'start' | 'end' | null;

const formatTimeHHMM = (d: Date): string => {
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
};

const parseHHMMOnDate = (baseDate: Date, hhmm: string): Date => {
  const [hStr, mStr] = hhmm.split(':');
  const h = parseInt(hStr || '8', 10);
  const m = parseInt(mStr || '0', 10);
  return new Date(
    baseDate.getFullYear(),
    baseDate.getMonth(),
    baseDate.getDate(),
    isNaN(h) ? 8 : h,
    isNaN(m) ? 0 : m,
    0,
    0
  );
};

export const TimeSlotPicker: React.FC<TimeSlotPickerProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  const [activePicker, setActivePicker] = useState<ActivePicker>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const def = getDefaultSessionSchedule();
  const currentDate = value?.date || def.startDate;
  const currentStartTime = value?.startTime || formatTimeHHMM(def.startDate);
  const currentEndTime = value?.endTime || formatTimeHHMM(def.endDate);

  const startDateObj = parseHHMMOnDate(currentDate, currentStartTime);
  const endDateObj = parseHHMMOnDate(currentDate, currentEndTime);

  const commitChange = (nextDate: Date, nextStartStr: string, nextEndStr: string) => {
    const startObj = parseHHMMOnDate(nextDate, nextStartStr);
    const endObj = parseHHMMOnDate(nextDate, nextEndStr);

    const startTotalMins = startObj.getHours() * 60 + startObj.getMinutes();
    const endTotalMins = endObj.getHours() * 60 + endObj.getMinutes();

    if (startTotalMins >= endTotalMins) {
      setValidationError('Jam mulai harus lebih awal dari jam selesai.');
      return;
    }

    const durationMins = endTotalMins - startTotalMins;
    if (durationMins < 15) {
      setValidationError('Durasi praktikum minimal 15 menit.');
      return;
    }
    if (durationMins > 480) {
      setValidationError('Durasi praktikum maksimal 8 jam.');
      return;
    }

    setValidationError(null);
    onChange({
      date: nextDate,
      startTime: nextStartStr,
      endTime: nextEndStr,
      scheduledAt: Timestamp.fromDate(startObj),
      scheduledEndAt: Timestamp.fromDate(endObj),
      timeSlot: formatSessionScheduleLabel(startObj, endObj),
    });
  };

  const handleDateChange = (
    event: DateTimePickerEvent,
    selectedDate?: Date
  ) => {
    if (Platform.OS !== 'ios') {
      setActivePicker(null);
    }
    if (event.type === 'dismissed' || !selectedDate) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const chosen = new Date(selectedDate.getTime());
    chosen.setHours(0, 0, 0, 0);

    if (chosen < today) {
      setValidationError('Tanggal sesi tidak boleh di masa lalu.');
      return;
    }

    commitChange(selectedDate, currentStartTime, currentEndTime);
  };

  const handleStartTimeChange = (
    event: DateTimePickerEvent,
    selectedTime?: Date
  ) => {
    if (Platform.OS !== 'ios') {
      setActivePicker(null);
    }
    if (event.type === 'dismissed' || !selectedTime) return;
    const nextStart = formatTimeHHMM(selectedTime);
    commitChange(currentDate, nextStart, currentEndTime);
  };

  const handleEndTimeChange = (
    event: DateTimePickerEvent,
    selectedTime?: Date
  ) => {
    if (Platform.OS !== 'ios') {
      setActivePicker(null);
    }
    if (event.type === 'dismissed' || !selectedTime) return;
    const nextEnd = formatTimeHHMM(selectedTime);
    commitChange(currentDate, currentStartTime, nextEnd);
  };

  const previewLabel = formatSessionScheduleLabel(startDateObj, endDateObj);

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Jadwal Praktikum (WIB)</Text>

      {/* Date Picker Button */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Tanggal Sesi</Text>
        <TouchableOpacity
          style={[styles.pickerButton, disabled && styles.disabled]}
          onPress={() =>
            !disabled &&
            setActivePicker(activePicker === 'date' ? null : 'date')
          }
          disabled={disabled}
          activeOpacity={0.7}
        >
          <Text style={styles.pickerIcon}>📅</Text>
          <Text style={styles.pickerText}>
            {currentDate.toLocaleDateString('id-ID', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </Text>
        </TouchableOpacity>
      </View>

      {activePicker === 'date' && (
        <View style={styles.nativePickerWrap}>
          <DateTimePicker
            value={currentDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            minimumDate={new Date()}
            onChange={handleDateChange}
          />
          {Platform.OS === 'ios' && (
            <TouchableOpacity
              style={styles.iosDoneBtn}
              onPress={() => setActivePicker(null)}
            >
              <Text style={styles.iosDoneText}>Selesai</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Time Picker Buttons (Start & End via DateTimePicker) */}
      <View style={styles.timeRow}>
        <View style={styles.timeColumn}>
          <Text style={styles.label}>Jam Mulai</Text>
          <TouchableOpacity
            style={[
              styles.timeButton,
              activePicker === 'start' && styles.timeButtonActive,
              disabled && styles.disabled,
            ]}
            onPress={() =>
              !disabled &&
              setActivePicker(activePicker === 'start' ? null : 'start')
            }
            disabled={disabled}
            activeOpacity={0.7}
          >
            <Text style={styles.timeIcon}>🕒</Text>
            <Text style={styles.timeValue}>{currentStartTime} WIB</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.timeDivider}>
          <Text style={styles.timeDividerText}>–</Text>
        </View>

        <View style={styles.timeColumn}>
          <Text style={styles.label}>Jam Selesai</Text>
          <TouchableOpacity
            style={[
              styles.timeButton,
              activePicker === 'end' && styles.timeButtonActive,
              disabled && styles.disabled,
            ]}
            onPress={() =>
              !disabled &&
              setActivePicker(activePicker === 'end' ? null : 'end')
            }
            disabled={disabled}
            activeOpacity={0.7}
          >
            <Text style={styles.timeIcon}>🕒</Text>
            <Text style={styles.timeValue}>{currentEndTime} WIB</Text>
          </TouchableOpacity>
        </View>
      </View>

      {activePicker === 'start' && (
        <View style={styles.nativePickerWrap}>
          <DateTimePicker
            value={startDateObj}
            mode="time"
            is24Hour
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleStartTimeChange}
          />
          {Platform.OS === 'ios' && (
            <TouchableOpacity
              style={styles.iosDoneBtn}
              onPress={() => setActivePicker(null)}
            >
              <Text style={styles.iosDoneText}>Selesai</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {activePicker === 'end' && (
        <View style={styles.nativePickerWrap}>
          <DateTimePicker
            value={endDateObj}
            mode="time"
            is24Hour
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleEndTimeChange}
          />
          {Platform.OS === 'ios' && (
            <TouchableOpacity
              style={styles.iosDoneBtn}
              onPress={() => setActivePicker(null)}
            >
              <Text style={styles.iosDoneText}>Selesai</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Validation Error */}
      {validationError ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>⚠️ {validationError}</Text>
        </View>
      ) : null}

      {/* Preview Card */}
      <View style={styles.previewBox}>
        <Text style={styles.previewLabel}>Jadwal Terpilih:</Text>
        <Text style={styles.previewValue}>{previewLabel}</Text>
      </View>
    </View>
  );
};

export default TimeSlotPicker;

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginVertical: 4,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 10,
  },
  inputGroup: {
    marginBottom: 10,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4B5563',
    marginBottom: 5,
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#F9FAFB',
  },
  pickerIcon: {
    fontSize: 15,
    marginRight: 8,
  },
  pickerText: {
    fontSize: 13,
    color: '#1F2937',
    fontWeight: '600',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  timeColumn: {
    flex: 1,
  },
  timeDivider: {
    paddingHorizontal: 8,
    paddingTop: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeDividerText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#9CA3AF',
  },
  timeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: '#F9FAFB',
  },
  timeButtonActive: {
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
  },
  timeIcon: {
    fontSize: 13,
  },
  timeValue: {
    fontSize: 13,
    color: '#111827',
    fontWeight: '700',
  },
  nativePickerWrap: {
    marginBottom: 8,
  },
  iosDoneBtn: {
    alignSelf: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#111827',
    borderRadius: 6,
    marginTop: 4,
  },
  iosDoneText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  disabled: {
    backgroundColor: '#F3F4F6',
    opacity: 0.7,
  },
  errorBox: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 12,
    color: '#DC2626',
    fontWeight: '500',
  },
  previewBox: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 8,
    padding: 10,
    marginTop: 2,
  },
  previewLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#166534',
    marginBottom: 2,
  },
  previewValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#15803D',
  },
});
