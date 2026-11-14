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
  SafeAreaView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
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
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <OfflineBanner />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
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
                <Text style={styles.errorBannerIcon}>⚠️</Text>
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
                    role === 'praktikan' && styles.rolePillPraktikanActive,
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
                    🎓 Praktikan
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.rolePill,
                    role === 'asisten' && styles.rolePillAsistenActive,
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
                    👨‍🏫 Asisten Lab
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Field Nama Lengkap */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nama Lengkap *</Text>
              <TextInput
                style={[styles.input, nameError ? styles.inputError : null]}
                placeholder="Contoh: Ahmad Fauzi"
                placeholderTextColor="#9CA3AF"
                value={name}
                onChangeText={(text) => {
                  setName(text);
                  if (nameError) setNameError(null);
                }}
                editable={!isSubmitting}
              />
              {nameError ? (
                <Text style={styles.fieldErrorText}>{nameError}</Text>
              ) : null}
            </View>

            {/* Field NIM (Hanya muncul jika peran Praktikan) */}
            {role === 'praktikan' ? (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>NIM (Nomor Induk Mahasiswa) *</Text>
                <TextInput
                  style={[styles.input, nimError ? styles.inputError : null]}
                  placeholder="Contoh: 220101001 (8-20 digit)"
                  placeholderTextColor="#9CA3AF"
                  value={nim}
                  onChangeText={(text) => {
                    setNim(text);
                    if (nimError) setNimError(null);
                  }}
                  keyboardType="numeric"
                  maxLength={20}
                  editable={!isSubmitting}
                />
                {nimError ? (
                  <Text style={styles.fieldErrorText}>{nimError}</Text>
                ) : null}
              </View>
            ) : null}

            {/* Field Email */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email *</Text>
              <TextInput
                style={[styles.input, emailError ? styles.inputError : null]}
                placeholder="nama@email.com"
                placeholderTextColor="#9CA3AF"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (emailError) setEmailError(null);
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
                placeholderTextColor="#9CA3AF"
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (passwordError) setPasswordError(null);
                }}
                secureTextEntry
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
                style={[
                  styles.input,
                  confirmPasswordError ? styles.inputError : null,
                ]}
                placeholder="Ulangi password"
                placeholderTextColor="#9CA3AF"
                value={confirmPassword}
                onChangeText={(text) => {
                  setConfirmPassword(text);
                  if (confirmPasswordError) setConfirmPasswordError(null);
                }}
                secureTextEntry
                editable={!isSubmitting}
              />
              {confirmPasswordError ? (
                <Text style={styles.fieldErrorText}>
                  {confirmPasswordError}
                </Text>
              ) : null}
            </View>

            {/* Tombol Submit Registrasi */}
            <TouchableOpacity
              style={[
                styles.submitButton,
                isSubmitting ? styles.submitButtonDisabled : null,
              ]}
              onPress={handleRegister}
              disabled={isSubmitting}
              activeOpacity={0.8}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.submitButtonText}>Daftar Sekarang</Text>
              )}
            </TouchableOpacity>

            {/* Link ke Login */}
            {onNavigateToLogin ? (
              <View style={styles.loginPrompt}>
                <Text style={styles.promptText}>Sudah memiliki akun? </Text>
                <TouchableOpacity
                  onPress={onNavigateToLogin}
                  disabled={isSubmitting}
                >
                  <Text style={styles.promptLink}>Masuk di sini</Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingVertical: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  appName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorBannerIcon: {
    marginRight: 8,
    fontSize: 16,
  },
  errorBannerText: {
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  inputGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
  },
  rolePillsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  rolePill: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rolePillPraktikanActive: {
    backgroundColor: '#DCFCE7',
    borderColor: '#16A34A',
  },
  rolePillAsistenActive: {
    backgroundColor: '#EDE9FE',
    borderColor: '#7C3AED',
  },
  rolePillText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  rolePillTextActive: {
    color: '#0F172A',
    fontWeight: '700',
  },
  input: {
    borderWidth: 1,
    borderColor: '#CED4DA',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#1E293B',
    backgroundColor: '#FFFFFF',
    minHeight: 48,
  },
  inputError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  fieldErrorText: {
    fontSize: 12,
    color: '#DC2626',
    marginTop: 4,
    fontWeight: '500',
  },
  submitButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    minHeight: 48,
    elevation: 2,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  submitButtonDisabled: {
    backgroundColor: '#93C5FD',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  loginPrompt: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 18,
  },
  promptText: {
    fontSize: 13,
    color: '#64748B',
  },
  promptLink: {
    fontSize: 13,
    color: '#2563EB',
    fontWeight: '700',
  },
});

export default RegisterScreen;
