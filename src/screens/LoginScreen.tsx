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
import { validateEmail, validatePassword } from '../utils/validators';
import { getErrorMessage } from '../utils/errorMessages';
import { OfflineBanner } from '../components/OfflineBanner';
import { theme } from '../theme';

interface LoginScreenProps {
  onNavigateToRegister?: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onNavigateToRegister,
}) => {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');

  // Error per field
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // General auth error
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleLogin = async () => {
    // Reset previous errors
    setEmailError(null);
    setPasswordError(null);
    setGeneralError(null);

    // Validasi input
    const eError = validateEmail(email);
    const pError = validatePassword(password);

    if (eError || pError) {
      setEmailError(eError);
      setPasswordError(pError);
      return;
    }

    setIsSubmitting(true);
    try {
      await login(email, password);
      // Navigasi ke home setelah login berhasil
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
            {/* Header Aplikasi */}
            <View style={styles.header}>
              <View style={styles.logoCircle}>
                <Text style={styles.logoText}>🔬</Text>
              </View>
              <Text style={styles.appName}>Lab Attendance</Text>
              <Text style={styles.subtitle}>
                Sistem Presensi Praktikum Laboratorium
              </Text>
            </View>

            {/* Kartu Form Login */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Masuk ke Akun</Text>
              <Text style={styles.cardDescription}>
                Masukkan email dan password terdaftar Anda
              </Text>

              {/* General Error Banner */}
              {generalError ? (
                <View style={styles.errorBanner}>
                  <Feather name="alert-triangle" size={16} color="#DC2626" style={styles.errorBannerIcon} />
                  <Text style={styles.errorBannerText}>{generalError}</Text>
                </View>
              ) : null}

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

              {/* Tombol Submit Login */}
              <TouchableOpacity
                style={[styles.submitButton, isSubmitting ? styles.submitButtonDisabled : null]}
                onPress={handleLogin}
                disabled={isSubmitting}
                activeOpacity={0.85}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitButtonText}>Masuk Sekarang</Text>
                )}
              </TouchableOpacity>

              {/* Link ke Registrasi */}
              <View style={styles.registerRow}>
                <Text style={styles.registerPrompt}>Belum punya akun? </Text>
                <TouchableOpacity
                  onPress={() => {
                    if (onNavigateToRegister) {
                      onNavigateToRegister();
                    } else {
                      router.push('/register' as any);
                    }
                  }}
                  disabled={isSubmitting}
                >
                  <Text style={styles.registerLink}>Daftar di sini</Text>
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
    marginBottom: 24,
  },
  logoCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    ...theme.shadows.card,
  },
  logoText: {
    fontSize: 32,
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
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xxl,
    padding: 24,
    ...theme.shadows.card,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: theme.colors.textPrimary,
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginBottom: 20,
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
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: 6,
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
    marginTop: 8,
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
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  registerPrompt: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  registerLink: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.primaryBlue,
  },
});

export default LoginScreen;
