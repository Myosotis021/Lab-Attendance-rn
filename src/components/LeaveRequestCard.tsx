import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LeaveRequest } from '../types/models';
import LeaveStatusBadge from './LeaveStatusBadge';
import SentimentBadge from './SentimentBadge';

interface LeaveRequestCardProps {
  item: LeaveRequest;
  showStudentInfo?: boolean;
  actions?: React.ReactNode;
}

export const LeaveRequestCard: React.FC<LeaveRequestCardProps> = ({
  item,
  showStudentInfo = false,
  actions,
}) => {
  const formatTime = (ts: any): string => {
    if (!ts) return '-';
    try {
      const date = ts.toDate ? ts.toDate() : (ts.seconds ? new Date(ts.seconds * 1000) : new Date(ts));
      return date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '-';
    }
  };

  const isDecided = item.status === 'DITERIMA' || item.status === 'DITOLAK';

  return (
    <View style={styles.card}>
      {/* Top row: Course title + Status badge */}
      <View style={styles.topRow}>
        <View style={styles.titleContainer}>
          <Text style={styles.courseTitle} numberOfLines={1}>
            {item.courseTitle}
          </Text>
          <Text style={styles.moduleName} numberOfLines={1}>
            {item.moduleName}
          </Text>
        </View>
        <LeaveStatusBadge status={item.status} />
      </View>

      {/* Student info (for assistant review) */}
      {showStudentInfo && (
        <View style={styles.studentInfoBox}>
          <Text style={styles.studentName}>{item.studentName}</Text>
          <Text style={styles.studentNim}>NIM: {item.studentNim || '-'}</Text>
        </View>
      )}

      {/* Reason text */}
      <View style={styles.reasonBox}>
        <Text style={styles.reasonLabel}>Alasan Ketidakhadiran:</Text>
        <Text style={styles.reasonText}>{item.reason}</Text>
      </View>

      {/* Assistant decision note & time (if decided) */}
      {isDecided && (
        <View style={styles.decisionBox}>
          <Text style={styles.decisionLabel}>
            Keputusan Asisten ({item.status === 'DITERIMA' ? 'Disetujui' : 'Ditolak'}):
          </Text>
          {item.assistantNote ? (
            <Text style={styles.assistantNote}>&ldquo;{item.assistantNote}&rdquo;</Text>
          ) : (
            <Text style={styles.assistantNoteNone}>Tidak ada catatan tambahan</Text>
          )}
          {item.decidedAt && (
            <Text style={styles.decidedTime}>
              Waktu keputusan: {formatTime(item.decidedAt)}
            </Text>
          )}
        </View>
      )}

      {/* Bottom row: Sentiment badge and submission time */}
      <View style={styles.bottomRow}>
        <SentimentBadge sentiment={item.sentiment} />
        <Text style={styles.timeText}>{formatTime(item.createdAt)}</Text>
      </View>

      {/* Optional action buttons (Accept / Reject) */}
      {actions && <View style={styles.actionsContainer}>{actions}</View>}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  titleContainer: {
    flex: 1,
    marginRight: 8,
  },
  courseTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  moduleName: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  studentInfoBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 8,
    marginVertical: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#3B82F6',
  },
  studentName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  studentNim: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },
  reasonBox: {
    marginVertical: 8,
  },
  reasonLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
    marginBottom: 4,
  },
  reasonText: {
    fontSize: 14,
    color: '#1F2937',
    lineHeight: 20,
    backgroundColor: '#F9FAFB',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  decisionBox: {
    backgroundColor: '#F0FDF4',
    padding: 10,
    borderRadius: 8,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  decisionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#166534',
    marginBottom: 2,
  },
  assistantNote: {
    fontSize: 13,
    fontStyle: 'italic',
    color: '#15803D',
  },
  assistantNoteNone: {
    fontSize: 12,
    color: '#86EFAC',
    fontStyle: 'italic',
  },
  decidedTime: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 4,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  timeText: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  actionsContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
});

export default LeaveRequestCard;
