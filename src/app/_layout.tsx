import { Stack } from 'expo-router';
import { AuthProvider } from '../context/AuthContext';

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack>
        <Stack.Screen name="index" options={{ title: 'Home' }} />
        <Stack.Screen name="about" options={{ title: 'About' }} />
        <Stack.Screen name="login" options={{ title: 'Masuk' }} />
        <Stack.Screen name="register" options={{ title: 'Daftar' }} />
        <Stack.Screen
          name="student-attendance"
          options={{
            title: 'Presensi Praktikan',
            headerShown: false,
          }}
        />
      </Stack>
    </AuthProvider>
  );
}
