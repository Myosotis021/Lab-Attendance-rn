import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { DUMMY_PROFILES, Role } from '../data/schedules';

interface RoleSwitcherProps {
  currentRole: Role;
  onRoleChange: (role: Role) => void;
}

export const RoleSwitcher: React.FC<RoleSwitcherProps> = ({
  currentRole,
  onRoleChange,
}) => {
  const profile = DUMMY_PROFILES[currentRole];

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.profileSection}>
          <View style={styles.badgeContainer}>
            <Text style={styles.badgeText}>{profile.roleLabel}</Text>
          </View>
          <Text style={styles.nameText}>{profile.name}</Text>
          <Text style={styles.identifierText}>
            {profile.identifierLabel}: {profile.identifierValue}
          </Text>
        </View>

        <View style={styles.toggleContainer}>
          <TouchableOpacity
            activeOpacity={0.8}
            style={[
              styles.toggleButton,
              currentRole === 'asisten' && styles.toggleButtonActive,
            ]}
            onPress={() => onRoleChange('asisten')}
          >
            <Text
              style={[
                styles.toggleText,
                currentRole === 'asisten' && styles.toggleTextActive,
              ]}
            >
              Asisten
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            style={[
              styles.toggleButton,
              currentRole === 'praktikan' && styles.toggleButtonActive,
            ]}
            onPress={() => onRoleChange('praktikan')}
          >
            <Text
              style={[
                styles.toggleText,
                currentRole === 'praktikan' && styles.toggleTextActive,
              ]}
            >
              Praktikan
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default RoleSwitcher;

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  profileSection: {
    flex: 1,
    marginRight: 12,
  },
  badgeContainer: {
    alignSelf: 'flex-start',
    backgroundColor: '#EFF6FF',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginBottom: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563EB',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  nameText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  identifierText: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
    fontWeight: '500',
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 24,
    padding: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  toggleButton: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  toggleButtonActive: {
    backgroundColor: '#2563EB',
    elevation: 2,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
  },
  toggleText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  toggleTextActive: {
    color: '#FFFFFF',
  },
});
