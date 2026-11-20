import React from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ListRenderItem,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { AttendanceRecord, AttendanceStatus } from '../types';
import { formatAttendanceTime } from '../services/attendanceService';
import { Timestamp } from 'firebase/firestore';
import { theme } from '../theme';

export const INITIAL_ATTENDEES: AttendanceRecord[] = [
  {
    id: 'att-1',
    sessionId: 'ses-1',
    classId: 'cls-1',
    uid: 'mhs-220101001',
    studentName: 'Ahmad Fauzi',
    studentNim: '220101001',
    timestamp: '13:05:22 WIB',
    status: 'Hadir',
    notes: 'Meja PC-01',
    createdAt: Timestamp.now(),
  },
  {
    id: 'att-2',
    sessionId: 'ses-1',
    classId: 'cls-1',
    uid: 'mhs-220101015',
    studentName: 'Siti Rahma',
    studentNim: '220101015',
    timestamp: '13:08:45 WIB',
    status: 'Hadir',
    notes: 'Meja PC-02',
    createdAt: Timestamp.now(),
  },
  {
    id: 'att-3',
    sessionId: 'ses-1',
    classId: 'cls-1',
    uid: 'mhs-220101032',
    studentName: 'Dimas Pratama',
    studentNim: '220101032',
    timestamp: '13:12:10 WIB',
    status: 'Izin',
    notes: 'Sakit flu',
    createdAt: Timestamp.now(),
  },
];

export interface AttendanceRecapListProps {
  attendees: AttendanceRecord[];
  headerTitle?: string;
}

export const AttendanceRecapList: React.FC<AttendanceRecapListProps> = ({
  attendees,
  headerTitle = 'Rekapitulasi Kehadiran Praktikan',
}) => {
  const totalCount = attendees.length;
  const hadirCount = attendees.filter((a) => a.status === 'Hadir').length;
  const izinCount = attendees.filter((a) => a.status === 'Izin').length;
  const sakitCount = attendees.filter((a) => a.status === 'Sakit').length;

  const getStatusBadgeStyle = (status: AttendanceStatus) => {
    switch (status) {
      case 'Hadir':
        return {
          container: styles.badgeHadir,
          text: styles.badgeTextHadir,
        };
      case 'Izin':
        return {
          container: styles.badgeIzin,
          text: styles.badgeTextIzin,
        };
      case 'Sakit':
        return {
          container: styles.badgeSakit,
          text: styles.badgeTextSakit,
        };
      default:
        return {
          container: styles.badgeDefault,
          text: styles.badgeTextDefault,
        };
    }
  };

  const renderItem: ListRenderItem<AttendanceRecord> = ({ item, index }) => {
    const badge = getStatusBadgeStyle(item.status);
    const displayTime =
      item.timestamp || formatAttendanceTime(item.createdAt);

    return (
      <View style={styles.itemRow}>
        <View style={styles.indexCircle}>
          <Text style={styles.indexText}>{index + 1}</Text>
        </View>

        <View style={styles.itemInfo}>
          <Text style={styles.studentName} numberOfLines={1}>
            {item.studentName}
          </Text>
          <View style={styles.subInfoRow}>
            {item.studentNim ? (
              <Text style={styles.nimText}>NIM: {item.studentNim}</Text>
            ) : null}
            {item.notes ? (
              <Text style={styles.notesText}> • {item.notes}</Text>
            ) : null}
          </View>
        </View>

        <View style={styles.itemRight}>
          <View style={[styles.statusBadge, badge.container]}>
            <Text style={[styles.statusBadgeText, badge.text]}>
              {item.status.toUpperCase()}
            </Text>
          </View>
          <Text style={styles.timeText}>{displayTime}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.card}>
      {/* Header & Title */}
      <View style={styles.headerArea}>
        <Text style={styles.headerTitle}>{headerTitle}</Text>
        <Text style={styles.headerSubtitle}>Total {totalCount} Mahasiswa Hadir / Izin</Text>
      </View>

      {/* Summary Pills Grid */}
      <View style={styles.summaryRow}>
        <View style={[styles.summaryPill, styles.summaryPillHadir]}>
          <Text style={styles.summaryCountHadir}>{hadirCount}</Text>
          <Text style={styles.summaryLabelHadir}>Hadir</Text>
        </View>
        <View style={[styles.summaryPill, styles.summaryPillIzin]}>
          <Text style={styles.summaryCountIzin}>{izinCount}</Text>
          <Text style={styles.summaryLabelIzin}>Izin</Text>
        </View>
        <View style={[styles.summaryPill, styles.summaryPillSakit]}>
          <Text style={styles.summaryCountSakit}>{sakitCount}</Text>
          <Text style={styles.summaryLabelSakit}>Sakit</Text>
        </View>
      </View>

      {/* List or Empty */}
      {attendees.length === 0 ? (
        <View style={styles.emptyBox}>
          <Feather name="users" size={24} color={theme.colors.textMuted} />
          <Text style={styles.emptyText}>Belum ada presensi yang masuk</Text>
        </View>
      ) : (
        <FlatList
          data={attendees}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          scrollEnabled={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl,
    padding: 18,
    ...theme.shadows.card,
    marginBottom: 16,
  },
  headerArea: {
    marginBottom: 14,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  summaryPill: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    borderWidth: 1,
  },
  summaryPillHadir: {
    backgroundColor: theme.colors.status.hadir.bg,
    borderColor: theme.colors.status.hadir.border,
  },
  summaryCountHadir: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.colors.status.hadir.text,
  },
  summaryLabelHadir: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.status.hadir.text,
    textTransform: 'uppercase',
  },
  summaryPillIzin: {
    backgroundColor: theme.colors.status.izin.bg,
    borderColor: theme.colors.status.izin.border,
  },
  summaryCountIzin: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.colors.status.izin.text,
  },
  summaryLabelIzin: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.status.izin.text,
    textTransform: 'uppercase',
  },
  summaryPillSakit: {
    backgroundColor: theme.colors.status.sakit.bg,
    borderColor: theme.colors.status.sakit.border,
  },
  summaryCountSakit: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.colors.status.sakit.text,
  },
  summaryLabelSakit: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.status.sakit.text,
    textTransform: 'uppercase',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  indexCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  indexText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.textMuted,
  },
  itemInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  subInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  nimText: {
    fontSize: 11,
    color: theme.colors.textSecondary,
  },
  notesText: {
    fontSize: 11,
    color: theme.colors.textMuted,
  },
  itemRight: {
    alignItems: 'flex-end',
    marginLeft: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    marginBottom: 2,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  timeText: {
    fontSize: 10,
    color: theme.colors.textMuted,
  },
  badgeHadir: {
    backgroundColor: theme.colors.status.hadir.bg,
    borderColor: theme.colors.status.hadir.border,
  },
  badgeTextHadir: {
    color: theme.colors.status.hadir.text,
  },
  badgeIzin: {
    backgroundColor: theme.colors.status.izin.bg,
    borderColor: theme.colors.status.izin.border,
  },
  badgeTextIzin: {
    color: theme.colors.status.izin.text,
  },
  badgeSakit: {
    backgroundColor: theme.colors.status.sakit.bg,
    borderColor: theme.colors.status.sakit.border,
  },
  badgeTextSakit: {
    color: theme.colors.status.sakit.text,
  },
  badgeDefault: {
    backgroundColor: theme.colors.surfaceSubtle,
    borderColor: theme.colors.border,
  },
  badgeTextDefault: {
    color: theme.colors.textSecondary,
  },
  separator: {
    height: 1,
    backgroundColor: theme.colors.borderLight,
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  emptyText: {
    fontSize: 13,
    color: theme.colors.textMuted,
  },
});

export default AttendanceRecapList;
