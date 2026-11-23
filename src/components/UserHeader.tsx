import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { UserProfile } from '../types/models';
import { getRoleLabel } from '../utils/labelUtils';
import { theme } from '../theme';

export interface UserHeaderProps {
  profile?: UserProfile | null;
  onSwitchRole?: (nextRole: 'asisten' | 'praktikan') => void;
  onLogout?: () => void;
  onPressMenu?: () => void;
}

export const UserHeader: React.FC<UserHeaderProps> = ({
  profile: propProfile,
  onSwitchRole,
  onLogout,
  onPressMenu,
}) => {
  let contextProfile: UserProfile | null = null;
  let contextLogout: (() => Promise<void>) | undefined;
  try {
    const authCtx = useAuth();
    contextProfile = authCtx.profile;
    contextLogout = authCtx.logout;
  } catch {
    // AuthProvider may not be wrapping if used standalone
  }

  const profile = propProfile || contextProfile;

  if (!profile) {
    return null;
  }

  const isAsisten = profile.role === 'asisten';

  const handleToggle = () => {
    if (onSwitchRole) {
      onSwitchRole(isAsisten ? 'praktikan' : 'asisten');
    }
  };

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
            } else if (contextLogout) {
              try {
                await contextLogout();
              } catch (error) {
                console.error('Logout error:', error);
              }
            }
          },
        },
      ]
    );
  };

  const roleLabel = getRoleLabel(profile.role);

  return (
    <View style={styles.headerCard}>
      {/* Left Icon Button: Hamburger Menu */}
      <TouchableOpacity
        style={styles.iconButton}
        onPress={onPressMenu}
        activeOpacity={0.7}
        accessibilityLabel="Menu Navigasi"
      >
        <Feather name="menu" size={20} color={theme.colors.textPrimary} />
      </TouchableOpacity>

      {/* Center Greeting & Role */}
      <View style={styles.centerGreeting}>
        <Text style={styles.greetingTitle} numberOfLines={1}>
          Halo, {profile.name}
        </Text>
        <View style={styles.roleSubRow}>
          <Text style={styles.roleSubText}>{roleLabel}</Text>
          {profile.nim ? (
            <Text style={styles.nimText}> • {profile.nim}</Text>
          ) : profile.identifier ? (
            <Text style={styles.nimText}> • ID: {profile.identifier}</Text>
          ) : null}
        </View>
      </View>

      {/* Right Controls: Switch role and Logout buttons */}
      <View style={styles.rightActions}>
        {onSwitchRole ? (
          <TouchableOpacity
            style={styles.switchPill}
            onPress={handleToggle}
            activeOpacity={0.7}
            accessibilityLabel="Ganti Peran"
          >
            <Feather name="repeat" size={13} color={theme.colors.textPrimary} />
            <Text style={styles.switchPillText}>Peran</Text>
          </TouchableOpacity>
        ) : null}

        {onLogout || contextLogout ? (
          <TouchableOpacity
            style={styles.iconButton}
            onPress={handleLogoutPress}
            activeOpacity={0.7}
            accessibilityLabel="Keluar"
          >
            <Feather name="log-out" size={18} color="#EF4444" />
          </TouchableOpacity>
        ) : (
          <View style={styles.iconButton}>
            <Feather name="calendar" size={18} color={theme.colors.textPrimary} />
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerCard: {
    backgroundColor: theme.colors.surface,
    borderBottomLeftRadius: theme.borderRadius.xxl,
    borderBottomRightRadius: theme.borderRadius.xxl,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...theme.shadows.header,
    borderBottomWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.04)',
    marginBottom: 16,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerGreeting: {
    flex: 1,
    paddingHorizontal: 12,
  },
  greetingTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.textPrimary,
    letterSpacing: -0.3,
  },
  roleSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  roleSubText: {
    fontSize: 12,
    color: theme.colors.textMuted,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  nimText: {
    fontSize: 12,
    color: theme.colors.textMuted,
    fontWeight: '500',
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  switchPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surfaceSubtle,
  },
  switchPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
});

export default UserHeader;
