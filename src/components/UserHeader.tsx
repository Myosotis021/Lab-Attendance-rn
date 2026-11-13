import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { UserProfile } from '../types/models';

interface UserHeaderProps {
  profile: UserProfile;
  onSwitchRole?: (nextRole: 'asisten' | 'praktikan') => void;
}

export const UserHeader: React.FC<UserHeaderProps> = ({ profile, onSwitchRole }) => {
  const isAsisten = profile.role === 'asisten';

  const getInitials = (name: string) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const handleToggle = () => {
    if (onSwitchRole) {
      onSwitchRole(isAsisten ? 'praktikan' : 'asisten');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.leftRow}>
        <View style={[styles.avatar, isAsisten ? styles.avatarAsisten : styles.avatarPraktikan]}>
          <Text style={styles.avatarText}>{getInitials(profile.name)}</Text>
        </View>
        <View style={styles.infoCol}>
          <Text style={styles.userName} numberOfLines={1}>
            {profile.name}
          </Text>
          <Text style={styles.userSubtitle}>
            {isAsisten ? 'Asisten Laboratorium' : `NIM: ${profile.nim || '-'}`}
          </Text>
        </View>
      </View>

      <View style={styles.rightRow}>
        <View style={[styles.roleBadge, isAsisten ? styles.badgeAsisten : styles.badgePraktikan]}>
          <Text style={[styles.roleBadgeText, isAsisten ? styles.badgeTextAsisten : styles.badgeTextPraktikan]}>
            {isAsisten ? 'ASISTEN' : 'PRAKTIKAN'}
          </Text>
        </View>

        {onSwitchRole && (
          <TouchableOpacity
            style={styles.switchButton}
            onPress={handleToggle}
            activeOpacity={0.7}
          >
            <Text style={styles.switchButtonText}>Ganti Peran</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarAsisten: {
    backgroundColor: '#3B82F6',
  },
  avatarPraktikan: {
    backgroundColor: '#10B981',
  },
  avatarText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
  infoCol: {
    flex: 1,
  },
  userName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
  },
  userSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  rightRow: {
    alignItems: 'flex-end',
    marginLeft: 8,
  },
  roleBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
  },
  badgeAsisten: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  badgePraktikan: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  badgeTextAsisten: {
    color: '#1D4ED8',
  },
  badgeTextPraktikan: {
    color: '#047857',
  },
  switchButton: {
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  switchButtonText: {
    fontSize: 11,
    color: '#2563EB',
    textDecorationLine: 'underline',
  },
});

export default UserHeader;
