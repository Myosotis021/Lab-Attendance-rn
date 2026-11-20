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
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import useAuth from '../hooks/useAuth';
import useAllLeaveRequests from '../hooks/useAllLeaveRequests';
import { decideLeaveRequest } from '../services/leaveService';
import { LeaveRequest } from '../types/models';
import LeaveRequestCard from '../components/LeaveRequestCard';
import ConfirmModal from '../components/ConfirmModal';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';
import { getErrorMessage } from '../utils/errors';
import { theme } from '../theme';

interface AssistantLeaveReviewScreenProps {
  onBack?: () => void;
}

export const AssistantLeaveReviewScreen: React.FC<AssistantLeaveReviewScreenProps> = ({
  onBack,
}) => {
  const router = useRouter();
  const { profile } = useAuth();
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

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  if (profile?.role !== 'asisten') {
    return (
      <LinearGradient colors={theme.colors.backgroundGradient} style={styles.flexOne}>
        <SafeAreaView style={styles.safeArea}>
          <ErrorState
            title="Akses Ditolak"
            message="Anda tidak memiliki izin untuk mengakses halaman ini. Halaman ini khusus untuk Asisten Laboratorium."
            onRetry={handleBack}
            retryText="Kembali"
          />
        </SafeAreaView>
      </LinearGradient>
    );
  }

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
          placeholderTextColor={theme.colors.textMuted}
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
            <Feather name="x" size={14} color="#DC2626" style={styles.btnIcon} />
            <Text style={styles.rejectButtonText}>Tolak</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.acceptButton, isDeciding && styles.buttonDisabled]}
            onPress={() => handleOpenDecisionModal(item, 'DITERIMA')}
            disabled={isDeciding}
            activeOpacity={0.8}
          >
            <Feather name="check" size={14} color="#FFFFFF" style={styles.btnIcon} />
            <Text style={styles.acceptButtonText}>Terima</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <LinearGradient colors={theme.colors.backgroundGradient} style={styles.flexOne}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <StatusBar style="dark" />

        {/* Top Header */}
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBack}
            activeOpacity={0.7}
          >
            <Feather name="arrow-left" size={20} color={theme.colors.textPrimary} />
          </TouchableOpacity>

          <View style={styles.headerTitleGroup}>
            <Text style={styles.screenTitle}>Review Izin</Text>
            <Text style={styles.screenSubtitle}>Pengajuan Ketidakhadiran Praktikan</Text>
          </View>
        </View>

        {/* Tab Filter Chips */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[
              styles.pillTab,
              activeTab === 'MENUNGGU' && styles.pillTabActive,
            ]}
            onPress={() => setActiveTab('MENUNGGU')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.pillTabText,
                activeTab === 'MENUNGGU' && styles.pillTabTextActive,
              ]}
            >
              Menunggu Review
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.pillTab,
              activeTab === 'SEMUA' && styles.pillTabActive,
            ]}
            onPress={() => setActiveTab('SEMUA')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.pillTabText,
                activeTab === 'SEMUA' && styles.pillTabTextActive,
              ]}
            >
              Semua Riwayat
            </Text>
          </TouchableOpacity>
        </View>

        {/* Error banner if action failed */}
        {actionError ? (
          <View style={styles.errorBannerWrap}>
            <Text style={styles.errorBannerText}>{actionError}</Text>
          </View>
        ) : null}

        {/* Main List */}
        {loading && requests.length === 0 ? (
          <LoadingState message="Memuat pengajuan izin praktikan..." />
        ) : error ? (
          <ErrorState message={error} onRetry={retry} retryText="Coba Lagi" />
        ) : filteredRequests.length === 0 ? (
          <View style={styles.emptyWrap}>
            <EmptyState
              message={
                activeTab === 'MENUNGGU'
                  ? 'Tidak Ada Pengajuan Menunggu'
                  : 'Belum Ada Pengajuan Izin'
              }
              description={
                activeTab === 'MENUNGGU'
                  ? 'Semua permohonan izin praktikan telah diputuskan atau belum ada yang diajukan.'
                  : 'Belum ada data pengajuan izin dari praktikan di laboratorium.'
              }
            />
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
                colors={[theme.colors.textPrimary]}
              />
            }
          />
        )}

        {/* Decision Confirmation Modal */}
        <ConfirmModal
          visible={confirmModalVisible}
          title={
            pendingDecision === 'DITERIMA'
              ? 'Terima Pengajuan Izin?'
              : 'Tolak Pengajuan Izin?'
          }
          message={
            selectedRequest
              ? `${
                  pendingDecision === 'DITERIMA'
                    ? 'Anda akan menyetujui izin untuk:'
                    : 'Anda akan menolak izin untuk:'
                } ${selectedRequest.studentName} (${selectedRequest.courseTitle})`
              : ''
          }
          confirmText={
            pendingDecision === 'DITERIMA' ? 'Ya, Terima' : 'Ya, Tolak'
          }
          confirmVariant={pendingDecision === 'DITERIMA' ? 'primary' : 'danger'}
          onConfirm={handleConfirmDecision}
          onCancel={() => {
            if (!isDeciding) {
              setConfirmModalVisible(false);
              setSelectedRequest(null);
              setPendingDecision(null);
            }
          }}
        />
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  flexOne: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.subtle,
  },
  headerTitleGroup: {
    marginLeft: 14,
    flex: 1,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: theme.colors.textPrimary,
    letterSpacing: -0.5,
  },
  screenSubtitle: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginTop: 1,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 14,
    gap: 8,
  },
  pillTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: 'transparent',
  },
  pillTabActive: {
    borderColor: theme.colors.textPrimary,
    backgroundColor: 'rgba(20, 20, 43, 0.04)',
  },
  pillTabText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  pillTabTextActive: {
    color: theme.colors.textPrimary,
    fontWeight: '800',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  emptyWrap: {
    paddingHorizontal: 16,
  },
  errorBannerWrap: {
    marginHorizontal: 16,
    marginBottom: 10,
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: theme.borderRadius.md,
    padding: 10,
  },
  errorBannerText: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '600',
  },
  actionBlock: {
    gap: 8,
  },
  noteLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.textMuted,
    textTransform: 'uppercase',
  },
  noteInput: {
    backgroundColor: theme.colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: theme.colors.textPrimary,
  },
  decisionButtonsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  rejectButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECACA',
    paddingVertical: 10,
    borderRadius: theme.borderRadius.md,
  },
  rejectButtonText: {
    color: '#DC2626',
    fontWeight: '700',
    fontSize: 13,
  },
  acceptButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.textPrimary,
    paddingVertical: 10,
    borderRadius: theme.borderRadius.md,
  },
  acceptButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  btnIcon: {
    marginRight: 4,
  },
});

export default AssistantLeaveReviewScreen;
