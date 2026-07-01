import { Stack } from "expo-router";

/** Settings is a nested stack so its rows push to full sub-screens (design 1f–1j). */
export default function SettingsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
        contentStyle: { backgroundColor: "transparent" },
      }}
    />
  );
}
