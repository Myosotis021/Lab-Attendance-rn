import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SentimentResult } from '../types/models';

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
        label: 'Belum dapat diklasifikasikan',
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
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  text: {
    fontSize: 11,
    fontWeight: '600',
  },
  positiveContainer: {
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  positiveText: {
    color: '#15803D',
  },
  neutralContainer: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  neutralText: {
    color: '#4B5563',
  },
  negativeContainer: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  negativeText: {
    color: '#B91C1C',
  },
  unclassifiedContainer: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  unclassifiedText: {
    color: '#6B7280',
  },
  disclaimer: {
    fontSize: 10,
    color: '#6B7280',
    fontStyle: 'italic',
    marginTop: 2,
    lineHeight: 14,
  },
});

export default SentimentBadge;

