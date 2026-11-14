import React from 'react';
import { Stack, router } from 'expo-router';
import LeaveRequestFormScreen from '../screens/LeaveRequestFormScreen';

export default function LeaveRequestFormRoute() {
  return (
    <>
      <Stack.Screen options={{ title: 'Pengajuan Izin', headerShown: false }} />
      <LeaveRequestFormScreen
        onBack={() => router.back()}
        onSuccessNavigate={() => router.replace('/my-leave-requests')}
      />
    </>
  );
}

