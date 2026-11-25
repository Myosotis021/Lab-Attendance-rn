import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

export interface QRScannerModalProps {
  visible: boolean;
  onClose: () => void;
  onScanSuccess: (data: string) => void;
  title?: string;
}

const QRScannerContent: React.FC<{
  onClose: () => void;
  onScanSuccess: (data: string) => void;
  title: string;
}> = ({ onClose, onScanSuccess, title }) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  const handleBarCodeScanned = ({ data }: { type: string; data: string }) => {
    if (scanned) return;
    setScanned(true);
    onScanSuccess(data);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={onClose}
          activeOpacity={0.7}
        >
          <Feather name="x" size={20} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{title}</Text>
        <View style={{ width: 40 }} />
      </View>

      {!permission ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.statusText}>Memeriksa izin kamera...</Text>
        </View>
      ) : !permission.granted ? (
        <View style={styles.centerBox}>
          <Feather name="camera-off" size={44} color="#9CA3AF" />
          <Text style={styles.permTitle}>Izin Kamera Diperlukan</Text>
          <Text style={styles.permDesc}>
            Aplikasi memerlukan akses kamera untuk memindai QR Code yang
            ditampilkan oleh Asisten pada sesi Online.
          </Text>
          <TouchableOpacity
            style={styles.grantBtn}
            onPress={requestPermission}
            activeOpacity={0.85}
          >
            <Text style={styles.grantBtnText}>Izinkan Akses Kamera</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.cameraWrapper}>
          <CameraView
            style={StyleSheet.absoluteFill}
            facing="back"
            onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
            barcodeScannerSettings={{
              barcodeTypes: ['qr'],
            }}
          />

          {/* Overlay Frame */}
          <View style={styles.overlay} pointerEvents="none">
            <View style={styles.scanFrame} />
            <Text style={styles.scanHint}>
              Arahkan kamera ke QR Code dari Asisten Lab
            </Text>
          </View>

          {scanned && (
            <TouchableOpacity
              style={styles.rescanBtn}
              onPress={() => setScanned(false)}
              activeOpacity={0.85}
            >
              <Text style={styles.rescanBtnText}>Pindai Ulang</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </SafeAreaView>
  );
};

export const QRScannerModal: React.FC<QRScannerModalProps> = ({
  visible,
  onClose,
  onScanSuccess,
  title = 'Scan QR Code Presensi',
}) => {
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      {visible ? (
        <QRScannerContent
          onClose={onClose}
          onScanSuccess={onScanSuccess}
          title={title}
        />
      ) : null}
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
    gap: 12,
  },
  statusText: {
    color: '#E2E8F0',
    fontSize: 14,
  },
  permTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    marginTop: 8,
  },
  permDesc: {
    color: '#CBD5E1',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
  },
  grantBtn: {
    marginTop: 8,
    backgroundColor: '#2563EB',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  grantBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
  cameraWrapper: {
    flex: 1,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  scanFrame: {
    width: 240,
    height: 240,
    borderWidth: 3,
    borderColor: '#38BDF8',
    borderRadius: 20,
    backgroundColor: 'transparent',
  },
  scanHint: {
    marginTop: 20,
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    backgroundColor: 'rgba(15,23,42,0.75)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    overflow: 'hidden',
  },
  rescanBtn: {
    position: 'absolute',
    bottom: 40,
    backgroundColor: '#2563EB',
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 24,
  },
  rescanBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});

export default QRScannerModal;
