import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { EmptyState } from '../components/EmptyState';
import { SessionCard } from '../components/SessionCard';
import { UserHeader } from '../components/UserHeader';
import { LoadingState } from '../components/LoadingState';
import { ErrorState } from '../components/ErrorState';
import { HamburgerMenu } from '../components/HamburgerMenu';
import { SessionItem, RoleType } from '../types/models';
import { useAuth } from '../hooks/useAuth';
import { useSessions } from '../hooks/useSessions';
import { theme } from '../theme';

interface ScheduleListScreenProps {
  onSelectSession?: (session: SessionItem, role: RoleType) => void;
}

type TabFilter = 'SEMUA' | 'BERJALAN' | 'BELUM_DIBUKA' | 'SELESAI';

export const ScheduleListScreen: React.FC<ScheduleListScreenProps> = ({
  onSelectSession,
}) => {
  const router = useRouter();
  const { profile, switchRole, logout } = useAuth();
  const { sessions, loading, error, refresh } = useSessions();
  const [activeTab, setActiveTab] = useState<TabFilter>('SEMUA');
  const [menuVisible, setMenuVisible] = useState(false);

  const isAsisten = profile.role === 'asisten';

  const handleSelectSession = (session: SessionItem, role: RoleType) => {
    if (onSelectSession) {
      onSelectSession(session, role);
    } else {
      if (role === 'asisten') {
        router.push({
          pathname: '/assistant-session',
          params: {
            id: session.id,
            courseTitle: session.courseTitle,
            moduleName: session.moduleName,
            classGroup: session.classGroup,
            roomName: session.roomName,
            timeSlot: session.timeSlot,
            status: session.status,
          },
        });
      } else {
        router.push({
          pathname: '/student-attendance',
          params: {
            id: session.id,
            courseTitle: session.courseTitle,
            moduleName: session.moduleName,
            classGroup: session.classGroup,
            roomName: session.roomName,
            timeSlot: session.timeSlot,
            status: session.status,
          },
        });
      }
    }
  };

  // Filtered sessions based on tab
  const filteredSessions = sessions.filter((s) => {
    if (activeTab === 'SEMUA') return true;
    return s.status === activeTab;
  });

  // Next Session for Hero Card
  const nextSession =
    sessions.find((s) => s.status === 'BERJALAN') ||
    sessions.find((s) => s.status === 'BELUM_DIBUKA') ||
    sessions[0] ||
    null;

  return (
    <LinearGradient
      colors={theme.colors.backgroundGradient}
      style={styles.gradientContainer}
    >
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        {/* Top Header Card */}
        <UserHeader
          profile={profile}
          onSwitchRole={(nextRole) => switchRole(nextRole)}
          onLogout={logout}
          onPressMenu={() => setMenuVisible(true)}
        />

        {/* Hamburger Menu Drawer */}
        <HamburgerMenu
          visible={menuVisible}
          onClose={() => setMenuVisible(false)}
        />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Section 1: Dashboard & Filter Pills */}
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitle}>Dashboard</Text>
            <TouchableOpacity onPress={refresh} activeOpacity={0.7}>
              <Text style={styles.sectionLink}>REFRESH »</Text>
            </TouchableOpacity>
          </View>

          {/* Outlined Pill Tabs */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.pillTabsContainer}
          >
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
                Semua Sesi
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.pillTab,
                activeTab === 'BERJALAN' && styles.pillTabActive,
              ]}
              onPress={() => setActiveTab('BERJALAN')}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.pillTabText,
                  activeTab === 'BERJALAN' && styles.pillTabTextActive,
                ]}
              >
                Sedang Berlangsung
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.pillTab,
                activeTab === 'BELUM_DIBUKA' && styles.pillTabActive,
              ]}
              onPress={() => setActiveTab('BELUM_DIBUKA')}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.pillTabText,
                  activeTab === 'BELUM_DIBUKA' && styles.pillTabTextActive,
                ]}
              >
                Belum Dibuka
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.pillTab,
                activeTab === 'SELESAI' && styles.pillTabActive,
              ]}
              onPress={() => setActiveTab('SELESAI')}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.pillTabText,
                  activeTab === 'SELESAI' && styles.pillTabTextActive,
                ]}
              >
                Selesai
              </Text>
            </TouchableOpacity>
          </ScrollView>

          {/* Hero Card: Sesi Berikutnya */}
          <View style={styles.heroCard}>
            {/* Decorative pastel circles/blobs in background */}
            <View style={styles.decorativeBlobContainer} pointerEvents="none">
              <View style={styles.decorativeBlob1} />
              <View style={styles.decorativeBlob2} />
              <View style={styles.decorativeBlob3} />
            </View>

            <View style={styles.heroContent}>
              <Text style={styles.heroSmallLabel}>Sesi berikutnya</Text>
              {nextSession ? (
                <>
                  <Text style={styles.heroTimeTitle}>
                    {nextSession.timeSlot}
                  </Text>
                  <Text style={styles.heroCourseTitle} numberOfLines={2}>
                    {nextSession.courseTitle}
                  </Text>
                  <Text style={styles.heroModuleSubtitle} numberOfLines={1}>
                    {nextSession.moduleName} • {nextSession.roomName}
                  </Text>
                </>
              ) : (
                <>
                  <Text style={styles.heroTimeTitle}>Tidak Ada Sesi</Text>
                  <Text style={styles.heroCourseTitle}>
                    Belum ada jadwal praktikum aktif
                  </Text>
                  <Text style={styles.heroModuleSubtitle}>
                    Semua sesi praktikum telah berakhir
                  </Text>
                </>
              )}

              {/* Orange Gradient Circular Arrow Button */}
              {nextSession && (
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => handleSelectSession(nextSession, profile.role)}
                  style={styles.heroActionButtonWrapper}
                >
                  <LinearGradient
                    colors={theme.colors.heroButton}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.heroActionButton}
                  >
                    <Feather name="arrow-right" size={20} color="#FFFFFF" />
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Section 2: Essentials / Menu Utama */}
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitle}>Essentials</Text>
            <Text style={styles.sectionLink}>MENU UTAMA »</Text>
          </View>

          {/* 2x2 Grid Tiles */}
          <View style={styles.gridContainer}>
            {isAsisten ? (
              // Asisten Menu Tiles
              <>
                {/* Tile 1: Navy - Kelola Kelas */}
                <TouchableOpacity
                  style={[styles.tileItem, { backgroundColor: theme.colors.tiles.navy.bg }]}
                  activeOpacity={0.85}
                  onPress={() => router.push('/class-management' as any)}
                >
                  <View style={styles.tileHeader}>
                    <Feather name="book" size={20} color={theme.colors.tiles.navy.icon} />
                    <View style={[styles.tileBadge, { backgroundColor: theme.colors.tiles.navy.badgeBg }]}>
                      <Feather name="arrow-up-right" size={13} color={theme.colors.tiles.navy.badgeText} />
                    </View>
                  </View>
                  <Text style={[styles.tileTitle, { color: theme.colors.tiles.navy.text }]}>
                    Kelola Kelas
                  </Text>
                </TouchableOpacity>

                {/* Tile 2: Lavender - Kelola Sesi */}
                <TouchableOpacity
                  style={styles.tileItem}
                  activeOpacity={0.85}
                  onPress={() => router.push('/session-management' as any)}
                >
                  <LinearGradient
                    colors={theme.colors.tiles.lavender.gradient}
                    style={styles.tileGradientFill}
                  >
                    <View style={styles.tileHeader}>
                      <Feather name="calendar" size={20} color={theme.colors.tiles.lavender.icon} />
                      <View style={[styles.tileBadge, { backgroundColor: theme.colors.tiles.lavender.badgeBg }]}>
                        <Feather name="arrow-up-right" size={13} color={theme.colors.tiles.lavender.badgeText} />
                      </View>
                    </View>
                    <Text style={[styles.tileTitle, { color: theme.colors.tiles.lavender.text }]}>
                      Kelola Sesi
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>

                {/* Tile 3: Mint - Review Izin (AI Powered) */}
                <TouchableOpacity
                  style={styles.tileItem}
                  activeOpacity={0.85}
                  onPress={() => router.push('/assistant-leave-review' as any)}
                >
                  <LinearGradient
                    colors={theme.colors.tiles.mint.gradient}
                    style={styles.tileGradientFill}
                  >
                    <View style={styles.tileHeader}>
                      <Feather name="check-circle" size={20} color={theme.colors.tiles.mint.icon} />
                      <View style={[styles.tileBadge, { backgroundColor: theme.colors.tiles.mint.badgeBg }]}>
                        <Feather name="arrow-up-right" size={13} color={theme.colors.tiles.mint.badgeText} />
                      </View>
                    </View>
                    <Text style={[styles.tileTitle, { color: theme.colors.tiles.mint.text }]}>
                      Review Izin
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>

                {/* Tile 4: Peach - Rekap & Presensi */}
                <TouchableOpacity
                  style={styles.tileItem}
                  activeOpacity={0.85}
                  onPress={() => {
                    if (nextSession) {
                      handleSelectSession(nextSession, profile.role);
                    } else {
                      router.push('/session-management' as any);
                    }
                  }}
                >
                  <LinearGradient
                    colors={theme.colors.tiles.peach.gradient}
                    style={styles.tileGradientFill}
                  >
                    <View style={styles.tileHeader}>
                      <Feather name="clipboard" size={20} color={theme.colors.tiles.peach.icon} />
                      <View style={[styles.tileBadge, { backgroundColor: theme.colors.tiles.peach.badgeBg }]}>
                        <Feather name="arrow-up-right" size={13} color={theme.colors.tiles.peach.badgeText} />
                      </View>
                    </View>
                    <Text style={[styles.tileTitle, { color: theme.colors.tiles.peach.text }]}>
                      Rekap Kehadiran
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </>
            ) : (
              // Praktikan Menu Tiles
              <>
                {/* Tile 1: Navy - Presensi Lab */}
                <TouchableOpacity
                  style={[styles.tileItem, { backgroundColor: theme.colors.tiles.navy.bg }]}
                  activeOpacity={0.85}
                  onPress={() => {
                    if (nextSession) {
                      handleSelectSession(nextSession, profile.role);
                    }
                  }}
                >
                  <View style={styles.tileHeader}>
                    <Feather name="check-square" size={20} color={theme.colors.tiles.navy.icon} />
                    <View style={[styles.tileBadge, { backgroundColor: theme.colors.tiles.navy.badgeBg }]}>
                      <Feather name="arrow-up-right" size={13} color={theme.colors.tiles.navy.badgeText} />
                    </View>
                  </View>
                  <Text style={[styles.tileTitle, { color: theme.colors.tiles.navy.text }]}>
                    Presensi Lab
                  </Text>
                </TouchableOpacity>

                {/* Tile 2: Lavender - Status Izin */}
                <TouchableOpacity
                  style={styles.tileItem}
                  activeOpacity={0.85}
                  onPress={() => router.push('/my-leave-requests' as any)}
                >
                  <LinearGradient
                    colors={theme.colors.tiles.lavender.gradient}
                    style={styles.tileGradientFill}
                  >
                    <View style={styles.tileHeader}>
                      <Feather name="file-text" size={20} color={theme.colors.tiles.lavender.icon} />
                      <View style={[styles.tileBadge, { backgroundColor: theme.colors.tiles.lavender.badgeBg }]}>
                        <Feather name="arrow-up-right" size={13} color={theme.colors.tiles.lavender.badgeText} />
                      </View>
                    </View>
                    <Text style={[styles.tileTitle, { color: theme.colors.tiles.lavender.text }]}>
                      Status Izin
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>

                {/* Tile 3: Mint - Ajukan Izin (AI Powered) */}
                <TouchableOpacity
                  style={styles.tileItem}
                  activeOpacity={0.85}
                  onPress={() => router.push('/leave-request-form' as any)}
                >
                  <LinearGradient
                    colors={theme.colors.tiles.mint.gradient}
                    style={styles.tileGradientFill}
                  >
                    <View style={styles.tileHeader}>
                      <Feather name="send" size={20} color={theme.colors.tiles.mint.icon} />
                      <View style={[styles.tileBadge, { backgroundColor: theme.colors.tiles.mint.badgeBg }]}>
                        <Feather name="arrow-up-right" size={13} color={theme.colors.tiles.mint.badgeText} />
                      </View>
                    </View>
                    <Text style={[styles.tileTitle, { color: theme.colors.tiles.mint.text }]}>
                      Ajukan Izin
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>

                {/* Tile 4: Peach - Jadwal Praktikum */}
                <TouchableOpacity
                  style={styles.tileItem}
                  activeOpacity={0.85}
                  onPress={() => setActiveTab('SEMUA')}
                >
                  <LinearGradient
                    colors={theme.colors.tiles.peach.gradient}
                    style={styles.tileGradientFill}
                  >
                    <View style={styles.tileHeader}>
                      <Feather name="clock" size={20} color={theme.colors.tiles.peach.icon} />
                      <View style={[styles.tileBadge, { backgroundColor: theme.colors.tiles.peach.badgeBg }]}>
                        <Feather name="arrow-up-right" size={13} color={theme.colors.tiles.peach.badgeText} />
                      </View>
                    </View>
                    <Text style={[styles.tileTitle, { color: theme.colors.tiles.peach.text }]}>
                      Jadwal Praktikum
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </>
            )}
          </View>

          {/* Section 3: Today / Jadwal Praktikum */}
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitle}>
              {isAsisten ? 'Semua Jadwal Praktikum' : 'Jadwal Hari Ini'}
            </Text>
            <Text style={styles.sectionLink}>
              {filteredSessions.length} SESI »
            </Text>
          </View>

          {/* Session Cards List */}
          {loading ? (
            <LoadingState message="Memuat jadwal praktikum real-time..." />
          ) : error ? (
            <ErrorState
              message={error}
              onRetry={refresh}
              retryText="Coba Muat Ulang"
            />
          ) : filteredSessions.length === 0 ? (
            <EmptyState
              message="Tidak Ada Jadwal Praktikum"
              description={
                isAsisten
                  ? 'Belum ada sesi praktikum yang cocok dengan filter. Silakan tambahkan melalui menu Kelola Sesi.'
                  : 'Belum ada sesi praktikum yang sesuai dengan filter saat ini.'
              }
            />
          ) : (
            filteredSessions.map((item) => (
              <SessionCard
                key={item.id}
                session={item}
                currentRole={profile.role}
                onSelectSession={handleSelectSession}
              />
            ))
          )}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradientContainer: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    marginTop: 6,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.textPrimary,
    letterSpacing: -0.3,
  },
  sectionLink: {
    fontSize: 11,
    fontWeight: '800',
    color: theme.colors.textMuted,
    letterSpacing: 0.5,
  },
  pillTabsContainer: {
    flexDirection: 'row',
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
  // Hero Card
  heroCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xxl,
    padding: 20,
    marginBottom: 18,
    position: 'relative',
    overflow: 'hidden',
    ...theme.shadows.card,
  },
  decorativeBlobContainer: {
    position: 'absolute',
    right: -20,
    top: -20,
    bottom: -20,
    width: 170,
  },
  decorativeBlob1: {
    position: 'absolute',
    right: 0,
    top: 10,
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: 'rgba(201, 184, 245, 0.28)',
  },
  decorativeBlob2: {
    position: 'absolute',
    right: 35,
    bottom: 10,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(181, 232, 213, 0.35)',
  },
  decorativeBlob3: {
    position: 'absolute',
    right: 70,
    top: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 209, 201, 0.35)',
  },
  heroContent: {
    zIndex: 2,
    maxWidth: '75%',
  },
  heroSmallLabel: {
    fontSize: 12,
    color: theme.colors.textMuted,
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'capitalize',
  },
  heroTimeTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: theme.colors.textPrimary,
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  heroCourseTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    lineHeight: 19,
  },
  heroModuleSubtitle: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
    marginBottom: 16,
  },
  heroActionButtonWrapper: {
    alignSelf: 'flex-start',
  },
  heroActionButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.subtle,
  },
  // 2x2 Grid Tiles
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 18,
  },
  tileItem: {
    width: '48%',
    height: 116,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    ...theme.shadows.card,
  },
  tileGradientFill: {
    flex: 1,
    padding: 14,
    justifyContent: 'space-between',
  },
  tileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    paddingBottom: 0,
  },
  tileBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileTitle: {
    fontSize: 14,
    fontWeight: '800',
    paddingHorizontal: 14,
    paddingBottom: 14,
  },
});

export default ScheduleListScreen;
