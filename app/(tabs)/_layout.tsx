import React from 'react';
import { FontAwesome5, FontAwesome6 } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { Platform, useWindowDimensions } from 'react-native';
import PremiumTabBar, { navWidth } from '../components/navigation/PremiumTabBar';
import { premiumTheme } from '../theme/premiumTheme';
import { NotificationsProvider } from '../context/NotificationsContext';
import PushRegistrar from '../components/PushRegistrar';

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

function NotificationsIcon({ color }: { color: string }) {
  const { width } = useWindowDimensions();
  const size = width <= 768 ? 22 : 20;
  return <FontAwesome5 size={size} name="bell" color={color} solid />;
}

export default function TabLayout() {
  const { width } = useWindowDimensions();
  const padLeft = navWidth(width);

  return (
    <NotificationsProvider>
      <PushRegistrar />
      <Tabs
        tabBar={(props) => <PremiumTabBar {...props} />}
        screenOptions={{
          headerShown: false,
          sceneStyle: {
            paddingLeft: padLeft,
            backgroundColor: premiumTheme.bg.base,
          },
        }}
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
          name="notifications"
          options={{
            title: 'Notifications',
            tabBarIcon: NotificationsIcon,
            // Notification center is web-only; native apps use push notifications.
            href: Platform.OS === 'web' ? undefined : null,
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{ title: 'Settings', tabBarIcon: SettingsIcon }}
        />
      </Tabs>
    </NotificationsProvider>
  );
}
