import { Ionicons } from "@expo/vector-icons";
import { LANGUAGES } from "@hmi/core";
import { Modal as RNModal, Pressable, Text, View } from "react-native";

import { useI18n } from "../../lib/i18n";
import { useThemeColors } from "../../lib/theme";

/**
 * Language picker opened from the Settings Preferences group. Selecting a
 * language re-renders every translation in the app instantly (styled after
 * the NotificationsOverlay panel/scrim treatment).
 */
export function LanguageSelectSheet({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const { colors } = useThemeColors();
  const { locale, setLocale, t } = useI18n();

  return (
    <RNModal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        onPress={onClose}
        className="flex-1 justify-center px-8"
        style={{ backgroundColor: colors.scrim }}
      >
        <Pressable onPress={(e) => e.stopPropagation()}>
          <View
            className="overflow-hidden rounded-[20px] border border-glass-border-strong"
            style={{
              backgroundColor: colors.panelBg,
              shadowColor: "#000",
              shadowOpacity: 0.6,
              shadowRadius: 30,
              shadowOffset: { width: 0, height: 20 },
              elevation: 24,
            }}
          >
            <View className="border-b border-glass-border px-4 py-3">
              <Text className="text-[15.5px] font-extrabold text-text-primary">
                {t("common.language")}
              </Text>
            </View>
            {LANGUAGES.map((lang, i) => {
              const active = lang.code === locale;
              return (
                <Pressable
                  key={lang.code}
                  onPress={() => {
                    setLocale(lang.code);
                    onClose();
                  }}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  className={`flex-row items-center gap-3 px-4 py-3.5 ${
                    i > 0 ? "border-t border-glass-border" : ""
                  } ${active ? "bg-glass-fill" : ""}`}
                >
                  <Text
                    className={`flex-1 text-[14px] ${
                      active
                        ? "font-extrabold text-text-primary"
                        : "font-medium text-text-secondary"
                    }`}
                  >
                    {lang.label}
                  </Text>
                  {active ? (
                    <Ionicons name="checkmark" size={17} color={colors.textPrimary} />
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        </Pressable>
      </Pressable>
    </RNModal>
  );
}

export default LanguageSelectSheet;
