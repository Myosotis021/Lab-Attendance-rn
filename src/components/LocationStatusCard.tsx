import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { PermissionStatusType } from '../hooks/useCurrentLocation';

export interface LocationStatusCardProps {
  labName: string;
  distanceMeters: number | null;
  radiusMeters: number;
  withinRadius: boolean | null;
  permissionStatus: PermissionStatusType;
  accuracy: number | null;
  onRefresh: () => void;
  errorMessage?: string | null;
}

export const LocationStatusCard: React.FC<LocationStatusCardProps> = ({
  labName,
  distanceMeters,
  radiusMeters,
  withinRadius,
  permissionStatus,
  accuracy,
  onRefresh,
  errorMessage,
}) => {
  const isLoading =
    permissionStatus === 'loading' ||
    (permissionStatus === 'granted' && distanceMeters === null);

  const isDenied = permissionStatus === 'denied';

  // Tentukan styling warna kartu berdasarkan kondisi lokasi
  let cardBorderColor = '#D1D5DB';
  let cardBgColor = '#F9FAFB';
  let statusBadgeBg = '#E5E7EB';
  let statusBadgeText = '#4B5563';
  let statusLabel = 'Memeriksa Posisi...';
  let iconSymbol = '📍';

  if (isDenied) {
    cardBorderColor = '#FCA5A5';
    cardBgColor = '#FEF2F2';
    statusBadgeBg = '#FEE2E2';
    statusBadgeText = '#B91C1C';
    statusLabel = 'Izin Lokasi Ditolak';
    iconSymbol = '⚠️';
  } else if (isLoading) {
    cardBorderColor = '#E5E7EB';
    cardBgColor = '#F9FAFB';
    statusBadgeBg = '#F3F4F6';
    statusBadgeText = '#6B7280';
    statusLabel = 'Mengambil GPS...';
    iconSymbol = '🧭';
  } else if (withinRadius === true) {
    cardBorderColor = '#16A34A';
    cardBgColor = '#F0FDF4';
    statusBadgeBg = '#DCFCE7';
    statusBadgeText = '#15803D';
    statusLabel = '✓ Dalam Radius';
    iconSymbol = '✓';
  } else if (withinRadius === false) {
    cardBorderColor = '#DC2626';
    cardBgColor = '#FEF2F2';
    statusBadgeBg = '#FEE2E2';
    statusBadgeText = '#B91C1C';
    statusLabel = '✗ Di Luar Radius';
    iconSymbol = '✕';
  }

  return (
    <View
      style={[
        styles.cardContainer,
        { borderColor: cardBorderColor, backgroundColor: cardBgColor },
      ]}
    >
      {/* Header Baris Status & Tombol Refresh */}
      <View style={styles.headerRow}>
        <View style={styles.iconAndTitle}>
          <View style={[styles.iconBox, { backgroundColor: statusBadgeBg }]}>
            <Text style={{ fontSize: 18, color: statusBadgeText, fontWeight: '800' }}>
              {iconSymbol}
            </Text>
          </View>
          <View style={styles.titleColumn}>
            <Text style={styles.labTitle} numberOfLines={1}>
              {labName || 'Laboratorium Praktikum'}
            </Text>
            <Text style={styles.radiusSub}>Radius Wajib: {radiusMeters} meter</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.refreshButton}
          onPress={onRefresh}
          activeOpacity={0.7}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#2563EB" />
          ) : (
            <Text style={{ fontSize: 14 }}>🔄</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Baris Informasi Jarak & Badge */}
      <View style={styles.bodyRow}>
        <View style={styles.distanceBlock}>
          <Text style={styles.distanceLabel}>Jarak Anda Saat Ini</Text>
          <Text style={styles.distanceValue}>
            {distanceMeters !== null
              ? `${distanceMeters} m`
              : isLoading
              ? 'Menghitung...'
              : 'Tidak Tersedia'}
          </Text>
        </View>

        <View
          style={[styles.statusBadge, { backgroundColor: statusBadgeBg }]}
        >
          <Text style={[styles.statusBadgeText, { color: statusBadgeText }]}>
            {statusLabel}
          </Text>
        </View>
      </View>

      {/* Informasi Akurasi / Pesan Error */}
      <View style={styles.footerRow}>
        {errorMessage ? (
          <Text style={styles.errorText}>{errorMessage}</Text>
        ) : isDenied ? (
          <Text style={styles.errorText}>
            Akses lokasi diperlukan untuk presensi. Aktifkan di pengaturan.
          </Text>
        ) : accuracy !== null ? (
          <Text style={styles.accuracyText}>
            Akurasi GPS: ±{Math.round(accuracy)} m
          </Text>
        ) : (
          <Text style={styles.accuracyText}>Mencari sinyal GPS terbaik...</Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    borderRadius: 12,
    borderWidth: 1.5,
    padding: 16,
    marginVertical: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconAndTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  titleColumn: {
    flex: 1,
  },
  labTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  radiusSub: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  refreshButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  bodyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  distanceBlock: {
    justifyContent: 'center',
  },
  distanceLabel: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
  },
  distanceValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  footerRow: {
    marginTop: 10,
  },
  accuracyText: {
    fontSize: 11,
    color: '#6B7280',
  },
  errorText: {
    fontSize: 11,
    color: '#DC2626',
    fontWeight: '600',
  },
});

export default LocationStatusCard;
