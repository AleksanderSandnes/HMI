import { weatherConfig, type ApiSettingsResponse } from "@hmi/core";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { Text, View } from "react-native";

import { SubScreen } from "../../../src/components/settings/SubScreen";
import { ConfiguredBadge, WeatherForm } from "../../../src/components/settings/forms";
import { useCore } from "../../../src/lib/useCore";

export default function WeatherCredentialsScreen() {
  const { settings } = useCore();
  const { data: api, refetch } = useQuery<ApiSettingsResponse | null>({
    queryKey: ["api-settings"],
    queryFn: () => settings.getApiSettings(),
  });
  useEffect(() => settings.subscribeSettings(() => void refetch()), [settings, refetch]);
  const wc = weatherConfig(api);

  return (
    <SubScreen title="Weather.com station" subtitle="Your personal weather station data source">
      <View className="flex-row items-center gap-2.5">
        <Text className="text-sm text-text-secondary">Connection</Text>
        <ConfiguredBadge on={wc.configured} />
      </View>
      <WeatherForm
        key={wc.key}
        initialStationId={wc.station}
        settings={settings}
        onSaved={refetch}
      />
    </SubScreen>
  );
}
