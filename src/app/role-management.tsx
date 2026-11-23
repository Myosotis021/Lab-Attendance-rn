import React from 'react';
import { Stack } from 'expo-router';
import { RoleManagementScreen } from '../screens/RoleManagementScreen';

export default function RoleManagementRoute() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false, title: 'Kelola Peran' }} />
      <RoleManagementScreen />
    </>
  );
}
