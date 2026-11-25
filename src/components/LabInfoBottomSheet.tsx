import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
} from 'react-native';
import { LabLocation, SessionItem } from '../types/models';

export interface LabInfoBottomSheetProps {
  visible: boolean;
  lab: LabLocation | null;
  currentSession: SessionItem | null;
  nextSession: SessionItem | null;
  userDistanceMeters?: number | null;
  onClose: () => void;
  onNavigateToAttendance?: (session: SessionItem) => void;
}

export const LabInfoBottomSheet: React.FC<LabInfoBottomSheetProps> = ({
  visible,
  lab,
  currentSession,
  nextSession,
  userDistanceMeters,
  onClose,
  onNavigateToAttendance,
}) => {
  if (!lab) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity
          style={styles.backdropTouch}
          activeOpacity={1}
          onPress={onClose}
        />

        <View style={styles.sheetContainer}>
          {/* Handle Bar */}
          <View style={styles.handleBar} />

          {/* Header Lab Info */}
          <View style={styles.headerRow}>
            <View style={styles.labInfoText}>
              <Text style={styles.labName}>{lab.name}</Text>
              <Text style={styles.labBuilding}>{lab.building}</Text>
            </View>
            <TouchableOpacity
              style={styles.closeIconButton}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Text style={{ fontSize: 16, color: '#4B5563', fontWeight: '700' }}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Meta Lokasi Lab */}
            <View style={styles.metaBox}>
              <View style={styles.metaItem}>
                <Text style={{ fontSize: 14 }}>🛡️</Text>
                <Text style={styles.metaText}>
                  Radius Presensi: <Text style={styles.bold}>{lab.radiusMeters} m</Text>
                </Text>
              </View>
              {typeof userDistanceMeters === 'number' && (
                <View style={styles.metaItem}>
                  <Text style={{ fontSize: 14 }}>🧭</Text>
                  <Text style={styles.metaText}>
                    Jarak dari Anda: <Text style={styles.bold}>{userDistanceMeters} m</Text>
                  </Text>
                </View>
              )}
              {Boolean(lab.description) && (
                <View style={[styles.metaItem, { alignItems: 'flex-start' }]}>
                  <Text style={{ fontSize: 14, marginTop: 1 }}>ℹ️</Text>
                  <Text style={styles.metaText}>{lab.description}</Text>
                </View>
              )}
            </View>

            {/* Sesi Berlangsung Sekarang */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeaderRow}>
                <View style={styles.sectionHeaderTitle}>
                  <View style={[styles.dotIndicator, { backgroundColor: '#16A34A' }]} />
                  <Text style={styles.sectionTitle}>Sesi Berlangsung Sekarang</Text>
                </View>
                {currentSession && (
                  <View style={styles.badgeActive}>
                    <Text style={styles.badgeActiveText}>BERJALAN</Text>
                  </View>
                )}
              </View>

              {currentSession ? (
                <View style={styles.sessionBox}>
                  <Text style={styles.sessionCourse}>
                    {currentSession.courseTitle}
                  </Text>
                  <Text style={styles.sessionModule}>
                    {currentSession.moduleName}
                  </Text>
                  <View style={styles.sessionDetailsRow}>
                    <Text style={styles.sessionDetailItem}>
                      👥 {currentSession.classGroup}
                    </Text>
                    <Text style={styles.sessionDetailItem}>
                      ⏰ {currentSession.timeSlot}
                    </Text>
                  </View>

                  {onNavigateToAttendance && (
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => onNavigateToAttendance(currentSession)}
                      activeOpacity={0.8}
                    >
                      <Text style={{ color: '#FFFFFF', fontWeight: '800' }}>✓</Text>
                      <Text style={styles.actionButtonText}>
                        Presensi Sesi Ini
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              ) : (
                <View style={styles.emptySessionBox}>
                  <Text style={{ fontSize: 24 }}>☕</Text>
                  <Text style={styles.emptySessionText}>
                    Tidak ada sesi praktikum aktif saat ini.
                  </Text>
                </View>
              )}
            </View>

            {/* Praktikum Berikutnya */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeaderRow}>
                <View style={styles.sectionHeaderTitle}>
                  <View style={[styles.dotIndicator, { backgroundColor: '#F59E0B' }]} />
                  <Text style={styles.sectionTitle}>Praktikum Berikutnya</Text>
                </View>
                {nextSession && (
                  <View style={styles.badgeUpcoming}>
                    <Text style={styles.badgeUpcomingText}>BELUM DIBUKA</Text>
                  </View>
                )}
              </View>

              {nextSession ? (
                <View style={styles.sessionBox}>
                  <Text style={styles.sessionCourse}>
                    {nextSession.courseTitle}
                  </Text>
                  <Text style={styles.sessionModule}>
                    {nextSession.moduleName}
                  </Text>
                  <View style={styles.sessionDetailsRow}>
                    <Text style={styles.sessionDetailItem}>
                      👥 {nextSession.classGroup}
                    </Text>
                    <Text style={styles.sessionDetailItem}>
                      ⏰ {nextSession.timeSlot}
                    </Text>
                  </View>
                </View>
              ) : (
                <View style={styles.emptySessionBox}>
                  <Text style={{ fontSize: 24 }}>📅</Text>
                  <Text style={styles.emptySessionText}>
                    Tidak ada jadwal sesi berikutnya untuk lab ini.
                  </Text>
                </View>
              )}
            </View>

            {/* Tombol Tutup */}
            <TouchableOpacity
              style={styles.closeFullButton}
              onPress={onClose}
              activeOpacity={0.8}
            >
              <Text style={styles.closeFullButtonText}>Tutup</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  backdropTouch: {
    flex: 1,
  },
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 12,
    paddingHorizontal: 20,
    paddingBottom: 28,
    maxHeight: '80%',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  handleBar: {
    width: 44,
    height: 5,
    backgroundColor: '#D1D5DB',
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  labInfoText: {
    flex: 1,
  },
  labName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
  },
  labBuilding: {
    fontSize: 13,
    color: '#4B5563',
    marginTop: 2,
  },
  closeIconButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  scrollContent: {
    paddingBottom: 16,
  },
  metaBox: {
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 12,
    gap: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaText: {
    fontSize: 13,
    color: '#374151',
    flex: 1,
  },
  bold: {
    fontWeight: '700',
    color: '#111827',
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 14,
    marginBottom: 14,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionHeaderTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dotIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
  },
  badgeActive: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  badgeActiveText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#15803D',
  },
  badgeUpcoming: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  badgeUpcomingText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#B45309',
  },
  sessionBox: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
  },
  sessionCourse: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  sessionModule: {
    fontSize: 13,
    color: '#4B5563',
    marginTop: 2,
    marginBottom: 8,
  },
  sessionDetailsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 10,
  },
  sessionDetailItem: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
    marginTop: 4,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  emptySessionBox: {
    alignItems: 'center',
    paddingVertical: 16,
    gap: 6,
  },
  emptySessionText: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
  },
  closeFullButton: {
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 6,
  },
  closeFullButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
  },
});

export default LabInfoBottomSheet;
