import React from 'react';
import { FontAwesome5, FontAwesome6 } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useWindowDimensions } from 'react-native';
import PremiumTabBar, { navWidth } from '../components/navigation/PremiumTabBar';
import { premiumTheme } from '../theme/premiumTheme';

function SolarPanelIcon({ color }: { color: string }) {
  const { width } = useWindowDimensions();
  const size = width <= 768 ? 22 : 20;
  return <FontAwesome6 size={size} name="solar-panel" color={color} />;
}

function CloudSunIcon({ color }: { color: string }) {
  const { width } = useWindowDimensions();
  const size = width <= 768 ? 22 : 20;
  return <FontAwesome5 size={size} name="cloud-sun" color={color} />;
}

function SettingsIcon({ color }: { color: string }) {
  const { width } = useWindowDimensions();
  const size = width <= 768 ? 22 : 20;
  return <FontAwesome6 size={size} name="gear" color={color} />;
}

export default function TabLayout() {
  const { width } = useWindowDimensions();
  const padLeft = navWidth(width);

  return (
    <Tabs
      tabBar={(props) => <PremiumTabBar {...props} />}
      sceneContainerStyle={{
        paddingLeft: padLeft,
        backgroundColor: premiumTheme.bg.base,
      }}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Growatt', tabBarIcon: SolarPanelIcon }}
      />
      <Tabs.Screen
        name="weatherStation"
        options={{ title: 'Weather Station', tabBarIcon: CloudSunIcon }}
      />
      <Tabs.Screen
        name="settings"
        options={{ title: 'Settings', tabBarIcon: SettingsIcon }}
      />
    </Tabs>
  );
}
