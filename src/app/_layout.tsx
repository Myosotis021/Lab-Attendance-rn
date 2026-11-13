import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Home', headerShown: false }} />
      <Stack.Screen name="about" options={{ title: 'About' }} />
      <Stack.Screen
        name="assistant-session"
        options={{ title: 'Kelola Sesi Asisten', headerShown: false }}
      />
      <Stack.Screen
        name="student-attendance"
        options={{
          title: 'Presensi Praktikan',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="leave-request-form"
        options={{
          title: 'Pengajuan Izin',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="my-leave-requests"
        options={{
          title: 'Daftar Izin Saya',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="assistant-leave-review"
        options={{
          title: 'Review Izin Praktikan',
          headerShown: false,
        }}
      />
    </Stack>
  );
}
