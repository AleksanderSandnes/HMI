import { Stack } from "expo-router";

import { useThemeColors } from "../../src/lib/theme";

export default function AuthLayout() {
  const { colors } = useThemeColors();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bgBase },
      }}
    />
  );
}
