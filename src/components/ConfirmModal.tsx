import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Pressable,
} from 'react-native';

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

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onCancel}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelButtonText}>{cancelText}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.confirmButton, getConfirmButtonStyle()]}
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dialogBox: {
    width: '85%',
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
    marginBottom: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  cancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#4B5563',
    fontSize: 14,
    fontWeight: '600',
  },
  confirmButton: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmButtonPrimary: {
    backgroundColor: '#2563EB',
  },
  confirmButtonSuccess: {
    backgroundColor: '#16A34A',
  },
  confirmButtonDanger: {
    backgroundColor: '#DC2626',
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});

export default ConfirmModal;
