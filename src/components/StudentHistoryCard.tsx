import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { AttendanceRecord, AttendanceStatus } from '../types';
import { formatAttendanceTime } from '../services/attendanceService';
import { formatJakartaTime } from '../utils/timeUtils';
import { theme } from '../theme';

interface StudentHistoryCardProps {
  attendance: AttendanceRecord;
  sessionTitle?: string;
  onViewFeedback?: () => void;
  onResetForDemo?: () => void;
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

export const StudentHistoryCard: React.FC<StudentHistoryCardProps> = ({
  attendance,
  sessionTitle,
  onViewFeedback,
  onResetForDemo,
}) => {
  const badgeStyle = getStatusBadgeStyle(attendance.status);

  return (
    <View style={styles.card}>
      {/* Header Banner */}
      <View style={styles.headerBanner}>
        <View style={styles.badgeSuccess}>
          <Feather name="check" size={13} color="#166534" />
          <Text style={styles.badgeSuccessText}>TERVERIFIKASI</Text>
        </View>
        <View style={styles.lockedRow}>
          <Feather name="lock" size={12} color={theme.colors.textMuted} />
          <Text style={styles.lockBadgeText}>Terkunci (Anti-Double Submit)</Text>
        </View>
      </View>

      <Text style={styles.cardTitle}>Bukti Kehadiran Praktikan</Text>

      {/* Main Status Sentence */}
      <View style={styles.statusCallout}>
        <Text style={styles.calloutText}>
          Anda telah berhasil presensi pada{' '}
          <Text style={styles.calloutBold}>
            {attendance.timestamp
              ? formatJakartaTime(attendance.timestamp)
              : formatAttendanceTime(attendance.createdAt)}
          </Text>{' '}
          - Status:{' '}
          <Text style={[styles.calloutBold, { color: badgeStyle.text }]}>
            [{attendance.status}]
          </Text>
        </Text>
      </View>

      {/* Detail Table */}
      <View style={styles.detailsContainer}>
        {sessionTitle ? (
          <>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Sesi Praktikum</Text>
              <Text style={styles.detailValue} numberOfLines={1}>
                {sessionTitle}
              </Text>
            </View>
            <View style={styles.divider} />
          </>
        ) : null}

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Mahasiswa</Text>
          <Text style={styles.detailValue}>{attendance.studentName}</Text>
        </View>
        <View style={styles.divider} />

        {attendance.studentNim ? (
          <>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>NIM</Text>
              <Text style={styles.detailValue}>{attendance.studentNim}</Text>
            </View>
            <View style={styles.divider} />
          </>
        ) : null}

        {attendance.notes ? (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Nomor Meja Lab</Text>
            <Text style={styles.detailValue}>{attendance.notes}</Text>
          </View>
        ) : null}
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        {onViewFeedback ? (
          <TouchableOpacity
            style={styles.feedbackButton}
            onPress={onViewFeedback}
            activeOpacity={0.8}
          >
            <Feather name="file-text" size={15} color="#FFFFFF" style={styles.btnIcon} />
            <Text style={styles.feedbackButtonText}>Lihat Bukti Presensi</Text>
          </TouchableOpacity>
        ) : null}

        {onResetForDemo ? (
          <TouchableOpacity
            style={styles.resetButton}
            onPress={onResetForDemo}
            activeOpacity={0.8}
          >
            <Feather name="refresh-cw" size={14} color={theme.colors.textSecondary} style={styles.btnIcon} />
            <Text style={styles.resetButtonText}>Reset Presensi (Demo)</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl,
    padding: 20,
    ...theme.shadows.card,
  },
  headerBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  badgeSuccess: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: theme.colors.status.hadir.bg,
    borderColor: theme.colors.status.hadir.border,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.full,
  },
  badgeSuccessText: {
    color: theme.colors.status.hadir.text,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  lockedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  lockBadgeText: {
    color: theme.colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.textPrimary,
    marginBottom: 10,
  },
  statusCallout: {
    backgroundColor: theme.colors.surfaceSubtle,
    borderRadius: theme.borderRadius.md,
    padding: 12,
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
  detailsContainer: {
    backgroundColor: theme.colors.surfaceSubtle,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  detailLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    maxWidth: '60%',
    textAlign: 'right',
  },
  detailValueMono: {
    fontSize: 11,
    color: theme.colors.textMuted,
    fontFamily: 'monospace',
    maxWidth: '55%',
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.borderLight,
  },
  buttonContainer: {
    gap: 8,
  },
  feedbackButton: {
    backgroundColor: theme.colors.textPrimary,
    borderRadius: theme.borderRadius.md,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  feedbackButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  resetButton: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    paddingVertical: 11,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetButtonText: {
    color: theme.colors.textSecondary,
    fontWeight: '700',
    fontSize: 13,
  },
  btnIcon: {
    marginRight: 6,
  },
});

export default StudentHistoryCard;
