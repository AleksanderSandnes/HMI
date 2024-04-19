import React from 'react';
import { FontAwesome5, FontAwesome6, MaterialIcons } from '@expo/vector-icons';

import { Tabs } from 'expo-router';

function SolarPanelIcon({ color }: { color: string }) {
  return <FontAwesome6 size={28} name="solar-panel" color={color} />;
}

function ElectricBoltIcon({ color }: { color: string }) {
  return <MaterialIcons size={28} name="electric-bolt" color={color} />;
}

function CloudSunIcon({ color }: { color: string }) {
  return <FontAwesome5 size={28} name="cloud-sun" color={color} />;
}

function WindIcon({ color }: { color: string }) {
  return <FontAwesome6 size={28} name="wind" color={color} />;
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#329932',
        tabBarInactiveTintColor: 'white',
        tabBarStyle: { backgroundColor: '#203864', borderTopWidth: 0 },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Growatt',
          tabBarIcon: SolarPanelIcon,
        }}
      />
      <Tabs.Screen
        name="elhub"
        options={{
          title: 'Elhub',
          tabBarIcon: ElectricBoltIcon,
        }}
      />
      <Tabs.Screen
        name="weatherStation"
        options={{
          title: 'Weather Station',
          tabBarIcon: CloudSunIcon,
        }}
      />
      <Tabs.Screen
        name="windTurbine"
        options={{
          title: 'Wind Turbine',
          tabBarIcon: WindIcon,
        }}
      />
    </Tabs>
  );
}
