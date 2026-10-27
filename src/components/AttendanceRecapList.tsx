import React from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ListRenderItem,
} from 'react-native';
import { AttendanceRecord, AttendanceStatus } from '../types';

export const INITIAL_ATTENDEES: AttendanceRecord[] = [
  {
    id: 'att-1',
    studentName: 'Ahmad Fauzi',
    studentNim: '220101001',
    timestamp: '13:05:22 WIB',
    status: 'Hadir',
  },
  {
    id: 'att-2',
    studentName: 'Siti Rahma',
    studentNim: '220101015',
    timestamp: '13:08:45 WIB',
    status: 'Hadir',
  },
  {
    id: 'att-3',
    studentName: 'Dimas Pratama',
    studentNim: '220101032',
    timestamp: '13:12:10 WIB',
    status: 'Izin',
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
  // Count counts for summary
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

  const getInitials = (name: string) => {
    if (!name) return '??';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const renderItem: ListRenderItem<AttendanceRecord> = ({ item }) => {
    const badgeStyle = getStatusBadgeStyle(item.status);

    return (
      <View style={styles.recordCard}>
        <View style={styles.cardLeft}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{getInitials(item.studentName)}</Text>
          </View>
          <View style={styles.infoCol}>
            <Text style={styles.studentName} numberOfLines={1}>
              {item.studentName}
            </Text>
            <Text style={styles.studentNim}>NIM: {item.studentNim}</Text>
            <View style={styles.timeRow}>
              <Text style={styles.timeLabel}>Waktu:</Text>
              <Text style={styles.timeValue}>{item.timestamp}</Text>
            </View>
            {item.notes ? (
              <Text style={styles.notesText} numberOfLines={1}>
                Catatan: {item.notes}
              </Text>
            ) : null}
          </View>
        </View>

        <View style={[styles.badge, badgeStyle.container]}>
          <Text style={[styles.badgeText, badgeStyle.text]}>{item.status}</Text>
        </View>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconCircle}>
        <Text style={styles.emptyIconText}>📋</Text>
      </View>
      <Text style={styles.emptyTitle}>Data Masih Kosong</Text>
      <Text style={styles.emptyDescription}>
        Belum ada mahasiswa praktikan yang melakukan presensi pada sesi ini.
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Section Header & Summary */}
      <View style={styles.summaryContainer}>
        <View style={styles.titleRow}>
          <Text style={styles.sectionTitle}>{headerTitle}</Text>
        </View>

        {/* Highlighted headline according to SRS */}
        <View style={styles.headlineCard}>
          <Text style={styles.headlineText}>
            Total Mahasiswa Hadir: <Text style={styles.headlineHighlight}>{hadirCount} Mahasiswa</Text>
          </Text>
          <Text style={styles.headlineSub}>
            (Total Terdata: {totalCount} Mahasiswa)
          </Text>
        </View>

        {/* Breakdown chips */}
        <View style={styles.chipsRow}>
          <View style={[styles.chip, styles.chipHadir]}>
            <Text style={styles.chipTextHadir}>Hadir: {hadirCount}</Text>
          </View>
          <View style={[styles.chip, styles.chipIzin]}>
            <Text style={styles.chipTextIzin}>Izin: {izinCount}</Text>
          </View>
          <View style={[styles.chip, styles.chipSakit]}>
            <Text style={styles.chipTextSakit}>Sakit: {sakitCount}</Text>
          </View>
        </View>
      </View>

      {/* List or Empty State */}
      <FlatList
        data={attendees}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={
          attendees.length === 0 ? styles.emptyListContent : styles.listContent
        }
        scrollEnabled={false} // Nested inside screen ScrollView smoothly
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  summaryContainer: {
    marginBottom: 14,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  headlineCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    marginBottom: 8,
  },
  headlineText: {
    fontSize: 14,
    color: '#1E3A8A',
    fontWeight: '500',
  },
  headlineHighlight: {
    fontWeight: '700',
    color: '#1D4ED8',
  },
  headlineSub: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: 1,
  },
  chipHadir: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  chipTextHadir: {
    fontSize: 12,
    fontWeight: '600',
    color: '#15803D',
  },
  chipIzin: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  chipTextIzin: {
    fontSize: 12,
    fontWeight: '600',
    color: '#B45309',
  },
  chipSakit: {
    backgroundColor: '#EEF2FF',
    borderColor: '#C7D2FE',
  },
  chipTextSakit: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4338CA',
  },
  listContent: {
    paddingBottom: 20,
  },
  emptyListContent: {
    paddingVertical: 10,
  },
  recordCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
  },
  infoCol: {
    flex: 1,
  },
  studentName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 2,
  },
  studentNim: {
    fontSize: 12,
    color: '#4B5563',
    marginBottom: 2,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    marginRight: 4,
  },
  timeValue: {
    fontSize: 11,
    fontWeight: '500',
    color: '#6B7280',
  },
  notesText: {
    fontSize: 11,
    fontStyle: 'italic',
    color: '#6B7280',
    marginTop: 2,
  },
  badge: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  badgeHadir: {
    backgroundColor: '#DCFCE7',
    borderColor: '#86EFAC',
  },
  badgeTextHadir: {
    color: '#15803D',
  },
  badgeIzin: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FCD34D',
  },
  badgeTextIzin: {
    color: '#B45309',
  },
  badgeSakit: {
    backgroundColor: '#EEF2FF',
    borderColor: '#A5B4FC',
  },
  badgeTextSakit: {
    color: '#4338CA',
  },
  badgeDefault: {
    backgroundColor: '#F3F4F6',
    borderColor: '#E5E7EB',
  },
  badgeTextDefault: {
    color: '#6B7280',
  },
  emptyContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 32,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    marginVertical: 8,
  },
  emptyIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  emptyIconText: {
    fontSize: 24,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  emptyDescription: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default AttendanceRecapList;
