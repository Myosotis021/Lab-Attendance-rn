import React from 'react';
import { Stack } from 'expo-router';
import ScheduleListScreen from '../screens/ScheduleListScreen';

export default function Index() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ScheduleListScreen />
    </>
  );
}
