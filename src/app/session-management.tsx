import React from 'react';
import { Stack } from 'expo-router';
import { SessionManagementScreen } from '../screens/SessionManagementScreen';

export default function SessionManagementRoute() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false, title: 'Kelola Jadwal & Sesi' }} />
      <SessionManagementScreen />
    </>
  );
}
