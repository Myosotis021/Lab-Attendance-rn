import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Animated,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { theme } from '../theme';
import { getRoleLabel } from '../utils/labelUtils';

interface HamburgerMenuProps {
  visible: boolean;
  onClose: () => void;
}

const DRAWER_WIDTH = 300;

export const HamburgerMenu: React.FC<HamburgerMenuProps> = ({
  visible,
  onClose,
}) => {
  const router = useRouter();
  const { profile, logout, switchRole } = useAuth();
  const [slideAnim] = useState(() => new Animated.Value(-DRAWER_WIDTH));

  useEffect(() => {
    if (visible) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: -DRAWER_WIDTH,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, slideAnim]);

  const handleClose = () => {
    Animated.timing(slideAnim, {
      toValue: -DRAWER_WIDTH,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      onClose();
    });
  };

  const handleNavigate = (route: string) => {
    handleClose();
    setTimeout(() => {
      router.push(route as any);
    }, 220);
  };

  const handleSwitchRole = async () => {
    if (!profile) return;
    const otherRole = profile.roles.find((r) => r !== profile.role);
    if (!otherRole) return;

    try {
      await switchRole(otherRole);
      handleClose();
      Alert.alert(
        'Peran Berhasil Diganti',
        `Sekarang Anda aktif sebagai ${getRoleLabel(otherRole)}.`
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal mengganti peran.';
      Alert.alert('Gagal Ganti Peran', msg);
    }
  };

  const handleLogout = () => {
    Alert.alert('Konfirmasi Keluar', 'Apakah Anda yakin ingin keluar dari akun?', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Keluar',
        style: 'destructive',
        onPress: async () => {
          handleClose();
          try {
            await logout();
            router.replace('/login');
          } catch (err: unknown) {
            console.error('Logout error:', err);
          }
        },
      },
    ]);
  };

  const roles = profile?.roles || (profile?.role ? [profile.role] : []);
  const canSwitchRole = roles.length > 1;
  const canAddRole = roles.length === 1;
  const otherRole = canSwitchRole ? roles.find((r) => r !== profile?.role) : null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={handleClose}
    >
      <View style={styles.overlayContainer}>
        {/* Backdrop Tap Target */}
        <TouchableWithoutFeedback onPress={handleClose}>
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback>

        {/* Sliding Side Drawer */}
        <Animated.View
          style={[
            styles.drawerContent,
            { transform: [{ translateX: slideAnim }] },
          ]}
        >
          <SafeAreaView style={styles.drawerSafeArea} edges={['top', 'bottom', 'left']}>
            {/* Header Profil Drawer */}
            <View style={styles.header}>
              <View style={styles.headerTopRow}>
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarInitial}>
                    {(profile?.name || 'U').charAt(0).toUpperCase()}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={handleClose}
                  style={styles.closeButton}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Feather name="x" size={22} color={theme.colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <Text style={styles.userName} numberOfLines={1}>
                {profile?.name || 'Pengguna'}
              </Text>
              <Text style={styles.userEmail} numberOfLines={1}>
                {profile?.email || 'email@example.com'}
              </Text>

              <View style={styles.badgeWrapper}>
                <View style={styles.roleBadge}>
                  <Text style={styles.roleBadgeText}>
                    {getRoleLabel(profile?.role)}
                  </Text>
                </View>
                {profile?.nim ? (
                  <Text style={styles.nimSubtitle}>NIM: {profile.nim}</Text>
                ) : null}
              </View>
            </View>

            <View style={styles.divider} />

            {/* Menu Items */}
            <View style={styles.menuList}>
              {/* Beranda (Semua) */}
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => handleNavigate('/')}
                activeOpacity={0.7}
              >
                <Text style={styles.menuText}>Beranda</Text>
              </TouchableOpacity>

              {/* Peta Laboratorium (Semua) */}
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => handleNavigate('/lab-map')}
                activeOpacity={0.7}
              >
                <Text style={styles.menuText}>Peta Laboratorium</Text>
              </TouchableOpacity>

              {/* Daftar Izin Saya (Praktikan) */}
              {profile?.role === 'praktikan' && (
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => handleNavigate('/my-leave-requests')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.menuText}>Daftar Izin Saya</Text>
                </TouchableOpacity>
              )}

              {/* ✅ Review Izin Praktikan (Asisten) */}
              {profile?.role === 'asisten' && (
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => handleNavigate('/assistant-leave-review')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.menuText}>Review Izin Praktikan</Text>
                </TouchableOpacity>
              )}

              {/* Kelola Kelas (Asisten) */}
              {profile?.role === 'asisten' && (
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => handleNavigate('/class-management')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.menuText}>Kelola Kelas</Text>
                </TouchableOpacity>
              )}

              {/* Ganti Peran (Semua jika roles.length > 1) */}
              {canSwitchRole && otherRole && (
                <TouchableOpacity
                  style={[styles.menuItem, styles.highlightMenuItem]}
                  onPress={handleSwitchRole}
                  activeOpacity={0.7}
                >
                  <View style={styles.menuTextCol}>
                    <Text style={styles.menuText}>Ganti Peran</Text>
                    <Text style={styles.menuSubText}>
                      Ke {getRoleLabel(otherRole)}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}

              {/* ➕ Tambah Peran (Semua jika roles.length === 1) */}
              {canAddRole && (
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => handleNavigate('/role-management')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.menuText}>Tambah Peran</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.footerDivider} />

            {/* Footer / Tombol Keluar */}
            <View style={styles.footer}>
              <TouchableOpacity
                style={styles.logoutButton}
                onPress={handleLogout}
                activeOpacity={0.7}
              >
                <Text style={styles.logoutText}>Keluar</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlayContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
  },
  drawerContent: {
    width: DRAWER_WIDTH,
    height: '100%',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 16,
  },
  drawerSafeArea: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  avatarCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  closeButton: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: theme.colors.surfaceSubtle,
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginBottom: 8,
  },
  badgeWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  roleBadge: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  nimSubtitle: {
    fontSize: 12,
    color: theme.colors.textMuted,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  menuList: {
    flex: 1,
    paddingHorizontal: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 4,
  },
  highlightMenuItem: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  menuEmoji: {
    fontSize: 18,
    marginRight: 12,
  },
  menuText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  menuTextCol: {
    flex: 1,
  },
  menuSubText: {
    fontSize: 11,
    color: '#15803D',
    fontWeight: '500',
    marginTop: 1,
  },
  footerDivider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginHorizontal: 16,
  },
  footer: {
    padding: 16,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#FEF2F2',
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#DC2626',
  },
});

export default HamburgerMenu;
