import React from 'react';
import { Stack, router } from 'expo-router';
import MyLeaveRequestsScreen from '../screens/MyLeaveRequestsScreen';

export default function MyLeaveRequestsRoute() {
  return (
    <>
      <Stack.Screen options={{ title: 'Daftar Izin Saya', headerShown: false }} />
      <MyLeaveRequestsScreen
        onBack={() => router.back()}
        onNavigateToForm={() => router.push('/leave-request-form' as any)}
      />
    </>
  );
}

