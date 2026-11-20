import { StyleSheet, ViewStyle } from 'react-native';

export const theme = {
  colors: {
    // Screen Background Gradient: Abu-lavender lembut
    backgroundGradient: ['#E9E6EF', '#F3E9E6'] as const,
    backgroundSolid: '#EFEBF2',

    // Surfaces & Borders
    surface: '#FFFFFF',
    surfaceSubtle: '#F9FAFB',
    border: '#E5E7EB',
    borderLight: '#F3F4F6',
    borderDark: '#14142B',

    // Text
    textPrimary: '#14142B',
    textSecondary: '#6B7280',
    textMuted: '#9CA3AF',
    textLight: '#FFFFFF',

    // Primary Accents
    primary: '#14142B',
    primaryBlue: '#2563EB',

    // Hero Action Button (Orange Gradient)
    heroButton: ['#FFC15A', '#FF9F2E'] as const,

    // 2x2 Grid Tile Colors
    tiles: {
      navy: {
        bg: '#14142B',
        text: '#FFFFFF',
        icon: '#FFFFFF',
        badgeBg: 'rgba(255, 255, 255, 0.18)',
        badgeText: '#FFFFFF',
      },
      lavender: {
        gradient: ['#C9B8F5', '#9B8CF0'] as const,
        text: '#2D1B69',
        icon: '#2D1B69',
        badgeBg: 'rgba(255, 255, 255, 0.45)',
        badgeText: '#2D1B69',
      },
      mint: {
        gradient: ['#B5E8D5', '#8FD9BC'] as const,
        text: '#064E3B',
        icon: '#064E3B',
        badgeBg: 'rgba(255, 255, 255, 0.45)',
        badgeText: '#064E3B',
      },
      peach: {
        gradient: ['#FFD1C9', '#FFB8A8'] as const,
        text: '#7C2D12',
        icon: '#7C2D12',
        badgeBg: 'rgba(255, 255, 255, 0.45)',
        badgeText: '#7C2D12',
      },
    },

    // Status Badges (Pastel, Teks Lembut / Gelap)
    status: {
      belumDibuka: {
        bg: '#FEF3C7',
        text: '#92400E',
        border: '#FDE68A',
      },
      berjalan: {
        bg: '#DCFCE7',
        text: '#166534',
        border: '#BBF7D0',
      },
      selesai: {
        bg: '#FEE2E2',
        text: '#991B1B',
        border: '#FECACA',
      },
      hadir: {
        bg: '#DCFCE7',
        text: '#166534',
        border: '#BBF7D0',
      },
      izin: {
        bg: '#FEF3C7',
        text: '#92400E',
        border: '#FDE68A',
      },
      sakit: {
        bg: '#DBEAFE',
        text: '#1E40AF',
        border: '#BFDBFE',
      },
      pending: {
        bg: '#FEF3C7',
        text: '#92400E',
        border: '#FDE68A',
      },
      accepted: {
        bg: '#DCFCE7',
        text: '#166534',
        border: '#BBF7D0',
      },
      rejected: {
        bg: '#FEE2E2',
        text: '#991B1B',
        border: '#FECACA',
      },
    },
  },

  borderRadius: {
    xs: 8,
    sm: 12,
    md: 14,
    lg: 20,
    xl: 24,
    xxl: 28,
    full: 9999,
  },

  typography: {
    fontFamilyBold: 'PlusJakartaSans_700Bold',
    fontFamilySemiBold: 'PlusJakartaSans_600SemiBold',
    fontFamilyMedium: 'PlusJakartaSans_500Medium',
    fontFamilyRegular: 'PlusJakartaSans_400Regular',
  },

  shadows: {
    subtle: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.05,
      shadowRadius: 10,
      elevation: 2,
    } as ViewStyle,
    card: {
      shadowColor: '#14142B',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.06,
      shadowRadius: 14,
      elevation: 3,
    } as ViewStyle,
    header: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.05,
      shadowRadius: 12,
      elevation: 4,
    } as ViewStyle,
  },
};

export const commonStyles = StyleSheet.create({
  screenContainer: {
    flex: 1,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl,
    padding: 18,
    ...theme.shadows.card,
  },
  iconButtonSquare: {
    width: 44,
    height: 44,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    marginRight: 8,
  },
  pillTabActive: {
    borderColor: theme.colors.textPrimary,
    backgroundColor: theme.colors.surface,
  },
  pillTabText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  pillTabTextActive: {
    color: theme.colors.textPrimary,
    fontWeight: '700',
  },
  sectionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.textPrimary,
    letterSpacing: -0.3,
  },
  sectionLink: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.textMuted,
    letterSpacing: 0.5,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 14,
    height: 48,
    marginBottom: 14,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.textPrimary,
    marginLeft: 10,
  },
});
