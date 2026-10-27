import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Role, SessionItem, SessionStatus } from '../data/schedules';

interface SessionCardProps {
  session: SessionItem;
  currentRole: Role;
  onSelectSession?: (session: SessionItem, currentRole: Role) => void;
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
  const statusConfig = STATUS_CONFIG[session.status];

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

export default SessionCard;

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 3,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  courseTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginRight: 8,
    lineHeight: 22,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  moduleName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563',
    marginTop: 6,
    marginBottom: 8,
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  infoLabel: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
    width: 100,
  },
  infoValue: {
    flex: 1,
    fontSize: 13,
    color: '#1F2937',
    fontWeight: '600',
  },
  actionButton: {
    backgroundColor: '#2563EB',
    borderRadius: 8,
    paddingVertical: 11,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
