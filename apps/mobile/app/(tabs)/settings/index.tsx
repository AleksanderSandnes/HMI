import { Redirect, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { SettingsHubList } from "../../../src/components/settings/SettingsHubList";
import { useLayoutMode } from "../../../src/lib/useLayoutMode";

/**
 * Settings hub. On phones this is the whole screen (rows push sub-screens);
 * in the tablet split layout the list lives in settings/_layout.tsx instead,
 * so the index just forwards to the default detail pane.
 */
export default function SettingsHub() {
  const router = useRouter();
  const { splitSettings } = useLayoutMode();

  if (splitSettings) return <Redirect href="/settings/profile" />;

  return (
    <SafeAreaView className="flex-1" edges={["top", "left", "right"]}>
      <SettingsHubList showTitle onSelect={(route) => router.push(`/settings/${route}`)} />
    </SafeAreaView>
  );
}
