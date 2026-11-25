import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LabLocation } from '../types/models';
import { updateLabLocation } from '../services/labLocationService';
import { getCurrentPosition } from '../services/locationService';

export interface EditLabLocationModalProps {
  visible: boolean;
  lab: LabLocation | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export const EditLabLocationModal: React.FC<EditLabLocationModalProps> = ({
  visible,
  lab,
  onClose,
  onSuccess,
}) => {
  const [prevLabId, setPrevLabId] = useState<string | null>(null);
  const [latitude, setLatitude] = useState<string>('');
  const [longitude, setLongitude] = useState<string>('');
  const [radiusMeters, setRadiusMeters] = useState<string>('150');
  const [description, setDescription] = useState<string>('');
  const [saving, setSaving] = useState<boolean>(false);
  const [fetchingGps, setFetchingGps] = useState<boolean>(false);

  // Sync state when lab changes without using an effect that calls setState synchronously
  if (lab && lab.id !== prevLabId) {
    setPrevLabId(lab.id);
    setLatitude(String(lab.latitude));
    setLongitude(String(lab.longitude));
    setRadiusMeters(String(lab.radiusMeters || 150));
    setDescription(lab.description || '');
  }

  const handleUseCurrentPosition = async () => {
    setFetchingGps(true);
    try {
      const pos = await getCurrentPosition();
      if (pos.coords) {
        setLatitude(String(pos.coords.latitude));
        setLongitude(String(pos.coords.longitude));
        Alert.alert(
          'Lokasi Terdeteksi',
          `Koordinat berhasil diambil dari GPS perangkat:\nLat: ${pos.coords.latitude.toFixed(
            5
          )}, Lon: ${pos.coords.longitude.toFixed(5)}`
        );
      } else {
        Alert.alert(
          'Gagal Mengambil Lokasi',
          pos.errorMessage || 'GPS tidak tersedia atau izin ditolak.'
        );
      }
    } catch (err: any) {
      Alert.alert('Gagal Mengambil Lokasi', err?.message || 'Terjadi kesalahan.');
    } finally {
      setFetchingGps(false);
    }
  };

  const handleSave = async () => {
    if (!lab) return;

    const latNum = parseFloat(latitude);
    const lonNum = parseFloat(longitude);
    const radNum = parseInt(radiusMeters, 10);

    // Validasi rentang koordinat WGS-84
    if (isNaN(latNum) || latNum < -90 || latNum > 90) {
      Alert.alert('Validasi Gagal', 'Latitude harus berupa angka antara -90 sampai 90.');
      return;
    }

    if (isNaN(lonNum) || lonNum < -180 || lonNum > 180) {
      Alert.alert(
        'Validasi Gagal',
        'Longitude harus berupa angka antara -180 sampai 180.'
      );
      return;
    }

    // Validasi radius (min 50m, max 1000m sesuai spesifikasi)
    if (isNaN(radNum) || radNum < 50 || radNum > 1000) {
      Alert.alert(
        'Validasi Gagal',
        'Radius presensi harus bernilai antara 50 sampai 1000 meter.'
      );
      return;
    }

    setSaving(true);
    try {
      await updateLabLocation(lab.id, {
        latitude: latNum,
        longitude: lonNum,
        radiusMeters: radNum,
        description: description.trim(),
      });

      Alert.alert(
        'Berhasil',
        `Lokasi untuk "${lab.name}" berhasil diperbarui.`,
        [
          {
            text: 'OK',
            onPress: () => {
              onSuccess?.();
              onClose();
            },
          },
        ]
      );
    } catch (err: any) {
      Alert.alert('Gagal Menyimpan', err?.message || 'Terjadi kesalahan.');
    } finally {
      setSaving(false);
    }
  };

  if (!lab) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header Modal */}
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.modalTitle}>⚙ Edit Lokasi Lab</Text>
              <Text style={styles.modalSubtitle}>{lab.name}</Text>
            </View>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={onClose}
              disabled={saving}
            >
              <Text style={{ fontSize: 16, color: '#4B5563', fontWeight: '700' }}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.formContainer}
          >
            {/* Tombol Ambil GPS Saat Ini */}
            <TouchableOpacity
              style={styles.gpsAutoBtn}
              onPress={handleUseCurrentPosition}
              disabled={fetchingGps || saving}
              activeOpacity={0.8}
            >
              {fetchingGps ? (
                <ActivityIndicator size="small" color="#2563EB" />
              ) : (
                <Text style={{ fontSize: 14 }}>🎯</Text>
              )}
              <Text style={styles.gpsAutoBtnText}>
                {fetchingGps
                  ? 'Mencari GPS perangkat...'
                  : 'Gunakan Koordinat GPS Saya Saat Ini'}
              </Text>
            </TouchableOpacity>

            {/* Input Latitude */}
            <Text style={styles.label}>Latitude (-90 s/d 90):</Text>
            <TextInput
              style={styles.input}
              value={latitude}
              onChangeText={setLatitude}
              placeholder="Contoh: -6.9733"
              keyboardType="numeric"
              editable={!saving}
            />

            {/* Input Longitude */}
            <Text style={styles.label}>Longitude (-180 s/d 180):</Text>
            <TextInput
              style={styles.input}
              value={longitude}
              onChangeText={setLongitude}
              placeholder="Contoh: 107.6306"
              keyboardType="numeric"
              editable={!saving}
            />

            {/* Input Radius */}
            <Text style={styles.label}>Radius Presensi (50 - 1000 meter):</Text>
            <TextInput
              style={styles.input}
              value={radiusMeters}
              onChangeText={setRadiusMeters}
              placeholder="Contoh: 100"
              keyboardType="number-pad"
              editable={!saving}
            />

            {/* Input Deskripsi */}
            <Text style={styles.label}>Deskripsi Laboratorium (Opsional):</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Keterangan lab..."
              multiline
              numberOfLines={3}
              editable={!saving}
            />

            {/* Tombol Aksi Simpan */}
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={onClose}
                disabled={saving}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelBtnText}>Batal</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
                onPress={handleSave}
                disabled={saving}
                activeOpacity={0.8}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveBtnText}>Simpan Perubahan</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    maxHeight: '85%',
    padding: 20,
    elevation: 8,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#4B5563',
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  formContainer: {
    paddingTop: 16,
    paddingBottom: 8,
  },
  gpsAutoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 8,
    paddingVertical: 10,
    marginBottom: 16,
  },
  gpsAutoBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111827',
    marginBottom: 12,
  },
  textArea: {
    height: 70,
    textAlignVertical: 'top',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 8,
  },
  cancelBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4B5563',
  },
  saveBtn: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default EditLabLocationModal;
