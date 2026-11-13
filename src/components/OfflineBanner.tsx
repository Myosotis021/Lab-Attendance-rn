import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNetInfo } from '@react-native-community/netinfo';

export const OfflineBanner: React.FC = () => {
  const netInfo = useNetInfo();

  // Tampilkan banner hanya jika terdeteksi offline
  const isOffline =
    netInfo.isConnected === false || netInfo.isInternetReachable === false;

  if (!isOffline) {
    return null;
  }

  return (
    <View style={styles.banner}>
      <Text style={styles.bannerIcon}>⚠️</Text>
      <Text style={styles.bannerText}>
        Mode Offline: Tidak ada koneksi internet. Beberapa fitur mungkin tidak
        tersedia.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#DC2626',
    paddingVertical: 8,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  bannerIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  bannerText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    flexShrink: 1,
  },
});

export default OfflineBanner;
