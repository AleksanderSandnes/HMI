import { Ionicons } from "@expo/vector-icons";
import {
  growattConfig,
  weatherConfig,
  type ApiSettingsResponse,
  type UserProfile,
} from "@hmi/core";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useQuery } from "@tanstack/react-query";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ConfiguredBadge } from "../../../src/components/settings/forms";
import {
  GroupLabel,
  SettingsGroup,
  SettingsRow,
  Toggle,
} from "../../../src/components/settings/list";
import { Avatar } from "../../../src/components/ui/Avatar";
import { Button } from "../../../src/components/ui/Button";
import { GlassCard } from "../../../src/components/ui/GlassCard";
import { cn } from "../../../src/lib/cn";
import { GRADIENTS } from "../../../src/lib/gradients";
import { useThemeColors, type ThemePreference } from "../../../src/lib/theme";
import { useAvatar } from "../../../src/lib/useAvatar";
import { useCore } from "../../../src/lib/useCore";
import { useLogout } from "../../../src/lib/useLogout";
import { usePreference } from "../../../src/lib/usePreference";

function initials(name?: string | null): string {
  if (!name) return "·";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function ProfileCard({ profile, onPress }: { profile?: UserProfile; onPress: () => void }) {
  const { uri } = useAvatar();
  const { colors } = useThemeColors();
  return (
    <Pressable onPress={onPress}>
      <GlassCard strong className="flex-row items-center gap-3.5 p-3.5">
        <Avatar initials={initials(profile?.username)} uri={uri} size={52} />
        <View className="min-w-0 flex-1">
          <Text className="text-[16px] font-extrabold text-text-primary">
            {profile?.username ?? "Your profile"}
          </Text>
          <Text className="mt-0.5 text-[12.5px] text-text-muted">{profile?.email ?? "—"}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
      </GlassCard>
    </Pressable>
  );
}

const APPEARANCE_OPTIONS: {
  value: ThemePreference;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  { value: "light", label: "Light", icon: "sunny" },
  { value: "system", label: "System", icon: "desktop-outline" },
  { value: "dark", label: "Dark", icon: "moon" },
];

function appearanceSubtitle(preference: ThemePreference, mode: "light" | "dark"): string {
  if (preference === "system") {
    return `System · ${mode === "dark" ? "Dark" : "Light"} right now`;
  }
  return preference === "dark" ? "Dark" : "Light";
}

function AppearanceSegmented() {
  const { preference, setPreference, colors } = useThemeColors();
  return (
    <View className="flex-row gap-[3px] overflow-hidden rounded-[12px] border border-glass-border bg-glass-fill-subtle p-[3px]">
      {APPEARANCE_OPTIONS.map(({ value, label, icon }) => {
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
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function PreferencesGroup({
  pushOn,
  setPushOn,
}: {
  pushOn: boolean;
  setPushOn: (v: boolean) => void;
}) {
  const { preference, mode } = useThemeColors();
  return (
    <SettingsGroup>
      <SettingsRow
        icon="notifications"
        gradient="accent"
        title="Push notifications"
        subtitle="Alerts on this device"
        right={<Toggle value={pushOn} onChange={setPushOn} />}
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
            <Text className="text-[14.5px] font-bold text-text-primary">Appearance</Text>
            <Text className="mt-0.5 text-[11.5px] text-text-muted">
              {appearanceSubtitle(preference, mode)}
            </Text>
          </View>
        </View>
        <AppearanceSegmented />
      </View>
    </SettingsGroup>
  );
}

export default function SettingsHub() {
  const router = useRouter();
  const { account, settings } = useCore();
  const logout = useLogout();
  const tabBarHeight = useBottomTabBarHeight();
  const [pushOn, setPushOn] = usePreference("pref.push", true);

  const { data: profile } = useQuery<UserProfile>({
    queryKey: ["profile"],
    queryFn: () => account.getUserProfile(),
  });
  const { data: api, refetch } = useQuery<ApiSettingsResponse | null>({
    queryKey: ["api-settings"],
    queryFn: () => settings.getApiSettings(),
  });
  useEffect(() => settings.subscribeSettings(() => void refetch()), [settings, refetch]);

  const gc = growattConfig(api);
  const wc = weatherConfig(api);

  return (
    <SafeAreaView className="flex-1" edges={["top"]}>
      <ScrollView
        contentContainerClassName="gap-3 px-4 pt-4"
        contentContainerStyle={{ paddingBottom: tabBarHeight + 16 }}
      >
        <View className="mb-1">
          <Text className="text-[28px] font-extrabold tracking-[-0.6px] text-text-primary">
            Settings
          </Text>
          <Text className="mt-1 text-[14px] font-medium text-text-muted">
            Account & integrations
          </Text>
        </View>

        <ProfileCard profile={profile} onPress={() => router.push("/settings/profile")} />

        <GroupLabel>Account</GroupLabel>
        <SettingsGroup>
          <SettingsRow
            icon="lock-closed"
            gradient="revenue"
            title="Change password"
            onPress={() => router.push("/settings/password")}
          />
        </SettingsGroup>

        <GroupLabel>Integrations</GroupLabel>
        <SettingsGroup>
          <SettingsRow
            icon="sunny"
            gradient="energy"
            title="Growatt solar"
            subtitle="Production data source"
            right={<ConfiguredBadge on={gc.configured} />}
            onPress={() => router.push("/settings/growatt")}
          />
          <SettingsRow
            icon="cloud"
            gradient="solar"
            title="Weather.com station"
            subtitle="Local conditions source"
            right={<ConfiguredBadge on={wc.configured} />}
            onPress={() => router.push("/settings/weather")}
          />
        </SettingsGroup>

        <GroupLabel>Preferences</GroupLabel>
        <PreferencesGroup pushOn={pushOn} setPushOn={setPushOn} />

        <Button
          label="Sign out"
          icon={({ color, size }) => <Ionicons name="log-out" size={size} color={color} />}
          variant="danger"
          onPress={logout}
          className="mt-1 w-full"
        />
      </ScrollView>
    </SafeAreaView>
  );
}
