import React from 'react';
import { Stack } from 'expo-router/stack';

const AppLayout: React.FC = () => {
    return (
        <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
    );
}

export default AppLayout;