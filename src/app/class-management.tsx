import React from 'react';
import { Stack } from 'expo-router';
import { ClassManagementScreen } from '../screens/ClassManagementScreen';

export default function ClassManagementRoute() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false, title: 'Kelola Kelas' }} />
      <ClassManagementScreen />
    </>
  );
}
