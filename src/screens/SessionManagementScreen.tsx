import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import TimeSlotPicker, { TimeSlotPickerValue } from '../components/TimeSlotPicker';
import { createSession, rescheduleSession } from '../services/sessionService';
import { buildTimestamp, formatJakartaTime } from '../utils/timeUtils';
import { SessionStatus } from '../types/models';

export const SessionManagementScreen: React.FC = () => {
  const router = useRouter();

  const [courseTitle, setCourseTitle] = useState<string>('');
  const [moduleName, setModuleName] = useState<string>('');
  const [classGroup, setClassGroup] = useState<string>('Kelas A');
  const [roomName, setRoomName] = useState<string>('Lab Komputer 1');
  const [timeSlotData, setTimeSlotData] = useState<TimeSlotPickerValue | null>(null);

  const [submitting, setSubmitting] = useState<boolean>(false);

  const handleCreateSession = async () => {
    if (!courseTitle.trim()) {
      Alert.alert('Validasi', 'Nama mata kuliah wajib diisi.');
      return;
    }
    if (!moduleName.trim()) {
      Alert.alert('Validasi', 'Nama modul praktikum wajib diisi.');
      return;
    }
    if (!timeSlotData) {
      Alert.alert('Validasi', 'Silakan tentukan tanggal dan jam sesi.');
      return;
    }

    setSubmitting(true);
    try {
      const scheduledAt = buildTimestamp(timeSlotData.date, timeSlotData.startTime);
      const scheduledEndAt = buildTimestamp(timeSlotData.date, timeSlotData.endTime);
      const dayName = formatJakartaTime(scheduledAt).split(',')[0];
      const timeSlotLabel = `${dayName}, ${timeSlotData.startTime} - ${timeSlotData.endTime} WIB`;

      await createSession({
        courseTitle: courseTitle.trim(),
        moduleName: moduleName.trim(),
        classGroup,
        roomName,
        timeSlot: timeSlotLabel,
        scheduledAt,
        scheduledEndAt,
        status: 'BELUM_DIBUKA' as SessionStatus,
        participantIds: [],
      });

      Alert.alert('Sukses', 'Sesi praktikum berhasil dibuat!', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (err: any) {
      Alert.alert('Gagal Membuat Sesi', err?.message || 'Terjadi kesalahan.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Text style={styles.backButtonText}>← Kembali</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Kelola Sesi Praktikum</Text>
        <View style={styles.spacer} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.formCard}>
          <Text style={styles.sectionHeading}>Informasi Praktikum</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nama Mata Kuliah</Text>
            <TextInput
              style={styles.input}
              placeholder="Contoh: Pemrograman Perangkat Komputasi"
              value={courseTitle}
              onChangeText={setCourseTitle}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nama Modul</Text>
            <TextInput
              style={styles.input}
              placeholder="Contoh: Modul 1: Antarmuka & Alur"
              value={moduleName}
              onChangeText={setModuleName}
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.flexOne]}>
              <Text style={styles.label}>Kelas</Text>
              <TextInput
                style={styles.input}
                placeholder="Kelas A"
                value={classGroup}
                onChangeText={setClassGroup}
              />
            </View>
            <View style={{ width: 12 }} />
            <View style={[styles.inputGroup, styles.flexOne]}>
              <Text style={styles.label}>Ruang Lab</Text>
              <TextInput
                style={styles.input}
                placeholder="Lab Komputer 1"
                value={roomName}
                onChangeText={setRoomName}
              />
            </View>
          </View>

          {/* TimeSlotPicker Component */}
          <TimeSlotPicker
            value={timeSlotData}
            onChange={(val) => setTimeSlotData(val)}
          />

          <TouchableOpacity
            style={[styles.submitButton, submitting && styles.btnDisabled]}
            onPress={handleCreateSession}
            disabled={submitting}
            activeOpacity={0.8}
          >
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitButtonText}>💾 Simpan Sesi Baru</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default SessionManagementScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  backButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  spacer: {
    width: 65,
  },
  scrollContent: {
    padding: 16,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 14,
  },
  inputGroup: {
    marginBottom: 12,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4B5563',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111827',
    backgroundColor: '#FFFFFF',
  },
  row: {
    flexDirection: 'row',
  },
  flexOne: {
    flex: 1,
  },
  submitButton: {
    backgroundColor: '#2563EB',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  btnDisabled: {
    backgroundColor: '#93C5FD',
  },
});
