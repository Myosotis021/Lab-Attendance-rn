import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { Role } from '../types/models';
import {
  validateName,
  validateEmail,
  validatePassword,
  validateConfirmPassword,
  validateNim,
} from '../utils/validators';
import { getErrorMessage } from '../utils/errorMessages';
import { OfflineBanner } from '../components/OfflineBanner';
import { theme } from '../theme';

interface RegisterScreenProps {
  onNavigateToLogin?: () => void;
}

export const RegisterScreen: React.FC<RegisterScreenProps> = ({
  onNavigateToLogin,
}) => {
  const router = useRouter();
  const { register } = useAuth();

  // Form states
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [role, setRole] = useState<Role>('praktikan');
  const [nim, setNim] = useState<string>('');

  // Field validation error states
  const [nameError, setNameError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmPasswordError, setConfirmPasswordError] = useState<string | null>(null);
  const [nimError, setNimError] = useState<string | null>(null);

  // General auth error
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleRegister = async () => {
    // Reset previous errors
    setNameError(null);
    setEmailError(null);
    setPasswordError(null);
    setConfirmPasswordError(null);
    setNimError(null);
    setGeneralError(null);

    // Validate fields
    const nErr = validateName(name);
    const eErr = validateEmail(email);
    const pErr = validatePassword(password);
    const cpErr = validateConfirmPassword(password, confirmPassword);
    const nimErr = role === 'praktikan' ? validateNim(nim) : null;

    if (nErr || eErr || pErr || cpErr || nimErr) {
      setNameError(nErr);
      setEmailError(eErr);
      setPasswordError(pErr);
      setConfirmPasswordError(cpErr);
      setNimError(nimErr);
      return;
    }

    setIsSubmitting(true);
    try {
      await register({
        name,
        email,
        password,
        role,
        nim: role === 'praktikan' ? nim : undefined,
      });
      // Navigasi ke home setelah registrasi berhasil
      router.replace('/' as any);
    } catch (error) {
      const friendlyMsg = getErrorMessage(error);
      setGeneralError(friendlyMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <LinearGradient colors={theme.colors.backgroundGradient} style={styles.flexOne}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <StatusBar style="dark" />
        <OfflineBanner />
        <KeyboardAvoidingView
          style={styles.flexOne}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.appName}>Daftar Akun Baru</Text>
              <Text style={styles.subtitle}>
                Lengkapi data untuk mengakses sistem presensi laboratorium
              </Text>
            </View>

            {/* Kartu Form Register */}
            <View style={styles.card}>
              {/* General Error Banner */}
              {generalError ? (
                <View style={styles.errorBanner}>
                  <Feather name="alert-triangle" size={16} color="#DC2626" style={styles.errorBannerIcon} />
                  <Text style={styles.errorBannerText}>{generalError}</Text>
                </View>
              ) : null}

              {/* Pilihan Peran (Pills) */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Pilih Peran Pengguna *</Text>
                <View style={styles.rolePillsRow}>
                  <TouchableOpacity
                    style={[
                      styles.rolePill,
                      role === 'praktikan' && styles.rolePillActive,
                    ]}
                    onPress={() => {
                      setRole('praktikan');
                      setNimError(null);
                    }}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.rolePillText,
                        role === 'praktikan' && styles.rolePillTextActive,
                      ]}
                    >
                      Praktikan (Mahasiswa)
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.rolePill,
                      role === 'asisten' && styles.rolePillActive,
                    ]}
                    onPress={() => {
                      setRole('asisten');
                      setNimError(null);
                    }}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.rolePillText,
                        role === 'asisten' && styles.rolePillTextActive,
                      ]}
                    >
                      Asisten Lab
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Field Nama Lengkap */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Nama Lengkap *</Text>
                <TextInput
                  style={[styles.input, nameError ? styles.inputError : null]}
                  placeholder="Contoh: Budi Santoso"
                  placeholderTextColor={theme.colors.textMuted}
                  value={name}
                  onChangeText={(text) => {
                    setName(text);
                    if (nameError) setNameError(null);
                    if (generalError) setGeneralError(null);
                  }}
                  autoCapitalize="words"
                  editable={!isSubmitting}
                />
                {nameError ? (
                  <Text style={styles.fieldErrorText}>{nameError}</Text>
                ) : null}
              </View>

              {/* Field NIM (hanya untuk Praktikan) */}
              {role === 'praktikan' && (
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Nomor Induk Mahasiswa (NIM) *</Text>
                  <TextInput
                    style={[styles.input, nimError ? styles.inputError : null]}
                    placeholder="Contoh: 2101010001"
                    placeholderTextColor={theme.colors.textMuted}
                    value={nim}
                    onChangeText={(text) => {
                      setNim(text);
                      if (nimError) setNimError(null);
                      if (generalError) setGeneralError(null);
                    }}
                    keyboardType="number-pad"
                    editable={!isSubmitting}
                  />
                  {nimError ? (
                    <Text style={styles.fieldErrorText}>{nimError}</Text>
                  ) : null}
                </View>
              )}

              {/* Field Email */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email *</Text>
                <TextInput
                  style={[styles.input, emailError ? styles.inputError : null]}
                  placeholder="nama@email.com"
                  placeholderTextColor={theme.colors.textMuted}
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    if (emailError) setEmailError(null);
                    if (generalError) setGeneralError(null);
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isSubmitting}
                />
                {emailError ? (
                  <Text style={styles.fieldErrorText}>{emailError}</Text>
                ) : null}
              </View>

              {/* Field Password */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Password *</Text>
                <TextInput
                  style={[styles.input, passwordError ? styles.inputError : null]}
                  placeholder="Minimal 6 karakter"
                  placeholderTextColor={theme.colors.textMuted}
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (passwordError) setPasswordError(null);
                    if (generalError) setGeneralError(null);
                  }}
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isSubmitting}
                />
                {passwordError ? (
                  <Text style={styles.fieldErrorText}>{passwordError}</Text>
                ) : null}
              </View>

              {/* Field Konfirmasi Password */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Konfirmasi Password *</Text>
                <TextInput
                  style={[styles.input, confirmPasswordError ? styles.inputError : null]}
                  placeholder="Ulangi password di atas"
                  placeholderTextColor={theme.colors.textMuted}
                  value={confirmPassword}
                  onChangeText={(text) => {
                    setConfirmPassword(text);
                    if (confirmPasswordError) setConfirmPasswordError(null);
                    if (generalError) setGeneralError(null);
                  }}
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isSubmitting}
                />
                {confirmPasswordError ? (
                  <Text style={styles.fieldErrorText}>{confirmPasswordError}</Text>
                ) : null}
              </View>

              {/* Tombol Submit Register */}
              <TouchableOpacity
                style={[styles.submitButton, isSubmitting ? styles.submitButtonDisabled : null]}
                onPress={handleRegister}
                disabled={isSubmitting}
                activeOpacity={0.85}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitButtonText}>Daftar Akun Sekarang</Text>
                )}
              </TouchableOpacity>

              {/* Link ke Login */}
              <View style={styles.loginRow}>
                <Text style={styles.loginPrompt}>Sudah punya akun? </Text>
                <TouchableOpacity
                  onPress={() => {
                    if (onNavigateToLogin) {
                      onNavigateToLogin();
                    } else {
                      router.push('/login' as any);
                    }
                  }}
                  disabled={isSubmitting}
                >
                  <Text style={styles.loginLink}>Masuk di sini</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
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
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  appName: {
    fontSize: 24,
    fontWeight: '800',
    color: theme.colors.textPrimary,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: 12,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xxl,
    padding: 24,
    ...theme.shadows.card,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: theme.borderRadius.md,
    padding: 12,
    marginBottom: 16,
  },
  errorBannerIcon: {
    marginRight: 8,
  },
  errorBannerText: {
    color: '#B91C1C',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  inputGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: 6,
  },
  rolePillsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  rolePill: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surfaceSubtle,
    alignItems: 'center',
  },
  rolePillActive: {
    borderColor: theme.colors.textPrimary,
    backgroundColor: 'rgba(20, 20, 43, 0.05)',
  },
  rolePillText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  rolePillTextActive: {
    color: theme.colors.textPrimary,
    fontWeight: '800',
  },
  input: {
    backgroundColor: theme.colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: theme.colors.textPrimary,
  },
  inputError: {
    borderColor: '#EF4444',
    backgroundColor: '#FFF5F5',
  },
  fieldErrorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 4,
  },
  submitButton: {
    backgroundColor: theme.colors.textPrimary,
    borderRadius: theme.borderRadius.md,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    ...theme.shadows.subtle,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 18,
  },
  loginPrompt: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  loginLink: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.primaryBlue,
  },
});

export default RegisterScreen;
