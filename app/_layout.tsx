import { Stack } from 'expo-router/stack';

export const unstable_settings = {
    initialRouteName: "(tabs)",
};

export default function AppLayout() {
    return (
        <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
    );
}