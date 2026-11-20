import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Pressable,
} from 'react-native';
import { theme } from '../theme';

export interface ConfirmModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: 'primary' | 'danger' | 'success';
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  visible,
  title,
  message,
  confirmText = 'Konfirmasi',
  cancelText = 'Batal',
  confirmVariant = 'primary',
  onConfirm,
  onCancel,
}) => {
  const getConfirmButtonStyle = () => {
    switch (confirmVariant) {
      case 'danger':
        return styles.confirmButtonDanger;
      case 'success':
        return styles.confirmButtonSuccess;
      case 'primary':
      default:
        return styles.confirmButtonPrimary;
    }
  };

  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={onCancel}
      statusBarTranslucent
    >
      <Pressable style={styles.overlay} onPress={onCancel}>
        {/* Prevent closing when pressing inside the dialog box */}
        <Pressable
          style={styles.dialogBox}
          onPress={(e) => e.stopPropagation()}
        >
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onCancel}
              activeOpacity={0.8}
            >
              <Text style={styles.cancelButtonText}>{cancelText}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.confirmButtonBase, getConfirmButtonStyle()]}
              onPress={onConfirm}
              activeOpacity={0.8}
            >
              <Text style={styles.confirmButtonText}>{confirmText}</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  dialogBox: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xxl,
    padding: 24,
    width: '100%',
    maxWidth: 380,
    ...theme.shadows.card,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.textPrimary,
    marginBottom: 8,
  },
  message: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    lineHeight: 19,
    marginBottom: 20,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surfaceSubtle,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    fontWeight: '700',
  },
  confirmButtonBase: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  confirmButtonPrimary: {
    backgroundColor: theme.colors.textPrimary,
  },
  confirmButtonDanger: {
    backgroundColor: '#DC2626',
  },
  confirmButtonSuccess: {
    backgroundColor: '#166534',
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
});

export default ConfirmModal;
