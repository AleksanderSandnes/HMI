import React from 'react';
import { FontAwesome5, FontAwesome6, MaterialIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useWindowDimensions } from 'react-native';

function SolarPanelIcon({ color }: { color: string }) {
  const windowDimensions = useWindowDimensions();
  const isMobile = windowDimensions.width <= 768;
  return (
    <FontAwesome6 size={isMobile ? 22 : 28} name="solar-panel" color={color} />
  );
}

function ElectricBoltIcon({ color }: { color: string }) {
  const windowDimensions = useWindowDimensions();
  const isMobile = windowDimensions.width <= 768;
  return (
    <MaterialIcons
      size={isMobile ? 22 : 28}
      name="electric-bolt"
      color={color}
    />
  );
}

function CloudSunIcon({ color }: { color: string }) {
  const windowDimensions = useWindowDimensions();
  const isMobile = windowDimensions.width <= 768;
  return (
    <FontAwesome5 size={isMobile ? 22 : 28} name="cloud-sun" color={color} />
  );
}

function WindIcon({ color }: { color: string }) {
  const windowDimensions = useWindowDimensions();
  const isMobile = windowDimensions.width <= 768;
  return <FontAwesome6 size={isMobile ? 22 : 28} name="wind" color={color} />;
}

function SettingsIcon({ color }: { color: string }) {
  const windowDimensions = useWindowDimensions();
  const isMobile = windowDimensions.width <= 768;
  return <FontAwesome6 size={isMobile ? 22 : 28} name="gear" color={color} />;
}

export default function TabLayout() {
  const windowDimensions = useWindowDimensions();
  const isMobile = windowDimensions.width <= 768;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#4fd3cc',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarStyle: {
          backgroundColor: '#1e293b',
          borderTopWidth: 1,
          borderTopColor: 'rgba(59, 130, 246, 0.3)',
          height: isMobile ? 60 : 70, // Reduce height on mobile since no labels
          paddingBottom: isMobile ? 8 : 10,
          paddingTop: 10,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          // Responsive padding
          paddingHorizontal: isMobile ? 4 : 16,
        },
        tabBarLabelStyle: {
          fontSize: isMobile ? 0 : 12, // Hide labels on mobile by setting fontSize to 0
          fontWeight: '600',
          marginTop: isMobile ? 0 : 4,
          textAlign: 'center',
          display: isMobile ? 'none' : 'flex', // Completely hide labels on mobile
        },
        tabBarIconStyle: {
          marginBottom: isMobile ? 0 : 2, // Remove bottom margin on mobile when no labels
        },
        tabBarItemStyle: {
          // Responsive item styling
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          paddingVertical: 4,
          paddingHorizontal: isMobile ? 1 : 8,
          minWidth: isMobile ? 60 : 80,
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          headerShown: false,
          title: 'Growatt',
          tabBarIcon: SolarPanelIcon,
        }}
      />
      <Tabs.Screen
        name="elhub"
        options={{
          headerShown: false,
          title: 'Elhub',
          tabBarIcon: ElectricBoltIcon,
        }}
      />
      <Tabs.Screen
        name="weatherStation"
        options={{
          headerShown: false,
          title: isMobile ? 'Weather' : 'Weather Station',
          tabBarIcon: CloudSunIcon,
        }}
      />
      <Tabs.Screen
        name="windTurbine"
        options={{
          headerShown: false,
          title: isMobile ? 'Wind' : 'Wind Turbine',
          tabBarIcon: WindIcon,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          headerShown: false,
          title: 'Settings',
          tabBarIcon: SettingsIcon,
        }}
      />
    </Tabs>
  );
}
