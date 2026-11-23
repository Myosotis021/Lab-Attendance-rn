import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import { getRoleLabel } from '../utils/labelUtils';
import { validateNim } from '../utils/validators';
import { Role } from '../types/models';
import { theme } from '../theme';

export const RoleManagementScreen: React.FC = () => {
  const router = useRouter();
  const { profile, switchRole, addRole, loading } = useAuth();

  const [nimInput, setNimInput] = useState('');
  const [nimError, setNimError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const roles = profile?.roles || (profile?.role ? [profile.role] : []);
  const activeRole = profile?.role;
  const canSwitchRole = roles.length > 1;
  const canAddRole = roles.length === 1;

  // Tentukan peran kedua yang belum dimiliki
  const missingRole: Role | null = canAddRole
    ? roles.includes('asisten')
      ? 'praktikan'
      : 'asisten'
    : null;

  const otherRole: Role | null = canSwitchRole
    ? roles.find((r) => r !== activeRole) || null
    : null;

  const handleSwitch = async () => {
    if (!otherRole) return;
    try {
      setSubmitting(true);
      await switchRole(otherRole);
      Alert.alert(
        'Peran Berhasil Diganti',
        `Peran aktif Anda sekarang adalah ${getRoleLabel(otherRole)}.`
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal mengganti peran.';
      Alert.alert('Gagal Ganti Peran', msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddRole = async () => {
    if (!missingRole) return;

    if (missingRole === 'praktikan') {
      const err = validateNim(nimInput);
      if (err) {
        setNimError(err);
        return;
      }
    }

    try {
      setSubmitting(true);
      setNimError(null);
      await addRole(missingRole, nimInput);
      Alert.alert(
        'Berhasil',
        `Peran ${getRoleLabel(missingRole)} berhasil ditambahkan ke akun Anda.`
      );
      setNimInput('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal menambahkan peran.';
      Alert.alert('Gagal Tambah Peran', msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <LinearGradient colors={theme.colors.backgroundGradient} style={styles.flexOne}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <StatusBar style="dark" />

        {/* Top Header */}
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Feather name="arrow-left" size={20} color={theme.colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerTitleGroup}>
            <Text style={styles.screenTitle}>Kelola Peran Akun</Text>
            <Text style={styles.screenSubtitle}>
              Pengaturan dual-peran Asisten & Praktikan
            </Text>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Card Peran Aktif */}
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>PERAN AKTIF SAAT INI</Text>
            <View style={styles.activeRoleBanner}>
              <View style={styles.activeRoleIcon}>
                <Text style={styles.roleEmoji}>
                  {activeRole === 'asisten' ? '💼' : '🎓'}
                </Text>
              </View>
              <View style={styles.activeRoleInfo}>
                <Text style={styles.activeRoleTitle}>
                  {getRoleLabel(activeRole)}
                </Text>
                <Text style={styles.activeRoleDesc}>
                  {activeRole === 'asisten'
                    ? 'Memiliki hak akses manajemen kelas, sesi, dan review izin'
                    : 'Memiliki hak akses presensi dan pengajuan izin praktikum'}
                </Text>
                {activeRole === 'praktikan' && profile?.nim ? (
                  <Text style={styles.activeNimText}>NIM: {profile.nim}</Text>
                ) : null}
              </View>
            </View>
          </View>

          {/* Card Daftar Peran yang Dimiliki */}
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>PERAN YANG DIMILIKI AKUN</Text>
            <View style={styles.rolesList}>
              {(['asisten', 'praktikan'] as Role[]).map((r) => {
                const owned = roles.includes(r);
                const isActive = activeRole === r;

                return (
                  <View
                    key={r}
                    style={[
                      styles.roleItemRow,
                      owned && styles.roleItemOwned,
                      isActive && styles.roleItemActive,
                    ]}
                  >
                    <View style={styles.roleItemLeft}>
                      <Text style={styles.roleItemEmoji}>
                        {r === 'asisten' ? '💼' : '🎓'}
                      </Text>
                      <View>
                        <Text style={styles.roleItemTitle}>{getRoleLabel(r)}</Text>
                        <Text style={styles.roleItemStatus}>
                          {isActive
                            ? 'Aktif Digunakan'
                            : owned
                            ? 'Dimiliki'
                            : 'Belum Dimiliki'}
                        </Text>
                      </View>
                    </View>

                    {owned ? (
                      <View style={[styles.statusPill, isActive && styles.statusPillActive]}>
                        <Feather
                          name="check"
                          size={14}
                          color={isActive ? '#166534' : '#1E40AF'}
                        />
                        <Text
                          style={[
                            styles.statusPillText,
                            isActive && styles.statusPillTextActive,
                          ]}
                        >
                          {isActive ? 'Aktif' : 'Tersedia'}
                        </Text>
                      </View>
                    ) : (
                      <View style={styles.statusPillMissing}>
                        <Text style={styles.statusPillMissingText}>-</Text>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>

            {/* Tombol Ganti Peran jika memiliki 2 peran */}
            {canSwitchRole && otherRole && (
              <View style={styles.actionContainer}>
                <TouchableOpacity
                  style={styles.switchButton}
                  onPress={handleSwitch}
                  disabled={submitting || loading}
                  activeOpacity={0.8}
                >
                  {submitting ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <>
                      <Feather name="refresh-cw" size={16} color="#FFFFFF" />
                      <Text style={styles.switchButtonText}>
                        Ganti ke {getRoleLabel(otherRole)}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Form Tambah Peran jika baru memiliki 1 peran */}
          {canAddRole && missingRole && (
            <View style={styles.card}>
              <Text style={styles.sectionLabel}>TAMBAH PERAN KEDUA</Text>
              <Text style={styles.addRoleSubtitle}>
                Akun Anda saat ini hanya memiliki peran {getRoleLabel(activeRole)}. Anda
                dapat menambahkan peran {getRoleLabel(missingRole)} ke akun yang sama.
              </Text>

              {missingRole === 'praktikan' && (
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>
                    Nomor Induk Mahasiswa (NIM) *
                  </Text>
                  <TextInput
                    style={[styles.textInput, nimError ? styles.textInputError : null]}
                    placeholder="Contoh: 24060124130122"
                    placeholderTextColor={theme.colors.textMuted}
                    value={nimInput}
                    onChangeText={(t) => {
                      setNimInput(t);
                      if (nimError) setNimError(null);
                    }}
                    keyboardType="number-pad"
                    maxLength={14}
                    editable={!submitting}
                  />
                  {nimError ? (
                    <Text style={styles.errorText}>{nimError}</Text>
                  ) : (
                    <Text style={styles.helperText}>
                      NIM harus tepat 14 digit angka.
                    </Text>
                  )}
                </View>
              )}

              <TouchableOpacity
                style={styles.addButton}
                onPress={handleAddRole}
                disabled={submitting || loading}
                activeOpacity={0.8}
              >
                {submitting ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <Feather name="plus-circle" size={18} color="#FFFFFF" />
                    <Text style={styles.addButtonText}>
                      Tambah Peran {getRoleLabel(missingRole)}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}

          {roles.length >= 2 && (
            <View style={styles.infoBox}>
              <Feather name="info" size={16} color="#0284C7" />
              <Text style={styles.infoBoxText}>
                Akun Anda memiliki akses penuh ke kedua peran (Asisten Praktikum &
                Praktikan). Anda dapat beralih peran sewaktu-waktu melalui Hamburger Menu
                atau halaman ini.
              </Text>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  flexOne: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: theme.colors.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTitleGroup: {
    flex: 1,
  },
  screenTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  screenSubtitle: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: theme.colors.textMuted,
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  activeRoleBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  activeRoleIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginRight: 12,
  },
  roleEmoji: {
    fontSize: 24,
  },
  activeRoleInfo: {
    flex: 1,
  },
  activeRoleTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  activeRoleDesc: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },
  activeNimText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.primary,
    marginTop: 4,
  },
  rolesList: {
    gap: 8,
  },
  roleItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: '#FAFAFA',
  },
  roleItemOwned: {
    backgroundColor: '#FFFFFF',
    borderColor: '#BFDBFE',
  },
  roleItemActive: {
    backgroundColor: '#F0FDF4',
    borderColor: '#86EFAC',
  },
  roleItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  roleItemEmoji: {
    fontSize: 20,
  },
  roleItemTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  roleItemStatus: {
    fontSize: 11,
    color: theme.colors.textMuted,
    marginTop: 1,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusPillActive: {
    backgroundColor: '#DCFCE7',
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  statusPillTextActive: {
    color: '#15803D',
  },
  statusPillMissing: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusPillMissingText: {
    color: theme.colors.textMuted,
  },
  actionContainer: {
    marginTop: 14,
  },
  switchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: theme.colors.primary,
    paddingVertical: 12,
    borderRadius: 10,
  },
  switchButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  addRoleSubtitle: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginBottom: 14,
    lineHeight: 18,
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: theme.colors.textPrimary,
  },
  textInputError: {
    borderColor: '#EF4444',
  },
  errorText: {
    fontSize: 11,
    color: '#EF4444',
    marginTop: 4,
  },
  helperText: {
    fontSize: 11,
    color: theme.colors.textMuted,
    marginTop: 4,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#16A34A',
    paddingVertical: 12,
    borderRadius: 10,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#E0F2FE',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: 10,
    padding: 12,
  },
  infoBoxText: {
    flex: 1,
    fontSize: 12,
    color: '#0369A1',
    lineHeight: 17,
  },
});

export default RoleManagementScreen;
