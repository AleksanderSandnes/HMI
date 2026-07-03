import type { Ionicons } from "@expo/vector-icons";
import { type BottomTabBarProps } from "@react-navigation/bottom-tabs";

/** Route-name → Ionicons glyph for the tab bar / nav rail. */
export const TAB_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  index: "grid",
  solar: "sunny",
  weather: "partly-sunny",
  settings: "settings",
};

export function tabIcon(routeName: string, focused: boolean): keyof typeof Ionicons.glyphMap {
  const base = TAB_ICONS[routeName] ?? "ellipse";
  return focused ? base : (`${base}-outline` as keyof typeof Ionicons.glyphMap);
}

type TabNavigation = BottomTabBarProps["navigation"];
type TabRoute = BottomTabBarProps["state"]["routes"][number];

/** Standard tabPress emit + navigate, shared by GlassTabBar and GlassNavRail. */
export function makeTabPressHandler(navigation: TabNavigation, route: TabRoute, focused: boolean) {
  return () => {
    const event = navigation.emit({
      type: "tabPress",
      target: route.key,
      canPreventDefault: true,
    });
    if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
  };
}
