import React, { useEffect, useState } from 'react';
import SettingsSection from './SettingsSection';
import StatusBanner from './StatusBanner';
import SyncBadge, { SyncStatus } from './SyncBadge';
import PremiumField from '../../premium/PremiumField';
import PremiumButton from '../../premium/PremiumButton';
import { premiumTheme } from '../../../theme/premiumTheme';
import {
  getGrowattCredentials,
  storeGrowattCredentials,
  hasStoredCredentials,
} from '../../../services/credentialsService';
import {
  saveGrowattApiSettings,
  getApiSettings,
} from '../../../services/settingsApiService';

const MASK = '••••••••';

/**
 * Growatt API credentials card — store account/password/plantId,
 * synced to local storage + backend. Submitting empty values clears them.
 */
export default function GrowattCredentialsCard() {
  const [account, setAccount] = useState('');
  const [password, setPassword] = useState('');
  const [plantId, setPlantId] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasCredentials, setHasCredentials] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const stored = await hasStoredCredentials();
        setHasCredentials(stored);
        if (stored) {
          const creds = await getGrowattCredentials();
          setAccount(creds.account);
          setPassword(MASK);
          setPlantId(creds.plantId || '');
        }
        try {
          const backend = await getApiSettings();
          if (backend?.growatt) {
            setSyncStatus('synced');
            if (!stored) {
              setAccount(backend.growatt.email);
              setPlantId(backend.growatt.plantId || '');
              setPassword(backend.growatt.hasPassword ? MASK : '');
              setHasCredentials(!!backend.growatt.hasPassword);
            }
          }
        } catch {
          setSyncStatus('error');
        }
      } catch {
        // ignore
      }
    })();
  }, []);

  const handleSave = async () => {
    setError(null);
    setSuccess(null);

    if (!account.trim() || !password.trim()) {
      setError('Please enter both account and password');
      return;
    }
    if (!account.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    try {
      setLoading(true);
      await storeGrowattCredentials({
        account: account.trim(),
        password: password.trim(),
        plantId: plantId.trim(),
      });

      let backendSuccess = false;
      try {
        await saveGrowattApiSettings({
          growatt: {
            email: account.trim(),
            password: password.trim(),
            plantId: plantId.trim(),
          },
        });
        backendSuccess = true;
        setSyncStatus('synced');
      } catch {
        setSyncStatus('error');
      }

      setHasCredentials(true);
      setPassword(MASK);
      setSuccess(
        backendSuccess
          ? 'Credentials saved to device and cloud'
          : 'Saved to device. Cloud sync failed — will retry later.'
      );
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
      icon="solar-panel"
      gradient={premiumTheme.energy.gradient}
      title="Growatt API"
      subtitle="Credentials for solar data access"
      headerRight={<SyncBadge status={syncStatus} />}
    >
      {error ? <StatusBanner kind="error" message={error} /> : null}
      {success ? <StatusBanner kind="success" message={success} /> : null}

      <PremiumField
        label="ACCOUNT (EMAIL)"
        icon="envelope"
        value={account}
        onChangeText={setAccount}
        placeholder="your-email@domain.com"
        autoCapitalize="none"
        keyboardType="email-address"
        editable={!loading}
      />
      <PremiumField
        label="PASSWORD"
        icon="key"
        secure
        value={password}
        onChangeText={setPassword}
        onFocusClearMask={() => password === MASK && setPassword('')}
        placeholder="Enter your password"
        editable={!loading}
      />
      <PremiumField
        label="PLANT ID (OPTIONAL)"
        icon="hashtag"
        value={plantId}
        onChangeText={setPlantId}
        placeholder="Enter your plant ID"
        editable={!loading}
      />

      <PremiumButton
        label={hasCredentials ? 'Update Credentials' : 'Save Credentials'}
        icon="check"
        onPress={handleSave}
        loading={loading}
      />
    </SettingsSection>
  );
}
