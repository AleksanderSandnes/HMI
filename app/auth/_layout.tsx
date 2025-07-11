import { StatusBar } from 'expo-status-bar';
import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <>
      <StatusBar style="light" backgroundColor="#1e3a8a" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#1e3a8a' },
        }}
      >
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
      </Stack>
    </>
  );
}
