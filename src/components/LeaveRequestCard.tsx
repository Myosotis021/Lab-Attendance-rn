import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LeaveRequest } from '../types/models';
import LeaveStatusBadge from './LeaveStatusBadge';
import SentimentBadge from './SentimentBadge';
import { theme } from '../theme';

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
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl,
    padding: 18,
    marginBottom: 14,
    ...theme.shadows.card,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  titleContainer: {
    flex: 1,
    marginRight: 8,
  },
  courseTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.colors.textPrimary,
  },
  moduleName: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  studentInfoBox: {
    backgroundColor: theme.colors.surfaceSubtle,
    borderRadius: theme.borderRadius.md,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
  },
  studentName: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  studentNim: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  reasonBox: {
    backgroundColor: theme.colors.surfaceSubtle,
    borderRadius: theme.borderRadius.md,
    padding: 12,
    marginBottom: 10,
  },
  reasonLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  reasonText: {
    fontSize: 13,
    color: theme.colors.textPrimary,
    lineHeight: 18,
  },
  decisionBox: {
    backgroundColor: '#FEF3C7',
    borderRadius: theme.borderRadius.md,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  decisionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#92400E',
    marginBottom: 4,
  },
  assistantNote: {
    fontSize: 13,
    fontStyle: 'italic',
    color: '#78350F',
    lineHeight: 18,
  },
  assistantNoteNone: {
    fontSize: 12,
    color: '#B45309',
  },
  decidedTime: {
    fontSize: 11,
    color: '#92400E',
    marginTop: 6,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderColor: theme.colors.borderLight,
  },
  timeText: {
    fontSize: 11,
    color: theme.colors.textMuted,
    fontWeight: '500',
  },
  actionsContainer: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderColor: theme.colors.borderLight,
  },
});

export default LeaveRequestCard;
