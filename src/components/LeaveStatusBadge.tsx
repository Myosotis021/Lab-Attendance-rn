import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LeaveStatus } from '../types/models';
import { theme } from '../theme';

interface LeaveStatusBadgeProps {
  status: LeaveStatus;
}

export const LeaveStatusBadge: React.FC<LeaveStatusBadgeProps> = ({ status }) => {
  const getBadgeConfig = () => {
    switch (status) {
      case 'DITERIMA':
        return {
          containerStyle: styles.acceptedContainer,
          textStyle: styles.acceptedText,
          label: 'DITERIMA',
        };
      case 'DITOLAK':
        return {
          containerStyle: styles.rejectedContainer,
          textStyle: styles.rejectedText,
          label: 'DITOLAK',
        };
      case 'MENUNGGU':
      default:
        return {
          containerStyle: styles.pendingContainer,
          textStyle: styles.pendingText,
          label: 'MENUNGGU',
        };
    }
  };

  const config = getBadgeConfig();

  return (
    <View style={[styles.badge, config.containerStyle]}>
      <Text style={[styles.text, config.textStyle]}>{config.label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.full,
    alignSelf: 'flex-start',
    borderWidth: 1,
  },
  text: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  pendingContainer: {
    backgroundColor: theme.colors.status.pending.bg,
    borderColor: theme.colors.status.pending.border,
  },
  pendingText: {
    color: theme.colors.status.pending.text,
  },
  acceptedContainer: {
    backgroundColor: theme.colors.status.accepted.bg,
    borderColor: theme.colors.status.accepted.border,
  },
  acceptedText: {
    color: theme.colors.status.accepted.text,
  },
  rejectedContainer: {
    backgroundColor: theme.colors.status.rejected.bg,
    borderColor: theme.colors.status.rejected.border,
  },
  rejectedText: {
    color: theme.colors.status.rejected.text,
  },
});

export default LeaveStatusBadge;
