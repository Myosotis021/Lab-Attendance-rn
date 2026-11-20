import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { theme } from '../theme';

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
  retryText?: string;
  secondaryAction?: {
    label: string;
    onPress: () => void;
  };
  style?: ViewStyle;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Terjadi Kesalahan',
  message = 'Terjadi kesalahan saat memuat data.',
  onRetry,
  retryLabel,
  retryText,
  secondaryAction,
  style,
}) => {
  const label = retryLabel || retryText || 'Coba Lagi';

  return (
    <View style={[styles.card, style]}>
      <View style={styles.iconCircle}>
        <Feather name="alert-triangle" size={24} color="#DC2626" />
      </View>

      <Text style={styles.titleText}>{title}</Text>
      <Text style={styles.messageText}>{message}</Text>

      <View style={styles.buttonContainer}>
        {onRetry ? (
          <TouchableOpacity
            style={styles.retryButton}
            onPress={onRetry}
            activeOpacity={0.8}
          >
            <Text style={styles.retryButtonText}>{label}</Text>
          </TouchableOpacity>
        ) : null}

        {secondaryAction ? (
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={secondaryAction.onPress}
            activeOpacity={0.8}
          >
            <Text style={styles.secondaryButtonText}>
              {secondaryAction.label}
            </Text>
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
    padding: 24,
    alignItems: 'center',
    marginVertical: 14,
    ...theme.shadows.card,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  titleText: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.colors.textPrimary,
    marginBottom: 6,
    textAlign: 'center',
  },
  messageText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 18,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
    justifyContent: 'center',
  },
  retryButton: {
    backgroundColor: theme.colors.textPrimary,
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: theme.colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
});

export default ErrorState;
