import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { theme } from '../theme';

interface EmptyStateProps {
  message?: string;
  description?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  message = 'Tidak ada jadwal praktikum yang tersedia saat ini',
  description = 'Jadwal belum ditambahkan atau semua sesi praktikum telah berakhir.',
}) => {
  return (
    <View style={styles.card}>
      <View style={styles.iconContainer}>
        <Feather name="inbox" size={26} color={theme.colors.textMuted} />
      </View>
      <Text style={styles.messageText}>{message}</Text>
      {description ? (
        <Text style={styles.descriptionText}>{description}</Text>
      ) : null}
    </View>
  );
};

export default EmptyState;

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl,
    paddingVertical: 32,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 14,
    ...theme.shadows.card,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  messageText: {
    fontSize: 15,
    fontWeight: '800',
    color: theme.colors.textPrimary,
    textAlign: 'center',
    lineHeight: 21,
  },
  descriptionText: {
    fontSize: 12,
    color: theme.colors.textMuted,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
    paddingHorizontal: 12,
  },
});
