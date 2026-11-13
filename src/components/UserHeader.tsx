import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { UserProfile } from '../types/models';

interface UserHeaderProps {
  profile: UserProfile | null;
}

export const UserHeader: React.FC<UserHeaderProps> = ({ profile }) => {
  if (!profile) return null;

  const isAssistant = profile.role === 'asisten';

  return (
    <View style={styles.container}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {profile.name ? profile.name.charAt(0).toUpperCase() : '?'}
        </Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.name}>{profile.name}</Text>
        <Text style={styles.identifier}>
          {isAssistant ? `ID: ${profile.identifier || 'AST-01'}` : `NIM: ${profile.nim || profile.identifier || '220101001'}`}
        </Text>
      </View>
      <View style={[styles.badge, isAssistant ? styles.assistantBadge : styles.studentBadge]}>
        <Text style={[styles.badgeText, isAssistant ? styles.assistantBadgeText : styles.studentBadgeText]}>
          {isAssistant ? 'Asisten' : 'Praktikan'}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#4F46E5',
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  identifier: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  assistantBadge: {
    backgroundColor: '#E0E7FF',
  },
  assistantBadgeText: {
    color: '#3730A3',
    fontSize: 12,
    fontWeight: '600',
  },
  studentBadge: {
    backgroundColor: '#DCFCE7',
  },
  studentBadgeText: {
    color: '#166534',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default UserHeader;
