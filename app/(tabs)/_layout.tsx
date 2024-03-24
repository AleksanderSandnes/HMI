import React from 'react';
import { FontAwesome5, FontAwesome6 } from '@expo/vector-icons';
import { MaterialIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

const TabLayout: React.FC = () => {
    return (
        <Tabs screenOptions={{
            tabBarActiveTintColor: '#329932',
            tabBarInactiveTintColor: 'white',
            tabBarStyle: { backgroundColor: '#203864', borderTopWidth: 0 },
            headerShown: false,
        }}>
            <Tabs.Screen
                name="growatt"
                options={{
                    title: 'Growatt',
                    tabBarIcon: ({ color }: { color: string }) => <FontAwesome6 size={28} name="solar-panel" color={color} />,
                }}
            />
            <Tabs.Screen
                name="elhub"
                options={{
                    title: 'Elhub',
                    tabBarIcon: ({ color }: { color: string }) => <MaterialIcons size={28} name="electric-bolt" color={color} />,
                }}
            />
            <Tabs.Screen
                name="weatherStation"
                options={{
                    title: 'Weather Station',
                    tabBarIcon: ({ color }: { color: string }) => <FontAwesome5 size={28} name="cloud-sun" color={color} />,
                }}
            />
            <Tabs.Screen
                name="windTurbine"
                options={{
                    title: 'Wind Turbine',
                    tabBarIcon: ({ color }: { color: string }) => <FontAwesome6 size={28} name="wind" color={color} />,
                }}
            />
        </Tabs>
    );
}

export default TabLayout;