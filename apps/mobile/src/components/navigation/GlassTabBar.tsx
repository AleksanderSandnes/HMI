import { Ionicons } from "@expo/vector-icons";
import { type BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { cn } from "../../lib/cn";
import { useThemeColors } from "../../lib/theme";

import { makeTabPressHandler, tabIcon } from "./tabBarShared";

/** Floating glass tab bar with a solar-tinted selected pill (design `.nav`). */
export function GlassTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useThemeColors();
  return (
    <View style={{ paddingBottom: insets.bottom + 10 }} className="px-2.5 pt-1">
      <View className="flex-row items-center justify-around rounded-[24px] border border-glass-border bg-glass-fill px-1.5 pb-1.5 pt-2">
        {state.routes.map((route, i) => {
          const focused = state.index === i;
          const { options } = descriptors[route.key];
          const label = typeof options.title === "string" ? options.title : route.name;
          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={focused ? { selected: true } : {}}
              onPress={makeTabPressHandler(navigation, route, focused)}
              className={cn(
                "mx-0.5 flex-1 items-center gap-1 rounded-2xl px-1 py-1.5",
                focused && "border border-[rgba(245,158,11,0.3)] bg-[rgba(245,158,11,0.15)]",
              )}
            >
              <Ionicons
                name={tabIcon(route.name, focused)}
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
