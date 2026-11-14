import React from 'react';
import { Stack, router } from 'expo-router';
import AssistantLeaveReviewScreen from '../screens/AssistantLeaveReviewScreen';

export default function AssistantLeaveReviewRoute() {
  return (
    <>
      <Stack.Screen options={{ title: 'Review Izin Praktikan', headerShown: false }} />
      <AssistantLeaveReviewScreen onBack={() => router.back()} />
    </>
  );
}

