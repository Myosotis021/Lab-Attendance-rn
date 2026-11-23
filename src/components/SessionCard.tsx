import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { RoleType, SessionItem, SessionStatus } from '../types';
import { getSessionStatusLabel } from '../utils/labelUtils';
import { theme } from '../theme';

interface SessionCardProps {
  session: SessionItem;
  currentRole: RoleType;
  onSelectSession?: (session: SessionItem, currentRole: RoleType) => void;
}

interface StatusBadgeConfig {
  label: string;
  backgroundColor: string;
  textColor: string;
  borderColor: string;
}

const STATUS_CONFIG: Record<SessionStatus, StatusBadgeConfig> = {
  BELUM_DIBUKA: {
    label: getSessionStatusLabel('BELUM_DIBUKA'),
    backgroundColor: theme.colors.status.belumDibuka.bg,
    textColor: theme.colors.status.belumDibuka.text,
    borderColor: theme.colors.status.belumDibuka.border,
  },
  BERJALAN: {
    label: getSessionStatusLabel('BERJALAN'),
    backgroundColor: theme.colors.status.berjalan.bg,
    textColor: theme.colors.status.berjalan.text,
    borderColor: theme.colors.status.berjalan.border,
  },
  SELESAI: {
    label: getSessionStatusLabel('SELESAI'),
    backgroundColor: theme.colors.status.selesai.bg,
    textColor: theme.colors.status.selesai.text,
    borderColor: theme.colors.status.selesai.border,
  },
};

export const SessionCard: React.FC<SessionCardProps> = ({
  session,
  currentRole,
  onSelectSession,
}) => {
  const statusConfig = STATUS_CONFIG[session.status] || STATUS_CONFIG.BELUM_DIBUKA;
  const isBerjalan = session.status === 'BERJALAN';

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.88}
      onPress={() => onSelectSession?.(session, currentRole)}
    >
      {/* Category Tag & Status Badge */}
      <View style={styles.topRow}>
        <View
          style={[
            styles.categoryTag,
            isBerjalan ? styles.categoryTagOngoing : styles.categoryTagDefault,
          ]}
        >
          <Text
            style={[
              styles.categoryTagText,
              isBerjalan ? styles.categoryTagTextOngoing : styles.categoryTagTextDefault,
            ]}
          >
            PRAKTIKUM
          </Text>
        </View>

        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor: statusConfig.backgroundColor,
              borderColor: statusConfig.borderColor,
            },
          ]}
        >
          <Text style={[styles.statusBadgeText, { color: statusConfig.textColor }]}>
            {statusConfig.label}
          </Text>
        </View>
      </View>

      {/* Large Bold Time Slot */}
      <Text style={styles.timeSlotText}>{session.timeSlot}</Text>

      {/* Course Title & Module */}
      <Text style={styles.courseTitle} numberOfLines={2}>
        {session.courseTitle}
      </Text>
      <Text style={styles.moduleName} numberOfLines={1}>
        {session.moduleName}
      </Text>

      {/* Bullet Info Items */}
      <View style={styles.bulletList}>
        <View style={styles.bulletItem}>
          <Text style={styles.bulletDot}>•</Text>
          <Text style={styles.bulletText}>
            Kelas: <Text style={styles.bulletBold}>{session.classGroup}</Text>
          </Text>
        </View>
        <View style={styles.bulletItem}>
          <Text style={styles.bulletDot}>•</Text>
          <Text style={styles.bulletText}>
            Ruangan: <Text style={styles.bulletBold}>{session.roomName}</Text>
          </Text>
        </View>
      </View>

      {/* Bottom Action Row */}
      <View style={styles.bottomRow}>
        <Text style={styles.actionPromptText}>Buka Detail Sesi</Text>
        <View style={styles.arrowCircle}>
          <Feather name="arrow-right" size={16} color="#FFFFFF" />
        </View>
      </View>
    </TouchableOpacity>
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
    alignItems: 'center',
    marginBottom: 10,
  },
  categoryTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  categoryTagDefault: {
    backgroundColor: '#EFF6FF',
  },
  categoryTagOngoing: {
    backgroundColor: '#FEF2F2',
  },
  categoryTagText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  categoryTagTextDefault: {
    color: '#2563EB',
  },
  categoryTagTextOngoing: {
    color: '#EF4444',
  },
  statusBadge: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  timeSlotText: {
    fontSize: 20,
    fontWeight: '800',
    color: theme.colors.textPrimary,
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  courseTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    lineHeight: 20,
  },
  moduleName: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginTop: 2,
    marginBottom: 10,
  },
  bulletList: {
    backgroundColor: theme.colors.surfaceSubtle,
    padding: 10,
    borderRadius: theme.borderRadius.md,
    gap: 4,
    marginBottom: 12,
  },
  bulletItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bulletDot: {
    fontSize: 14,
    color: theme.colors.textMuted,
    marginRight: 6,
  },
  bulletText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  bulletBold: {
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderColor: theme.colors.borderLight,
  },
  actionPromptText: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  arrowCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.textPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default SessionCard;
