import { Ionicons } from "@expo/vector-icons";
import { appearanceLabel, LANGUAGES, type TranslationKey } from "@hmi/core";
import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";

import { cn } from "../../lib/cn";
import { GRADIENTS } from "../../lib/gradients";
import { useI18n } from "../../lib/i18n";
import { useThemeColors, type ThemePreference } from "../../lib/theme";

import { LanguageSelectSheet } from "./LanguageSelectSheet";
import { SettingsGroup, SettingsRow, Toggle } from "./list";

const APPEARANCE_OPTIONS: {
  value: ThemePreference;
  labelKey: TranslationKey;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  { value: "light", labelKey: "settings.light", icon: "sunny" },
  { value: "system", labelKey: "settings.system", icon: "desktop-outline" },
  { value: "dark", labelKey: "settings.dark", icon: "moon" },
];

function AppearanceSegmented() {
  const { preference, setPreference, colors } = useThemeColors();
  const { t } = useI18n();
  return (
    <View className="flex-row gap-[3px] overflow-hidden rounded-[12px] border border-glass-border bg-glass-fill-subtle p-[3px]">
      {APPEARANCE_OPTIONS.map(({ value, labelKey, icon }) => {
        const active = preference === value;
        return (
          <Pressable
            key={value}
            onPress={() => setPreference(value)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            className={cn(
              "flex-1 flex-row items-center justify-center gap-1.5 rounded-[9px] border py-2",
              active ? "border-glass-border-strong bg-glass-fill-strong" : "border-transparent",
            )}
          >
            <Ionicons
              name={icon}
              size={14}
              color={active ? colors.textPrimary : colors.textSecondary}
            />
            <Text
              className={cn(
                "text-xs font-bold",
                active ? "text-text-primary" : "text-text-secondary",
              )}
            >
              {t(labelKey)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Push toggle + language picker + appearance segmented (settings hub). */
export function PreferencesGroup({
  pushOn,
  setPushOn,
}: {
  pushOn: boolean;
  setPushOn: (v: boolean) => void;
}) {
  const { preference, mode } = useThemeColors();
  const { locale, t } = useI18n();
  const [languageSheetOpen, setLanguageSheetOpen] = useState(false);
  const currentLanguage = LANGUAGES.find((l) => l.code === locale)?.label ?? locale;
  return (
    <>
      <SettingsGroup>
        <SettingsRow
          icon="notifications"
          gradient="accent"
          title={t("settings.pushNotifications")}
          subtitle={t("settings.pushSubtitle")}
          right={<Toggle value={pushOn} onChange={setPushOn} />}
        />
        <SettingsRow
          icon="language"
          gradient="preferences"
          title={t("common.language")}
          subtitle={currentLanguage}
          onPress={() => setLanguageSheetOpen(true)}
        />
        <View className="gap-2.5 px-3.5 py-3">
          <View className="flex-row items-center gap-3">
            <LinearGradient
              colors={GRADIENTS.preferences}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                width: 36,
                height: 36,
                borderRadius: 11,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="contrast" size={18} color="#0a1124" />
            </LinearGradient>
            <View className="min-w-0 flex-1">
              <Text className="text-[14.5px] font-bold text-text-primary">
                {t("settings.appearance")}
              </Text>
              <Text className="mt-0.5 text-[11.5px] text-text-muted">
                {appearanceLabel(preference, mode, t)}
              </Text>
            </View>
          </View>
          <AppearanceSegmented />
        </View>
      </SettingsGroup>
      <LanguageSelectSheet
        visible={languageSheetOpen}
        onClose={() => setLanguageSheetOpen(false)}
      />
    </>
  );
}
