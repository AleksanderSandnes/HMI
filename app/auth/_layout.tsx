import { StatusBar } from 'expo-status-bar';
import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <>
      <StatusBar style="light" backgroundColor="#070b16" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#070b16' },
        }}
      >
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
      </Stack>
    </>
  );
}
