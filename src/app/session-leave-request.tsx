import React from 'react';
import { useRouter } from 'expo-router';
import { LeaveRequestFormScreen } from '../screens/LeaveRequestFormScreen';

export default function SessionLeaveRequestRoute() {
  const router = useRouter();

  return (
    <LeaveRequestFormScreen
      onBack={() => {
        if (router.canGoBack()) {
          router.back();
        } else {
          router.replace('/');
        }
      }}
      onSuccessNavigate={() => {
        router.replace('/my-leave-requests' as any);
      }}
    />
  );
}
