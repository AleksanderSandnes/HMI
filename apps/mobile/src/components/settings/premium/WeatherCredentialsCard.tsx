import React, { useEffect, useState } from 'react';
import SettingsSection from './SettingsSection';
import StatusBanner from './StatusBanner';
import SyncBadge, { SyncStatus } from './SyncBadge';
import PremiumField from '../../premium/PremiumField';
import PremiumButton from '../../premium/PremiumButton';
import { premiumTheme } from '../../../theme/premiumTheme';
import {
  saveWeatherApiSettings,
  getApiSettings,
} from '../../../services/settingsApiService';

const MASK = '••••••••••••••••';

/**
 * Weather.com API credentials card — station ID + API key, synced to backend.
 * Submitting empty values clears the stored credentials.
 */
export default function WeatherCredentialsCard({
  refreshSignal,
}: {
  refreshSignal?: number;
}) {
  const [apiKey, setApiKey] = useState('');
  const [stationId, setStationId] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasCredentials, setHasCredentials] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const backend = await getApiSettings();
        if (backend?.weather) {
          setSyncStatus('synced');
          setStationId(backend.weather.stationId || '');
          setApiKey(backend.weather.hasApiKey ? MASK : '');
          setHasCredentials(!!backend.weather.hasApiKey);
        }
      } catch {
        setSyncStatus('error');
      }
    })();
  }, [refreshSignal]);

  const handleSave = async () => {
    setError(null);
    setSuccess(null);

    if (!stationId.trim()) {
      setError('Please enter a weather station ID');
      return;
    }
    if (!apiKey.trim() || apiKey === MASK) {
      setError('Please enter a valid API key');
      return;
    }

    try {
      setLoading(true);
      await saveWeatherApiSettings({
        weather: { apiKey: apiKey.trim(), stationId: stationId.trim() },
      });
      setSyncStatus('synced');
      setHasCredentials(true);
      setApiKey(MASK);
      setSuccess('Weather credentials saved to cloud');
      setTimeout(() => setSuccess(null), 3500);
    } catch {
      setError('Failed to save credentials. Please try again.');
      setSyncStatus('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SettingsSection
      icon="cloud-sun"
      gradient={premiumTheme.solar.gradient}
      title="Weather.com API"
      subtitle="Station ID and API key"
      headerRight={<SyncBadge status={syncStatus} />}
    >
      {error ? <StatusBanner kind="error" message={error} /> : null}
      {success ? <StatusBanner kind="success" message={success} /> : null}

      <PremiumField
        label="WEATHER STATION ID"
        icon="map-marker-alt"
        value={stationId}
        onChangeText={setStationId}
        placeholder="e.g. ISANDN24"
        autoCapitalize="characters"
        hint="Find your local station ID at weather.com/weather/map"
        editable={!loading}
      />
      <PremiumField
        label="API KEY"
        icon="key"
        secure
        value={apiKey}
        onChangeText={setApiKey}
        onFocusClearMask={() => apiKey === MASK && setApiKey('')}
        placeholder="Enter your Weather.com API key"
        hint="Get your API key from the weather.com developer portal"
        editable={!loading}
      />

      <PremiumButton
        label={hasCredentials ? 'Update Credentials' : 'Save Credentials'}
        icon="check"
        onPress={handleSave}
        loading={loading}
        gradient={premiumTheme.solar.gradient}
      />
    </SettingsSection>
  );
}
