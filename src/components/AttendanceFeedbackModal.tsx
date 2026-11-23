import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { AttendanceRecord, AttendanceStatus } from '../types';
import { formatAttendanceTime } from '../services/attendanceService';
import { theme } from '../theme';

interface AttendanceFeedbackModalProps {
  visible: boolean;
  attendanceData: AttendanceRecord | null;
  onClose: () => void;
}

const getStatusBadgeStyle = (status: AttendanceStatus) => {
  switch (status) {
    case 'Hadir':
      return {
        bg: theme.colors.status.hadir.bg,
        text: theme.colors.status.hadir.text,
        border: theme.colors.status.hadir.border,
        label: 'HADIR',
      };
    case 'Izin':
      return {
        bg: theme.colors.status.izin.bg,
        text: theme.colors.status.izin.text,
        border: theme.colors.status.izin.border,
        label: 'IZIN',
      };
    case 'Sakit':
      return {
        bg: theme.colors.status.sakit.bg,
        text: theme.colors.status.sakit.text,
        border: theme.colors.status.sakit.border,
        label: 'SAKIT',
      };
    default:
      return {
        bg: theme.colors.surfaceSubtle,
        text: theme.colors.textSecondary,
        border: theme.colors.border,
        label: status,
      };
  }
};

export const AttendanceFeedbackModal: React.FC<AttendanceFeedbackModalProps> = ({
  visible,
  attendanceData,
  onClose,
}) => {
  if (!attendanceData) return null;

  const badgeStyle = getStatusBadgeStyle(attendanceData.status);

  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        {/* Inner container to prevent touches inside the card from closing modal */}
        <Pressable
          style={styles.modalCard}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Success Checkmark Icon */}
          <View style={styles.iconContainer}>
            <View style={styles.iconInner}>
              <Feather name="check" size={28} color="#FFFFFF" />
            </View>
          </View>

          {/* Heading */}
          <Text style={styles.modalTitle}>Presensi Berhasil Dicatat!</Text>
          <Text style={styles.modalSubtitle}>
            Data kehadiran Anda telah tersimpan secara real-time di sistem laboratorium.
          </Text>

          {/* SRS Sentence Callout */}
          <View style={styles.statusCallout}>
            <Text style={styles.calloutText}>
              Anda telah berhasil presensi pada{' '}
              <Text style={styles.calloutBold}>
                {attendanceData.timestamp ||
                  formatAttendanceTime(attendanceData.createdAt)}
              </Text>{' '}
              - Status:{' '}
              <Text style={[styles.calloutBold, { color: badgeStyle.text }]}>
                [{attendanceData.status}]
              </Text>
            </Text>
          </View>

          {/* Details Table */}
          <View style={styles.tableContainer}>
            <View style={styles.tableRow}>
              <Text style={styles.rowLabel}>Waktu Presensi</Text>
              <Text style={styles.rowValue}>
                {attendanceData.timestamp ||
                  formatAttendanceTime(attendanceData.createdAt)}
              </Text>
            </View>
            <View style={styles.divider} />

            <View style={styles.tableRow}>
              <Text style={styles.rowLabel}>Nama Mahasiswa</Text>
              <Text style={styles.rowValue}>{attendanceData.studentName}</Text>
            </View>
            <View style={styles.divider} />

            {attendanceData.studentNim ? (
              <>
                <View style={styles.tableRow}>
                  <Text style={styles.rowLabel}>NIM</Text>
                  <Text style={styles.rowValue}>{attendanceData.studentNim}</Text>
                </View>
                <View style={styles.divider} />
              </>
            ) : null}

            {attendanceData.notes ? (
              <View style={styles.tableRow}>
                <Text style={styles.rowLabel}>Nomor Meja Lab</Text>
                <Text style={styles.rowValue}>{attendanceData.notes}</Text>
              </View>
            ) : null}
          </View>

          {/* Close Button */}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            activeOpacity={0.85}
          >
            <Text style={styles.closeButtonText}>Tutup & Kembali</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xxl,
    padding: 24,
    width: '100%',
    maxWidth: 390,
    alignItems: 'center',
    ...theme.shadows.card,
  },
  iconContainer: {
    marginBottom: 16,
  },
  iconInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#166534',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: theme.colors.textPrimary,
    textAlign: 'center',
    marginBottom: 6,
  },
  modalSubtitle: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 18,
  },
  statusCallout: {
    backgroundColor: theme.colors.surfaceSubtle,
    borderRadius: theme.borderRadius.md,
    padding: 12,
    width: '100%',
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: '#166534',
  },
  calloutText: {
    fontSize: 13,
    color: theme.colors.textPrimary,
    lineHeight: 19,
  },
  calloutBold: {
    fontWeight: '700',
  },
  tableContainer: {
    backgroundColor: theme.colors.surfaceSubtle,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: 14,
    paddingVertical: 6,
    width: '100%',
    marginBottom: 20,
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  rowLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  rowValue: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    maxWidth: '55%',
    textAlign: 'right',
  },
  rowValueMono: {
    fontSize: 11,
    color: theme.colors.textMuted,
    fontFamily: 'monospace',
    maxWidth: '55%',
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.borderLight,
  },
  closeButton: {
    backgroundColor: theme.colors.textPrimary,
    borderRadius: theme.borderRadius.md,
    paddingVertical: 14,
    width: '100%',
    alignItems: 'center',
    ...theme.shadows.subtle,
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});

export default AttendanceFeedbackModal;
