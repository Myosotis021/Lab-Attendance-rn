import React from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { theme } from '../theme';

export interface LoadingStateProps {
  message?: string;
  style?: ViewStyle;
  color?: string;
  size?: 'small' | 'large';
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Memuat data...',
  style,
  color = theme.colors.textPrimary,
  size = 'large',
}) => {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.spinnerWrapper}>
        <ActivityIndicator size={size} color={color} />
      </View>
      {message ? <Text style={styles.text}>{message}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    minHeight: 180,
  },
  spinnerWrapper: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.subtle,
    marginBottom: 12,
  },
  text: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default LoadingState;
