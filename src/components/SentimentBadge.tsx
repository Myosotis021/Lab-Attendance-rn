import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SentimentResult } from '../types/models';
import { theme } from '../theme';

interface SentimentBadgeProps {
  sentiment?: SentimentResult | null;
  showDisclaimer?: boolean;
}

export const SentimentBadge: React.FC<SentimentBadgeProps> = ({
  sentiment,
  showDisclaimer = false,
}) => {
  const getBadgeConfig = () => {
    if (!sentiment || !sentiment.label) {
      return {
        containerStyle: styles.unclassifiedContainer,
        textStyle: styles.unclassifiedText,
        label: 'Belum diklasifikasikan',
      };
    }

    switch (sentiment.label) {
      case 'positif':
        return {
          containerStyle: styles.positiveContainer,
          textStyle: styles.positiveText,
          label: 'Positif',
        };
      case 'negatif':
        return {
          containerStyle: styles.negativeContainer,
          textStyle: styles.negativeText,
          label: 'Negatif',
        };
      case 'netral':
      default:
        return {
          containerStyle: styles.neutralContainer,
          textStyle: styles.neutralText,
          label: 'Netral',
        };
    }
  };

  const config = getBadgeConfig();

  return (
    <View style={styles.wrapper}>
      <View style={[styles.badge, config.containerStyle]}>
        <View style={[styles.dot, { backgroundColor: config.textStyle.color }]} />
        <Text style={[styles.text, config.textStyle]}>
          Sentimen: {config.label}
        </Text>
      </View>
      {showDisclaimer && (
        <Text style={styles.disclaimer}>
          *Hasil klasifikasi sentimen hanya informasi pendukung dan tidak menentukan keputusan izin.
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    gap: 4,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.full,
    alignSelf: 'flex-start',
    gap: 6,
    borderWidth: 1,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  text: {
    fontSize: 11,
    fontWeight: '700',
  },
  positiveContainer: {
    backgroundColor: '#DCFCE7',
    borderColor: '#BBF7D0',
  },
  positiveText: {
    color: '#166534',
  },
  neutralContainer: {
    backgroundColor: '#F3F4F6',
    borderColor: '#E5E7EB',
  },
  neutralText: {
    color: '#4B5563',
  },
  negativeContainer: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FECACA',
  },
  negativeText: {
    color: '#991B1B',
  },
  unclassifiedContainer: {
    backgroundColor: '#F9FAFB',
    borderColor: '#E5E7EB',
  },
  unclassifiedText: {
    color: '#6B7280',
  },
  disclaimer: {
    fontSize: 10,
    color: theme.colors.textMuted,
    fontStyle: 'italic',
  },
});

export default SentimentBadge;
