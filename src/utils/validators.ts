/**
 * Validasi input form untuk Sprint 2 (SRS-04)
 */

export interface ValidationErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  nim?: string;
}

export const validateName = (name: string): string | null => {
  if (!name || !name.trim()) {
    return 'Nama lengkap tidak boleh kosong';
  }
  return null;
};

export const validateEmail = (email: string): string | null => {
  if (!email || !email.trim()) {
    return 'Email tidak boleh kosong';
  }
  // Standard email regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return 'Format email tidak valid';
  }
  return null;
};

export const validatePassword = (password: string): string | null => {
  if (!password) {
    return 'Password tidak boleh kosong';
  }
  if (password.length < 6) {
    return 'Password minimal 6 karakter';
  }
  return null;
};

export const validateConfirmPassword = (
  password: string,
  confirmPassword: string
): string | null => {
  if (!confirmPassword) {
    return 'Konfirmasi password tidak boleh kosong';
  }
  if (password !== confirmPassword) {
    return 'Konfirmasi password tidak cocok';
  }
  return null;
};

export const validateNim = (nim: string): string | null => {
  if (!nim || !nim.trim()) {
    return 'NIM wajib diisi untuk praktikan';
  }
  const cleanNim = nim.trim();
  if (!/^\d{14}$/.test(cleanNim)) {
    return 'NIM harus berupa tepat 14 digit angka';
  }
  return null;
};
