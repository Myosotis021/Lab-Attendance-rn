import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { QRCode as QRCodeType, QRCodeOptions } from 'qrcode';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const QRCodeCore = require('qrcode/lib/core/qrcode') as {
  create: (data: string, options?: QRCodeOptions) => QRCodeType;
};

export interface QRCodeDisplayProps {
  value: string;
  size?: number;
}

export const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({
  value,
  size = 200,
}) => {
  const matrix = useMemo(() => {
    if (!value) return null;
    try {
      const qr = QRCodeCore.create(value, { errorCorrectionLevel: 'M' });
      const count = qr.modules.size;
      const rows: boolean[][] = [];
      for (let r = 0; r < count; r++) {
        const row: boolean[] = [];
        for (let c = 0; c < count; c++) {
          row.push(Boolean(qr.modules.get(r, c)));
        }
        rows.push(row);
      }
      return { count, rows };
    } catch {
      return null;
    }
  }, [value]);

  if (!matrix) {
    return (
      <View style={[styles.fallbackBox, { width: size, height: size }]}>
        <Text style={styles.fallbackText}>QR tidak tersedia</Text>
      </View>
    );
  }

  const quietZone = 12;
  const innerSize = size - quietZone * 2;
  const cellSize = innerSize / matrix.count;
  const renderedSize = cellSize * matrix.count;

  return (
    <View
      style={[
        styles.wrapper,
        {
          padding: quietZone,
          width: renderedSize + quietZone * 2,
          height: renderedSize + quietZone * 2,
        },
      ]}
    >
      <View style={{ width: renderedSize, height: renderedSize }}>
        {matrix.rows.map((row, rIdx) => (
          <View key={rIdx} style={{ flexDirection: 'row', height: cellSize }}>
            {row.map((dark, cIdx) => (
              <View
                key={cIdx}
                style={{
                  width: cellSize,
                  height: cellSize,
                  backgroundColor: dark ? '#111827' : '#FFFFFF',
                }}
              />
            ))}
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackBox: {
    backgroundColor: '#F3F4F6',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
});

export default QRCodeDisplay;
