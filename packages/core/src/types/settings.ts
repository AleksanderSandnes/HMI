// Integration-settings + credential shapes (ported from mobile settings/credentials services).

export interface GrowattCredentials {
  account: string;
  password: string;
  plantId?: string;
}

export interface ApiSettingsData {
  growatt?: {
    email: string;
    password: string;
    plantId?: string; // accepted for back-compat but ignored (derived server-side)
  };
  weather?: {
    apiKey: string;
    stationId: string;
  };
}

export interface ApiSettingsResponse {
  growatt?: {
    email: string;
    plantId: string;
    hasPassword: boolean;
  };
  weather?: {
    stationId: string;
    hasApiKey: boolean;
  };
}
