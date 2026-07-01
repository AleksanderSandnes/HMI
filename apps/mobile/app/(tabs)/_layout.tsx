import { Ionicons } from "@expo/vector-icons";
import { type BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { Tabs } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ScreenBackground } from "../../src/components/ui/ScreenBackground";
import { cn } from "../../src/lib/cn";
import { useThemeColors } from "../../src/lib/theme";

const ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  index: "grid",
  solar: "sunny",
  weather: "partly-sunny",
  settings: "settings",
};

/** Floating glass tab bar with a solar-tinted selected pill (design `.nav`). */
function GlassTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useThemeColors();
  return (
    <View style={{ paddingBottom: insets.bottom + 10 }} className="px-2.5 pt-1">
      <View className="flex-row items-center justify-around rounded-[24px] border border-glass-border bg-glass-fill px-1.5 pb-1.5 pt-2">
        {state.routes.map((route, i) => {
          const focused = state.index === i;
          const { options } = descriptors[route.key];
          const label = typeof options.title === "string" ? options.title : route.name;
          const base = ICONS[route.name] ?? "ellipse";
          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });
            if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
          };
          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={focused ? { selected: true } : {}}
              onPress={onPress}
              className={cn(
                "mx-0.5 flex-1 items-center gap-1 rounded-2xl px-1 py-1.5",
                focused && "border border-[rgba(245,158,11,0.3)] bg-[rgba(245,158,11,0.15)]",
              )}
            >
              <Ionicons
                name={focused ? base : (`${base}-outline` as keyof typeof Ionicons.glyphMap)}
                size={20}
                color={focused ? colors.solarTint : colors.textMuted}
              />
              <Text
                className={cn(
                  "text-[10px] font-bold",
                  focused ? "text-solar-light" : "text-text-muted",
                )}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <View className="flex-1 bg-bg-base">
      <ScreenBackground />
      <Tabs
        tabBar={(props) => <GlassTabBar {...props} />}
        screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: "transparent" } }}
      >
        <Tabs.Screen name="index" options={{ title: "Dashboard" }} />
        <Tabs.Screen name="solar" options={{ title: "Solar" }} />
        <Tabs.Screen name="weather" options={{ title: "Weather" }} />
        <Tabs.Screen name="settings" options={{ title: "Settings" }} />
      </Tabs>
    </View>
  );
}
