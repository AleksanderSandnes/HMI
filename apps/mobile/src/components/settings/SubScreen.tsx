import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { type ReactNode } from "react";
import { Pressable, Text, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { SafeAreaView } from "react-native-safe-area-context";

import { useI18n } from "../../lib/i18n";
import { useThemeColors } from "../../lib/theme";
import { useLayoutMode } from "../../lib/useLayoutMode";

/**
 * Pushed settings sub-screen: back header + keyboard-aware scroll (design
 * 1g–1j). In the tablet split layout it is the detail pane instead: the back
 * chevron disappears (the list column stays visible) and the form is capped
 * to a readable width.
 */
export function SubScreen({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const { colors } = useThemeColors();
  const { t } = useI18n();
  const { splitSettings } = useLayoutMode();

  // canGoBack is false when this screen was reached by replace (split-mode
  // selection, then rotated to portrait) or via a cold deep link.
  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace("/settings");
  };

  return (
    <SafeAreaView className="flex-1" edges={["top", "right"]}>
      <View className="flex-row items-center gap-3 px-4 pb-2 pt-1">
        {!splitSettings ? (
          <Pressable
            onPress={goBack}
            hitSlop={8}
            accessibilityLabel={t("a11y.back")}
            className="h-9 w-9 items-center justify-center rounded-[12px] border border-glass-border bg-glass-fill"
          >
            <Ionicons name="chevron-back" size={18} color={colors.textSecondary} />
          </Pressable>
        ) : null}
        <View className="flex-1">
          <Text className="text-[20px] font-extrabold tracking-[-0.4px] text-text-primary">
            {title}
          </Text>
          {subtitle ? <Text className="text-[12.5px] text-text-muted">{subtitle}</Text> : null}
        </View>
      </View>
      <KeyboardAwareScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1, justifyContent: "center", padding: 16 }}
        bottomOffset={24}
        keyboardShouldPersistTaps="handled"
      >
        <View className={splitSettings ? "w-full max-w-[560px] gap-4 self-center" : "gap-4"}>
          {children}
        </View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}

export default SubScreen;
