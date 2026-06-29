import React from 'react';
import { FontAwesome5, FontAwesome6 } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { Platform, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import PremiumTabBar, { navWidth } from '../../src/components/navigation/PremiumTabBar';
import { premiumTheme } from '../../src/theme/premiumTheme';
import { NotificationsProvider } from '../../src/context/NotificationsContext';
import PushRegistrar from '../../src/components/PushRegistrar';

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
  const insets = useSafeAreaInsets();
  // When the sidebar is visible it occupies the base rail/full width plus any
  // left safe-area inset (landscape notch); the scene must be padded to match.
  const sidebar = navWidth(width);
  const padLeft = sidebar > 0 ? sidebar + insets.left : 0;

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
