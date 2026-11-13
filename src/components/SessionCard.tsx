import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { RoleType, SessionItem, SessionStatus } from '../types';

interface SessionCardProps {
  session: SessionItem;
  currentRole: RoleType;
  onSelectSession?: (session: SessionItem, currentRole: RoleType) => void;
}

interface StatusBadgeConfig {
  label: string;
  backgroundColor: string;
  textColor: string;
  borderColor: string;
}

const STATUS_CONFIG: Record<SessionStatus, StatusBadgeConfig> = {
  BELUM_DIBUKA: {
    label: 'BELUM DIBUKA',
    backgroundColor: '#FEF3C7', // Kuning / oranye
    textColor: '#D97706',
    borderColor: '#FDE68A',
  },
  BERJALAN: {
    label: 'BERJALAN',
    backgroundColor: '#DCFCE7', // Hijau
    textColor: '#15803D',
    borderColor: '#BBF7D0',
  },
  SELESAI: {
    label: 'SELESAI',
    backgroundColor: '#FEE2E2', // Merah
    textColor: '#DC2626',
    borderColor: '#FECACA',
  },
};

export const SessionCard: React.FC<SessionCardProps> = ({
  session,
  currentRole,
  onSelectSession,
}) => {
  const statusConfig = STATUS_CONFIG[session.status] || STATUS_CONFIG.BELUM_DIBUKA;

  return (
    <View style={styles.card}>
      {/* Baris Atas: Nama Matkul di kiri, Badge Status di kanan */}
      <View style={styles.topRow}>
        <Text style={styles.courseTitle} numberOfLines={2}>
          {session.courseTitle}
        </Text>
        <View
          style={[
            styles.badge,
            {
              backgroundColor: statusConfig.backgroundColor,
              borderColor: statusConfig.borderColor,
            },
          ]}
        >
          <Text style={[styles.badgeText, { color: statusConfig.textColor }]}>
            {statusConfig.label}
          </Text>
        </View>
      </View>

      {/* Topik / Modul */}
      <Text style={styles.moduleName}>{session.moduleName}</Text>

      {/* Garis Pemisah Tipis */}
      <View style={styles.divider} />

      {/* Info Detail: Kelas & Ruangan, Waktu Pelaksanaan */}
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Kelas & Ruang:</Text>
        <Text style={styles.infoValue}>
          {session.classGroup} - {session.roomName}
        </Text>
      </View>

      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Waktu:</Text>
        <Text style={styles.infoValue}>{session.timeSlot}</Text>
      </View>

      {/* Tombol Aksi Interaktif */}
      <TouchableOpacity
        style={styles.actionButton}
        activeOpacity={0.8}
        onPress={() => onSelectSession?.(session, currentRole)}
      >
        <Text style={styles.actionButtonText}>Buka Detail Sesi</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  courseTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    flex: 1,
    marginRight: 8,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  moduleName: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 12,
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  infoLabel: {
    fontSize: 13,
    color: '#6B7280',
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '500',
    color: '#1F2937',
  },
  actionButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
});

export default SessionCard;
