import { Ionicons } from "@expo/vector-icons";
import {
  growattConfig,
  weatherConfig,
  type ApiSettingsResponse,
  type UserProfile,
} from "@hmi/core";
import { useQuery } from "@tanstack/react-query";
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
import { Button } from "../../../src/components/ui/Button";
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
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-3.5 rounded-lg border border-glass-border-strong bg-glass-fill-strong p-3.5"
    >
      <View className="h-[52px] w-[52px] items-center justify-center rounded-pill border border-glass-border-strong bg-[#1a2036]">
        <Text className="text-[17px] font-extrabold text-[#c9d2e6]">
          {initials(profile?.username)}
        </Text>
      </View>
      <View className="min-w-0 flex-1">
        <Text className="text-[16px] font-extrabold text-text-primary">
          {profile?.username ?? "Your profile"}
        </Text>
        <Text className="mt-0.5 text-[12.5px] text-text-muted">{profile?.email ?? "—"}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#71809a" />
    </Pressable>
  );
}

export default function SettingsHub() {
  const router = useRouter();
  const { account, settings } = useCore();
  const logout = useLogout();
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
    <SafeAreaView className="flex-1 bg-bg-base" edges={["top"]}>
      <ScrollView contentContainerClassName="gap-3 p-4">
        <View className="mb-1">
          <Text className="text-[28px] font-extrabold tracking-[-0.6px] text-text-primary">
            Settings
          </Text>
          <Text className="mt-1 text-[14px] font-medium text-text-muted">
            Account & integrations
          </Text>
        </View>

        <ProfileCard profile={profile} onPress={() => router.push("/settings/profile")} />

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
        <SettingsGroup>
          <SettingsRow
            icon="notifications"
            gradient="accent"
            title="Push notifications"
            subtitle="Alerts on this device"
            right={<Toggle value={pushOn} onChange={setPushOn} />}
          />
          <SettingsRow
            icon="moon"
            gradient="energy"
            title="Dark theme"
            subtitle="Match system · always on"
            right={<Toggle value disabled />}
          />
        </SettingsGroup>

        <GroupLabel>Account</GroupLabel>
        <SettingsGroup>
          <SettingsRow
            icon="lock-closed"
            gradient="revenue"
            title="Change password"
            onPress={() => router.push("/settings/password")}
          />
        </SettingsGroup>

        <Button label="Sign out" variant="danger" onPress={logout} className="mt-1 w-full" />
      </ScrollView>
    </SafeAreaView>
  );
}
