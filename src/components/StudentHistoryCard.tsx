import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { AttendanceRecord, AttendanceStatus } from '../types';

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
          <Text style={styles.badgeSuccessText}>✓ TERVERIFIKASI</Text>
        </View>
        <Text style={styles.lockBadgeText}>🔒 Terkunci (Anti-Double Submit)</Text>
      </View>

      <Text style={styles.cardTitle}>Bukti Kehadiran Praktikan</Text>

      {/* Main Status Sentence according to SRS: "Anda telah berhasil presensi pada [Jam:Menit:Detik WIB] - Status: [Hadir]" */}
      <View style={styles.statusCallout}>
        <Text style={styles.calloutText}>
          Anda telah berhasil presensi pada{' '}
          <Text style={styles.calloutBold}>{attendance.timestamp}</Text> - Status:{' '}
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
          <Text style={styles.detailLabel}>Nama Mahasiswa</Text>
          <Text style={styles.detailValue}>{attendance.studentName}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>NIM</Text>
          <Text style={styles.detailValueMonospace}>{attendance.studentNim}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Waktu Masuk</Text>
          <Text style={styles.detailValueHighlight}>{attendance.timestamp}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Status</Text>
          <View
            style={[
              styles.statusPill,
              {
                backgroundColor: badgeStyle.bg,
                borderColor: badgeStyle.border,
              },
            ]}
          >
            <Text style={[styles.statusPillText, { color: badgeStyle.text }]}>
              {badgeStyle.label}
            </Text>
          </View>
        </View>

        {attendance.notes ? (
          <>
            <View style={styles.divider} />
            <View style={styles.notesRow}>
              <Text style={styles.detailLabel}>Catatan / Nomor Meja</Text>
              <Text style={styles.notesContent}>{attendance.notes}</Text>
            </View>
          </>
        ) : null}
      </View>

      {/* Info notice about anti double submission */}
      <View style={styles.noticeBox}>
        <Text style={styles.noticeText}>
          ℹ️ Form pengisian presensi telah dikunci otomatis. Mahasiswa tidak dapat
          melakukan pengisian ganda pada sesi yang sama.
        </Text>
      </View>

      {/* Action buttons (Feedback modal trigger & demo helper) */}
      <View style={styles.actionRow}>
        {onViewFeedback ? (
          <TouchableOpacity
            style={styles.btnViewFeedback}
            onPress={onViewFeedback}
            activeOpacity={0.8}
          >
            <Text style={styles.btnViewFeedbackText}>Lihat Kartu Feedback</Text>
          </TouchableOpacity>
        ) : null}

        {onResetForDemo ? (
          <TouchableOpacity
            style={styles.btnResetDemo}
            onPress={onResetForDemo}
            activeOpacity={0.8}
          >
            <Text style={styles.btnResetDemoText}>🔄 Reset Presensi (Demo)</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  headerBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  badgeSuccess: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  badgeSuccessText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#15803D',
    letterSpacing: 0.3,
  },
  lockBadgeText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 10,
  },
  statusCallout: {
    backgroundColor: '#F0FDF4',
    borderLeftWidth: 4,
    borderLeftColor: '#16A34A',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  calloutText: {
    fontSize: 13,
    color: '#166534',
    lineHeight: 19,
  },
  calloutBold: {
    fontWeight: '700',
  },
  detailsContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  notesRow: {
    paddingVertical: 8,
  },
  detailLabel: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 13,
    color: '#1E293B',
    fontWeight: '600',
  },
  detailValueMonospace: {
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  detailValueHighlight: {
    fontSize: 13,
    color: '#0369A1',
    fontWeight: '700',
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  notesContent: {
    fontSize: 13,
    color: '#334155',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 6,
    padding: 8,
    marginTop: 6,
    fontStyle: 'italic',
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  noticeBox: {
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    marginBottom: 14,
  },
  noticeText: {
    fontSize: 12,
    color: '#1E40AF',
    lineHeight: 17,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  btnViewFeedback: {
    flex: 1,
    minWidth: 140,
    backgroundColor: '#0284C7',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnViewFeedbackText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  btnResetDemo: {
    flex: 1,
    minWidth: 140,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnResetDemoText: {
    color: '#4B5563',
    fontSize: 13,
    fontWeight: '600',
  },
});

export default StudentHistoryCard;
