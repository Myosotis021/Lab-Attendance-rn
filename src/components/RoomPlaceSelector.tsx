import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import {
  PREDEFINED_LABS,
  findPredefinedLabByName,
  isOnlineRoom,
} from '../data/labLocations';
import { SessionType } from '../types/models';
import { theme } from '../theme';

type PlaceMode = 'LAB' | 'ONLINE' | 'CUSTOM';

export interface RoomPlaceSelectorProps {
  value: string;
  onChange: (roomName: string, sessionType: SessionType) => void;
  disabled?: boolean;
  error?: string;
}

export const RoomPlaceSelector: React.FC<RoomPlaceSelectorProps> = ({
  value,
  onChange,
  disabled = false,
  error,
}) => {
  const [forceCustom, setForceCustom] = useState<boolean>(false);
  const [prevValue, setPrevValue] = useState<string>(value);
  const [customDraft, setCustomDraft] = useState<string>(() =>
    !isOnlineRoom(value) && !findPredefinedLabByName(value) ? value : ''
  );

  // Sync jika value berubah dari luar (misal pilih kelas acuan)
  if (value !== prevValue) {
    setPrevValue(value);
    if (isOnlineRoom(value) || findPredefinedLabByName(value)) {
      setForceCustom(false);
    } else if (value.trim().length > 0) {
      setCustomDraft(value);
    }
  }

  const matchedLab = findPredefinedLabByName(value);
  const isOnline = isOnlineRoom(value);
  const mode: PlaceMode = forceCustom
    ? 'CUSTOM'
    : isOnline
    ? 'ONLINE'
    : matchedLab
    ? 'LAB'
    : value.trim().length > 0
    ? 'CUSTOM'
    : 'LAB';

  const handleSelectLab = (labName: string) => {
    if (disabled) return;
    setForceCustom(false);
    onChange(labName, 'OFFLINE');
  };

  const handleSelectOnline = () => {
    if (disabled) return;
    setForceCustom(false);
    onChange('Online', 'ONLINE');
  };

  const handleSelectCustom = () => {
    if (disabled) return;
    setForceCustom(true);
    onChange(customDraft.trim(), 'OFFLINE');
  };

  const handleCustomTextChange = (text: string) => {
    setForceCustom(true);
    setCustomDraft(text);
    onChange(text, 'OFFLINE');
  };

  return (
    <View style={styles.container}>
      <View style={styles.chipGrid}>
        {PREDEFINED_LABS.map((lab) => {
          const selected =
            mode === 'LAB' &&
            value.trim().toLowerCase() === lab.name.toLowerCase();
          return (
            <TouchableOpacity
              key={lab.id}
              style={[
                styles.chip,
                selected && styles.chipSelected,
                disabled && styles.chipDisabled,
              ]}
              onPress={() => handleSelectLab(lab.name)}
              disabled={disabled}
              activeOpacity={0.75}
            >
              <Feather
                name="map-pin"
                size={12}
                color={selected ? '#FFFFFF' : theme.colors.textSecondary}
              />
              <Text
                style={[styles.chipText, selected && styles.chipTextSelected]}
              >
                {lab.name}
              </Text>
            </TouchableOpacity>
          );
        })}

        <TouchableOpacity
          style={[
            styles.chip,
            mode === 'ONLINE' && styles.chipOnlineSelected,
            disabled && styles.chipDisabled,
          ]}
          onPress={handleSelectOnline}
          disabled={disabled}
          activeOpacity={0.75}
        >
          <Feather
            name="wifi"
            size={12}
            color={mode === 'ONLINE' ? '#FFFFFF' : '#2563EB'}
          />
          <Text
            style={[
              styles.chipText,
              { color: '#2563EB' },
              mode === 'ONLINE' && styles.chipTextSelected,
            ]}
          >
            Online
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.chip,
            mode === 'CUSTOM' && styles.chipSelected,
            disabled && styles.chipDisabled,
          ]}
          onPress={handleSelectCustom}
          disabled={disabled}
          activeOpacity={0.75}
        >
          <Feather
            name="edit-3"
            size={12}
            color={mode === 'CUSTOM' ? '#FFFFFF' : theme.colors.textSecondary}
          />
          <Text
            style={[
              styles.chipText,
              mode === 'CUSTOM' && styles.chipTextSelected,
            ]}
          >
            Lainnya
          </Text>
        </TouchableOpacity>
      </View>

      {mode === 'CUSTOM' && (
        <TextInput
          style={[styles.input, error ? styles.inputError : null]}
          placeholder="Isi nama tempat lainnya (contoh: Ruang E201)"
          placeholderTextColor={theme.colors.textMuted}
          value={customDraft}
          onChangeText={handleCustomTextChange}
          editable={!disabled}
        />
      )}

      {mode === 'LAB' && matchedLab && (
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            Koordinat {matchedLab.name}: {matchedLab.latitude},{' '}
            {matchedLab.longitude} • Wajib berada dalam radius 150 m saat sesi dimulai.
          </Text>
        </View>
      )}

      {mode === 'ONLINE' && (
        <View style={[styles.infoBox, styles.infoBoxOnline]}>
          <Text style={styles.infoTextOnline}>
            Mode Online: QR Code akan dibuat saat sesi dibuka. Lokasi Asprak &
            Praktikan tidak dilacak.
          </Text>
        </View>
      )}

      {mode === 'CUSTOM' && (
        <View style={[styles.infoBox, styles.infoBoxCustom]}>
          <Text style={styles.infoTextCustom}>
            Tempat Lainnya: Praktikan hanya dapat absen dalam radius maks. 150 m
            dari posisi device Asprak saat sesi dibuka.
          </Text>
        </View>
      )}

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surfaceSubtle,
  },
  chipSelected: {
    backgroundColor: theme.colors.textPrimary,
    borderColor: theme.colors.textPrimary,
  },
  chipOnlineSelected: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  chipDisabled: {
    opacity: 0.6,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  chipTextSelected: {
    color: '#FFFFFF',
  },
  input: {
    backgroundColor: theme.colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 13,
    color: theme.colors.textPrimary,
  },
  inputError: {
    borderColor: '#EF4444',
  },
  infoBox: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 9,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  infoText: {
    fontSize: 11,
    color: '#374151',
    lineHeight: 16,
  },
  infoBoxOnline: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  infoTextOnline: {
    fontSize: 11,
    color: '#1D4ED8',
    lineHeight: 16,
    fontWeight: '600',
  },
  infoBoxCustom: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
  },
  infoTextCustom: {
    fontSize: 11,
    color: '#92400E',
    lineHeight: 16,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 11,
    color: '#EF4444',
  },
});

export default RoomPlaceSelector;
