import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LeaveStatus } from '../types/models';

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
          label: 'Diterima',
        };
      case 'DITOLAK':
        return {
          containerStyle: styles.rejectedContainer,
          textStyle: styles.rejectedText,
          label: 'Ditolak',
        };
      case 'MENUNGGU':
      default:
        return {
          containerStyle: styles.pendingContainer,
          textStyle: styles.pendingText,
          label: 'Menunggu',
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
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 12,
    fontWeight: '700',
  },
  pendingContainer: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  pendingText: {
    color: '#D97706',
  },
  acceptedContainer: {
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  acceptedText: {
    color: '#16A34A',
  },
  rejectedContainer: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  rejectedText: {
    color: '#DC2626',
  },
});

export default LeaveStatusBadge;

