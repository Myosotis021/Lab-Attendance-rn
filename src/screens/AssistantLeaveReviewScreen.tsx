import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  RefreshControl,
  Alert,
} from 'react-native';
import useAuth from '../hooks/useAuth';
import useAllLeaveRequests from '../hooks/useAllLeaveRequests';
import { decideLeaveRequest } from '../services/leaveService';
import { LeaveRequest } from '../types/models';
import LeaveRequestCard from '../components/LeaveRequestCard';
import UserHeader from '../components/UserHeader';
import ConfirmModal from '../components/ConfirmModal';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import { getErrorMessage } from '../utils/errors';

interface AssistantLeaveReviewScreenProps {
  onBack?: () => void;
}

export const AssistantLeaveReviewScreen: React.FC<AssistantLeaveReviewScreenProps> = ({
  onBack,
}) => {
  const { profile } = useAuth('asisten');
  const { requests, loading, error, retry } = useAllLeaveRequests();

  // Tab filter: 'MENUNGGU' (default) vs 'SEMUA'
  const [activeTab, setActiveTab] = useState<'MENUNGGU' | 'SEMUA'>('MENUNGGU');

  // Decision Modal State
  const [confirmModalVisible, setConfirmModalVisible] = useState<boolean>(false);
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
  const [pendingDecision, setPendingDecision] = useState<'DITERIMA' | 'DITOLAK' | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [isDeciding, setIsDeciding] = useState<boolean>(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const filteredRequests = requests.filter((r) => {
    if (activeTab === 'MENUNGGU') {
      return r.status === 'MENUNGGU';
    }
    return true;
  });

  const handleNoteChange = (requestId: string, text: string) => {
    setNotes((prev) => ({
      ...prev,
      [requestId]: text,
    }));
  };

  const handleOpenDecisionModal = (
    request: LeaveRequest,
    decision: 'DITERIMA' | 'DITOLAK'
  ) => {
    setSelectedRequest(request);
    setPendingDecision(decision);
    setConfirmModalVisible(true);
    setActionError(null);
  };

  const handleConfirmDecision = async () => {
    if (!selectedRequest || !pendingDecision) return;

    setIsDeciding(true);
    setActionError(null);

    const note = notes[selectedRequest.id] || '';

    try {
      await decideLeaveRequest(
        selectedRequest.id,
        pendingDecision,
        profile.uid,
        note
      );
      setConfirmModalVisible(false);
      setSelectedRequest(null);
      setPendingDecision(null);
    } catch (err: any) {
      const msg = getErrorMessage(err);
      setActionError(msg);
      Alert.alert('Gagal Memperbarui Status', msg);
    } finally {
      setIsDeciding(false);
    }
  };

  const renderCardActions = (item: LeaveRequest) => {
    if (item.status !== 'MENUNGGU') return null;

    const currentNote = notes[item.id] || '';

    return (
      <View style={styles.actionBlock}>
        <Text style={styles.noteLabel}>Catatan Asisten (Opsional):</Text>
        <TextInput
          style={styles.noteInput}
          placeholder="Tulis catatan atau alasan keputusan..."
          placeholderTextColor="#9CA3AF"
          value={currentNote}
          onChangeText={(txt) => handleNoteChange(item.id, txt)}
        />
        <View style={styles.decisionButtonsRow}>
          <TouchableOpacity
            style={[styles.rejectButton, isDeciding && styles.buttonDisabled]}
            onPress={() => handleOpenDecisionModal(item, 'DITOLAK')}
            disabled={isDeciding}
            activeOpacity={0.8}
          >
            <Text style={styles.rejectButtonText}>✕ Tolak</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.acceptButton, isDeciding && styles.buttonDisabled]}
            onPress={() => handleOpenDecisionModal(item, 'DITERIMA')}
            disabled={isDeciding}
            activeOpacity={0.8}
          >
            <Text style={styles.acceptButtonText}>✓ Terima</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.headerRow}>
        {onBack && (
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Kembali</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.pageTitle}>Review Izin Praktikan</Text>
      </View>

      {/* User Header */}
      <UserHeader profile={profile} />

      {/* Filter Tabs (SRS-15: Menunggu (default) & Semua) */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabPill, activeTab === 'MENUNGGU' && styles.tabPillActive]}
          onPress={() => setActiveTab('MENUNGGU')}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'MENUNGGU' && styles.tabTextActive,
            ]}
          >
            Menunggu ({requests.filter((r) => r.status === 'MENUNGGU').length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabPill, activeTab === 'SEMUA' && styles.tabPillActive]}
          onPress={() => setActiveTab('SEMUA')}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'SEMUA' && styles.tabTextActive,
            ]}
          >
            Semua ({requests.length})
          </Text>
        </TouchableOpacity>
      </View>

      {actionError && (
        <View style={styles.actionErrorBox}>
          <Text style={styles.actionErrorText}>{actionError}</Text>
        </View>
      )}

      {/* Content Area */}
      {loading && requests.length === 0 ? (
        <LoadingState message="Memuat daftar pengajuan izin praktikan..." />
      ) : error ? (
        <ErrorState message={error} onRetry={retry} retryText="Coba Lagi" />
      ) : filteredRequests.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <Text style={styles.emptyIconText}>
              {activeTab === 'MENUNGGU' ? '🎉' : '📋'}
            </Text>
          </View>
          <Text style={styles.emptyTitle}>
            {activeTab === 'MENUNGGU'
              ? 'Tidak ada pengajuan yang menunggu'
              : 'Belum ada pengajuan izin'}
          </Text>
          <Text style={styles.emptySubtitle}>
            {activeTab === 'MENUNGGU'
              ? 'Seluruh permohonan izin praktikan telah selesai diproses.'
              : 'Belum ada praktikan yang mengirim pengajuan izin praktikum.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredRequests}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <LeaveRequestCard
              item={item}
              showStudentInfo={true}
              actions={renderCardActions(item)}
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={retry}
              colors={['#2563EB']}
            />
          }
        />
      )}

      {/* Decision Confirmation Modal (Sprint 1 ConfirmModal) */}
      <ConfirmModal
        visible={confirmModalVisible}
        title={
          pendingDecision === 'DITERIMA'
            ? 'Terima Pengajuan Izin?'
            : 'Tolak Pengajuan Izin?'
        }
        message={
          selectedRequest
            ? pendingDecision === 'DITERIMA'
              ? `Pengajuan izin dari ${selectedRequest.studentName} (${selectedRequest.courseTitle}) akan diterima.`
              : `Pengajuan izin dari ${selectedRequest.studentName} (${selectedRequest.courseTitle}) akan ditolak.`
            : ''
        }
        confirmText={
          pendingDecision === 'DITERIMA' ? 'Ya, Terima Izin' : 'Ya, Tolak Izin'
        }
        cancelText="Batal"
        confirmVariant={pendingDecision === 'DITERIMA' ? 'success' : 'danger'}
        onConfirm={handleConfirmDecision}
        onCancel={() => {
          if (!isDeciding) {
            setConfirmModalVisible(false);
            setSelectedRequest(null);
            setPendingDecision(null);
          }
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    padding: 16,
  },
  headerRow: {
    marginBottom: 12,
  },
  backButton: {
    paddingVertical: 6,
    marginBottom: 6,
  },
  backButtonText: {
    color: '#2563EB',
    fontSize: 14,
    fontWeight: '600',
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
  },
  tabContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  tabPill: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#E5E7EB',
  },
  tabPillActive: {
    backgroundColor: '#2563EB',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4B5563',
  },
  tabTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  actionErrorBox: {
    backgroundColor: '#FEE2E2',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  actionErrorText: {
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '600',
  },
  listContent: {
    paddingBottom: 24,
  },
  actionBlock: {
    gap: 8,
  },
  noteLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
  },
  noteInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: '#1F2937',
  },
  decisionButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  rejectButton: {
    flex: 1,
    backgroundColor: '#DC2626',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  acceptButton: {
    flex: 1,
    backgroundColor: '#16A34A',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    marginTop: 40,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyIconText: {
    fontSize: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default AssistantLeaveReviewScreen;
