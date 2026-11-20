import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../theme';

export default function AboutScreen() {
  return (
    <LinearGradient colors={theme.colors.backgroundGradient} style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Lab Attendance App</Text>
        <Text style={styles.text}>Sistem Presensi Praktikum Laboratorium</Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl,
    padding: 24,
    alignItems: 'center',
    ...theme.shadows.card,
    width: '100%',
    maxWidth: 340,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.textPrimary,
    marginBottom: 6,
  },
  text: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
});
