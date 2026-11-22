import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import {
  formatJakartaTime,
  buildTimestamp,
} from '../utils/timeUtils';

export interface TimeSlotPickerValue {
  date: Date;
  startTime: string; // "HH:MM"
  endTime: string; // "HH:MM"
}

export interface TimeSlotPickerProps {
  value: TimeSlotPickerValue | null;
  onChange: (value: TimeSlotPickerValue) => void;
  disabled?: boolean;
}

export const TimeSlotPicker: React.FC<TimeSlotPickerProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);

  // Default values
  const defaultDate = new Date();
  defaultDate.setHours(13, 0, 0, 0);

  const currentDate = value?.date || defaultDate;
  const currentStartTime = value?.startTime || '13:00';
  const currentEndTime = value?.endTime || '15:30';

  const [startTimeInput, setStartTimeInput] = useState<string>(currentStartTime);
  const [endTimeInput, setEndTimeInput] = useState<string>(currentEndTime);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleDateChange = (
    _event: DateTimePickerEvent,
    selectedDate?: Date
  ) => {
    setShowDatePicker(false);
    if (!selectedDate) return;

    // Validasi: tanggal tidak boleh di masa lalu (hanya bandingkan tanggal tanpa jam)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const chosen = new Date(selectedDate.getTime());
    chosen.setHours(0, 0, 0, 0);

    if (chosen < today) {
      setValidationError('Tanggal sesi tidak boleh di masa lalu.');
      return;
    }

    setValidationError(null);
    validateAndUpdate(selectedDate, startTimeInput, endTimeInput);
  };

  const validateTimeFormat = (timeStr: string): boolean => {
    const regex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    return regex.test(timeStr.trim());
  };

  const validateAndUpdate = (date: Date, start: string, end: string) => {
    if (!validateTimeFormat(start)) {
      setValidationError('Format jam mulai salah (harus HH:MM).');
      return;
    }
    if (!validateTimeFormat(end)) {
      setValidationError('Format jam selesai salah (harus HH:MM).');
      return;
    }

    const [startH, startM] = start.split(':').map((n) => parseInt(n, 10));
    const [endH, endM] = end.split(':').map((n) => parseInt(n, 10));
    const startTotalMins = startH * 60 + startM;
    const endTotalMins = endH * 60 + endM;

    // Validasi: Jam mulai < Jam selesai
    if (startTotalMins >= endTotalMins) {
      setValidationError('Jam mulai harus lebih awal dari jam selesai.');
      return;
    }

    // Durasi minimal 30 menit, maksimal 8 jam (480 menit)
    const durationMins = endTotalMins - startTotalMins;
    if (durationMins < 30) {
      setValidationError('Durasi praktikum minimal 30 menit.');
      return;
    }
    if (durationMins > 480) {
      setValidationError('Durasi praktikum maksimal 8 jam.');
      return;
    }

    setValidationError(null);
    onChange({
      date,
      startTime: start,
      endTime: end,
    });
  };

  // Preview formatting
  const startTs = buildTimestamp(currentDate, currentStartTime);
  const formattedDate = formatJakartaTime(startTs);
  const previewLabel = `${formattedDate.split(',')[0]}, ${currentDate.toLocaleDateString(
    'id-ID',
    { day: 'numeric', month: 'short', year: 'numeric' }
  )}, ${currentStartTime} – ${currentEndTime} WIB`;

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Jadwal Praktikum (WIB)</Text>

      {/* Date Picker Button */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Pilih Tanggal Sesi</Text>
        <TouchableOpacity
          style={[styles.dateButton, disabled && styles.disabled]}
          onPress={() => !disabled && setShowDatePicker(true)}
          disabled={disabled}
          activeOpacity={0.7}
        >
          <Text style={styles.dateIcon}>📅</Text>
          <Text style={styles.dateText}>
            {currentDate.toLocaleDateString('id-ID', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </Text>
        </TouchableOpacity>
      </View>

      {showDatePicker && (
        <DateTimePicker
          value={currentDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          minimumDate={new Date()}
          onChange={handleDateChange}
        />
      )}

      {/* Two columns for Start Time & End Time */}
      <View style={styles.timeRow}>
        <View style={styles.timeColumn}>
          <Text style={styles.label}>Jam Mulai (HH:MM)</Text>
          <TextInput
            style={[styles.input, disabled && styles.disabled]}
            value={startTimeInput}
            onChangeText={(text) => {
              setStartTimeInput(text);
              if (validateTimeFormat(text) && validateTimeFormat(endTimeInput)) {
                validateAndUpdate(currentDate, text, endTimeInput);
              }
            }}
            placeholder="13:00"
            placeholderTextColor="#9CA3AF"
            keyboardType="numbers-and-punctuation"
            maxLength={5}
            editable={!disabled}
          />
        </View>

        <View style={styles.timeDivider}>
          <Text style={styles.timeDividerText}>–</Text>
        </View>

        <View style={styles.timeColumn}>
          <Text style={styles.label}>Jam Selesai (HH:MM)</Text>
          <TextInput
            style={[styles.input, disabled && styles.disabled]}
            value={endTimeInput}
            onChangeText={(text) => {
              setEndTimeInput(text);
              if (validateTimeFormat(startTimeInput) && validateTimeFormat(text)) {
                validateAndUpdate(currentDate, startTimeInput, text);
              }
            }}
            placeholder="15:30"
            placeholderTextColor="#9CA3AF"
            keyboardType="numbers-and-punctuation"
            maxLength={5}
            editable={!disabled}
          />
        </View>
      </View>

      {/* Validation Error */}
      {validationError ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>⚠️ {validationError}</Text>
        </View>
      ) : null}

      {/* Preview Card */}
      <View style={styles.previewBox}>
        <Text style={styles.previewLabel}>Preview Jadwal Terstruktur:</Text>
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
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginVertical: 8,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  inputGroup: {
    marginBottom: 12,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
    marginBottom: 6,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#F9FAFB',
  },
  dateIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  dateText: {
    fontSize: 13,
    color: '#1F2937',
    fontWeight: '500',
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
    paddingTop: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeDividerText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#9CA3AF',
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: '#111827',
    backgroundColor: '#FFFFFF',
    textAlign: 'center',
    fontWeight: '600',
  },
  disabled: {
    backgroundColor: '#F3F4F6',
    color: '#9CA3AF',
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
    marginTop: 4,
  },
  previewLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#166534',
    marginBottom: 2,
  },
  previewValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#15803D',
  },
});
