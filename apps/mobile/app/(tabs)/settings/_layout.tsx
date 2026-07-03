import { Stack, usePathname, useRouter } from "expo-router";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  SettingsHubList,
  type SettingsSubRoute,
} from "../../../src/components/settings/SettingsHubList";
import { useLayoutMode } from "../../../src/lib/useLayoutMode";

const SUB_ROUTES: SettingsSubRoute[] = ["profile", "password", "growatt", "weather"];

function activeSubRoute(pathname: string): SettingsSubRoute | undefined {
  const last = pathname.split("/").pop();
  return SUB_ROUTES.find((r) => r === last);
}

/**
 * Settings is a nested stack so its rows push to full sub-screens (design
 * 1f–1j). On tablets (split settings) the hub list becomes a persistent left
 * column and the stack renders the selected sub-screen as the detail pane.
 */
export default function SettingsLayout() {
  const { splitSettings } = useLayoutMode();
  const router = useRouter();
  const pathname = usePathname();

  const stack = (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
        contentStyle: { backgroundColor: "transparent" },
      }}
    />
  );

  if (!splitSettings) return stack;

  return (
    <View className="flex-1 flex-row">
      <SafeAreaView edges={["top"]} className="w-[360px] border-r border-glass-border">
        <SettingsHubList
          showTitle
          activeRoute={activeSubRoute(pathname)}
          onSelect={(route) => router.replace(`/settings/${route}`)}
        />
      </SafeAreaView>
      <View className="min-w-0 flex-1">{stack}</View>
    </View>
  );
}
