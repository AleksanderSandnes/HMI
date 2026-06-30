// Settings-screen view models derived from the integration-settings payload.
// Shared by web + mobile so both render the same "configured" state and keys.

import type { ApiSettingsResponse } from "../types/settings";

/** Growatt card view model — masked email + whether a password is stored. */
export function growattConfig(api: ApiSettingsResponse | null | undefined) {
  const g = api?.growatt;
  return { key: g?.email ?? "g", email: g?.email ?? "", configured: !!g?.hasPassword };
}

/** Weather.com card view model — station id + whether an API key is stored. */
export function weatherConfig(api: ApiSettingsResponse | null | undefined) {
  const w = api?.weather;
  return { key: w?.stationId ?? "w", station: w?.stationId ?? "", configured: !!w?.hasApiKey };
}
