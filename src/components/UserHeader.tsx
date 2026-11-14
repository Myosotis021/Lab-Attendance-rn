import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { Role } from '../types/models';

interface UserHeaderProps {
  onLogout?: () => void;
}

export const UserHeader: React.FC<UserHeaderProps> = ({ onLogout }) => {
  const { profile, logout } = useAuth();

  const handleLogoutPress = () => {
    Alert.alert(
      'Konfirmasi Keluar',
      'Apakah Anda yakin ingin keluar dari akun Anda?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Keluar',
          style: 'destructive',
          onPress: async () => {
            if (onLogout) {
              onLogout();
            } else {
              try {
                await logout();
              } catch (error) {
                console.error('Logout error:', error);
              }
            }
          },
        },
      ]
    );
  };

  if (!profile) {
    return null;
  }

  const isAsisten = profile.role === 'asisten';

  return (
    <View style={styles.container}>
      {/* Profil User (Kiri) */}
      <View style={styles.userInfo}>
        <View style={styles.nameRow}>
          <Text style={styles.nameText} numberOfLines={1}>
            {profile.name}
          </Text>
          <View
            style={[
              styles.roleBadge,
              isAsisten ? styles.roleBadgeAsisten : styles.roleBadgePraktikan,
            ]}
          >
            <Text
              style={[
                styles.roleBadgeText,
                isAsisten
                  ? styles.roleBadgeTextAsisten
                  : styles.roleBadgeTextPraktikan,
              ]}
            >
              {isAsisten ? 'ASISTEN LAB' : 'PRAKTIKAN'}
            </Text>
          </View>
        </View>

        <Text style={styles.identifierText}>
          {profile.role === 'praktikan' && profile.nim
            ? `NIM: ${profile.nim}`
            : profile.email}
        </Text>
      </View>

      {/* Tombol Keluar (Kanan) */}
      <TouchableOpacity
        style={styles.logoutButton}
        onPress={handleLogoutPress}
        activeOpacity={0.7}
      >
        <Text style={styles.logoutButtonText}>Keluar</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  userInfo: {
    flex: 1,
    marginRight: 12,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 3,
  },
  nameText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  roleBadgeAsisten: {
    backgroundColor: '#EDE9FE',
    borderColor: '#C4B5FD',
  },
  roleBadgePraktikan: {
    backgroundColor: '#DCFCE7',
    borderColor: '#86EFAC',
  },
  roleBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  roleBadgeTextAsisten: {
    color: '#6D28D9',
  },
  roleBadgeTextPraktikan: {
    color: '#15803D',
  },
  identifierText: {
    fontSize: 12,
    color: '#64748B',
    fontFamily: 'monospace',
  },
  logoutButton: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#DC2626',
  },
});

export default UserHeader;
