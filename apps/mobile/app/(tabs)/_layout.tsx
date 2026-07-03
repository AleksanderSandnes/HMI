import { Tabs } from "expo-router";
import { View } from "react-native";

import { GlassTabBar } from "../../src/components/navigation/GlassTabBar";
import { ScreenBackground } from "../../src/components/ui/ScreenBackground";
import { useI18n } from "../../src/lib/i18n";

export default function TabsLayout() {
  const { t } = useI18n();
  return (
    <View className="flex-1 bg-bg-base">
      <ScreenBackground />
      <Tabs
        tabBar={(props) => <GlassTabBar {...props} />}
        screenOptions={{
          headerShown: false,
          sceneStyle: { backgroundColor: "transparent" },
        }}
      >
        <Tabs.Screen name="index" options={{ title: t("nav.dashboard") }} />
        <Tabs.Screen name="solar" options={{ title: t("nav.solar") }} />
        <Tabs.Screen name="weather" options={{ title: t("nav.weather") }} />
        <Tabs.Screen name="settings" options={{ title: t("nav.settings") }} />
      </Tabs>
    </View>
  );
}
