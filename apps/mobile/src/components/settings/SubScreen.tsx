import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { type ReactNode } from "react";
import { Pressable, Text, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { SafeAreaView } from "react-native-safe-area-context";

import { ScreenBackground } from "../ui/ScreenBackground";

/** Pushed settings sub-screen: back header + keyboard-aware scroll (design 1g–1j). */
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
  return (
    <SafeAreaView className="flex-1 bg-bg-base" edges={["top"]}>
      <ScreenBackground />
      <View className="flex-row items-center gap-3 px-4 pb-2 pt-1">
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          accessibilityLabel="Back"
          className="h-9 w-9 items-center justify-center rounded-[12px] border border-glass-border bg-glass-fill"
        >
          <Ionicons name="chevron-back" size={18} color="#aeb8cc" />
        </Pressable>
        <View className="flex-1">
          <Text className="text-[20px] font-extrabold tracking-[-0.4px] text-text-primary">
            {title}
          </Text>
          {subtitle ? <Text className="text-[12.5px] text-text-muted">{subtitle}</Text> : null}
        </View>
      </View>
      <KeyboardAwareScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, gap: 16 }}
        bottomOffset={24}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}

export default SubScreen;
