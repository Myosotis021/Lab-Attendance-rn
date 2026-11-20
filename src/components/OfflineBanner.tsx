import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { theme } from '../theme';

// Safe wrapper for @react-native-community/netinfo
let useNetInfoHook: () => { isConnected: boolean | null; isInternetReachable: boolean | null } =
  () => ({ isConnected: true, isInternetReachable: true });

try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const netInfoPkg = require('@react-native-community/netinfo');
  if (netInfoPkg && netInfoPkg.useNetInfo) {
    useNetInfoHook = netInfoPkg.useNetInfo;
  }
} catch {
  // netinfo fallback
}

export const OfflineBanner: React.FC = () => {
  const netInfo = useNetInfoHook();

  const isOffline =
    netInfo.isConnected === false || netInfo.isInternetReachable === false;

  if (!isOffline) {
    return null;
  }

  return (
    <View style={styles.banner}>
      <Feather name="wifi-off" size={14} color="#FFFFFF" style={styles.bannerIcon} />
      <Text style={styles.bannerText}>
        Mode Offline: Tidak ada koneksi internet. Beberapa fitur mungkin terbatas.
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
    borderRadius: theme.borderRadius.sm,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
    zIndex: 999,
  },
  bannerIcon: {
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
