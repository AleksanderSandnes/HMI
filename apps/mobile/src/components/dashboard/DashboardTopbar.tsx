import { Ionicons } from "@expo/vector-icons";
import { deriveInitials } from "@hmi/core";
import { Pressable, Text, View } from "react-native";

import { useI18n } from "../../lib/i18n";
import { useThemeColors } from "../../lib/theme";
import { useAvatar } from "../../lib/useAvatar";
import { Avatar } from "../ui/Avatar";

/** Dashboard chrome row (design 1c): brand · bell + badge · avatar with online dot. */
export function DashboardTopbar({
  username,
  notifCount,
  online,
  onBellPress,
}: {
  username?: string | null;
  notifCount: number;
  online?: boolean | null;
  onBellPress: () => void;
}) {
  const { uri } = useAvatar();
  const { colors } = useThemeColors();
  const { t } = useI18n();
  return (
    <View className="flex-row items-center justify-between pt-1.5">
      <Text className="text-[21px] font-black tracking-[-0.5px] text-text-primary">HMI</Text>
      <View className="flex-row items-center gap-3">
        <Pressable
          onPress={onBellPress}
          accessibilityLabel={t("a11y.notifications")}
          className="h-[38px] w-[38px] items-center justify-center rounded-[12px] border border-glass-border bg-glass-fill"
        >
          <Ionicons name="notifications-outline" size={18} color={colors.textSecondary} />
          {notifCount > 0 ? (
            <View className="absolute -right-1 -top-1 h-[17px] min-w-[17px] items-center justify-center rounded-pill bg-solar px-1">
              <Text className="text-[10px] font-black text-text-inverse">
                {notifCount > 9 ? "9+" : notifCount}
              </Text>
            </View>
          ) : null}
        </Pressable>
        <View>
          <Avatar initials={deriveInitials(username)} uri={uri} size={38} />
          {online ? (
            <View className="absolute -bottom-0.5 -right-0.5 h-[11px] w-[11px] rounded-pill border-2 border-bg-base bg-positive" />
          ) : null}
        </View>
      </View>
    </View>
  );
}

export default DashboardTopbar;
