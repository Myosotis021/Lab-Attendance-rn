import React from 'react';
import { Stack, useRouter } from 'expo-router';
import { ScheduleListScreen } from '../screens/ScheduleListScreen';
import { RoleType, SessionItem } from '../types';

export default function Index() {
  const router = useRouter();

  const handleSelectSession = (session: SessionItem, role: RoleType) => {
    if (role === 'asisten') {
      router.push({
        pathname: '/assistant-session',
        params: {
          id: session.id,
          courseTitle: session.courseTitle,
          moduleName: session.moduleName,
          classGroup: session.classGroup,
          roomName: session.roomName,
          timeSlot: session.timeSlot,
          status: session.status,
        },
      });
    } else {
      router.push({
        pathname: '/student-attendance',
        params: {
          id: session.id,
          courseTitle: session.courseTitle,
          moduleName: session.moduleName,
          classGroup: session.classGroup,
          roomName: session.roomName,
          timeSlot: session.timeSlot,
          status: session.status,
        },
      });
    }
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ScheduleListScreen onSelectSession={handleSelectSession} />
    </>
  );
}
