import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import { AttendanceRecord, AttendanceStatus } from '../types';

interface AttendanceFeedbackModalProps {
  visible: boolean;
  attendanceData: AttendanceRecord | null;
  onClose: () => void;
}

const getStatusBadgeStyle = (status: AttendanceStatus) => {
  switch (status) {
    case 'Hadir':
      return {
        bg: '#DCFCE7',
        text: '#15803D',
        border: '#86EFAC',
        label: 'HADIR',
      };
    case 'Izin':
      return {
        bg: '#FEF3C7',
        text: '#B45309',
        border: '#FCD34D',
        label: 'IZIN',
      };
    case 'Sakit':
      return {
        bg: '#DBEAFE',
        text: '#1D4ED8',
        border: '#93C5FD',
        label: 'SAKIT',
      };
    default:
      return {
        bg: '#F3F4F6',
        text: '#4B5563',
        border: '#E5E7EB',
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
          {/* Big Green Success Checkmark Icon */}
          <View style={styles.iconContainer}>
            <View style={styles.iconInner}>
              <Text style={styles.checkmarkIcon}>✓</Text>
            </View>
          </View>

          {/* Title & Subtitle */}
          <Text style={styles.title}>Presensi Berhasil Dicatat!</Text>
          <Text style={styles.subtitle}>
            Data kehadiran Anda telah berhasil direkam oleh sistem secara real-time.
          </Text>

          {/* Summary Box */}
          <View style={styles.summaryContainer}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Nama Praktikan</Text>
              <Text style={styles.summaryValue}>{attendanceData.studentName}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>NIM Mahasiswa</Text>
              <Text style={styles.summaryValueBold}>{attendanceData.studentNim}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Waktu Presensi</Text>
              <Text style={styles.summaryValueHighlight}>{attendanceData.timestamp}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Status Kehadiran</Text>
              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor: badgeStyle.bg,
                    borderColor: badgeStyle.border,
                  },
                ]}
              >
                <Text style={[styles.statusBadgeText, { color: badgeStyle.text }]}>
                  {badgeStyle.label}
                </Text>
              </View>
            </View>

            {attendanceData.notes ? (
              <>
                <View style={styles.divider} />
                <View style={styles.summaryRowNotes}>
                  <Text style={styles.summaryLabel}>Catatan Tambahan</Text>
                  <Text style={styles.notesText}>{attendanceData.notes}</Text>
                </View>
              </>
            ) : null}
          </View>

          {/* Close Action Button */}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            activeOpacity={0.85}
          >
            <Text style={styles.closeButtonText}>Selesai / Tutup</Text>
          </TouchableOpacity>
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
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  iconContainer: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#DCFCE7',
    borderWidth: 4,
    borderColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#16A34A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkIcon: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '900',
    lineHeight: 36,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  summaryContainer: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  summaryRowNotes: {
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 13,
    color: '#1E293B',
    fontWeight: '600',
  },
  summaryValueBold: {
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  summaryValueHighlight: {
    fontSize: 13,
    color: '#0369A1',
    fontWeight: '700',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  notesText: {
    fontSize: 13,
    color: '#334155',
    fontStyle: 'italic',
    marginTop: 4,
    backgroundColor: '#FFFFFF',
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  closeButton: {
    width: '100%',
    backgroundColor: '#16A34A',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});

export default AttendanceFeedbackModal;
