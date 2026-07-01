import { weatherConfig, type ApiSettingsResponse } from "@hmi/core";
import { useQuery } from "@tanstack/react-query";

import { SubScreen } from "../../../src/components/settings/SubScreen";
import { WeatherForm } from "../../../src/components/settings/forms";
import { useCore } from "../../../src/lib/useCore";

export default function WeatherCredentialsScreen() {
  const { settings } = useCore();
  // Shares the ["api-settings"] cache with the Settings hub, which owns the
  // realtime subscription (subscribing again here collides on the same channel).
  const { data: api, refetch } = useQuery<ApiSettingsResponse | null>({
    queryKey: ["api-settings"],
    queryFn: () => settings.getApiSettings(),
  });
  const wc = weatherConfig(api);

  return (
    <SubScreen title="Weather.com station" subtitle="Personal weather station">
      <WeatherForm
        key={wc.key}
        initialStationId={wc.station}
        connected={wc.configured}
        settings={settings}
        onSaved={refetch}
      />
    </SubScreen>
  );
}
