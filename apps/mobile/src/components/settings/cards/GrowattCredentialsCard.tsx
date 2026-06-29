import React, { useEffect, useState } from 'react';
import SettingsSection from './SettingsSection';
import StatusBanner from './StatusBanner';
import SyncBadge, { SyncStatus } from './SyncBadge';
import Field from '../../ui/Field';
import Button from '../../ui/Button';
import { theme } from '../../../theme/theme';
import {
  saveGrowattApiSettings,
  getApiSettings,
} from '../../../services/settingsApiService';

const MASK = '••••••••';

/**
 * Growatt API credentials card — stores account + password in Supabase Vault. The plant id
 * is no longer collected: the backend derives it from the server-side Growatt login.
 */
export default function GrowattCredentialsCard({
  refreshSignal,
}: {
  refreshSignal?: number;
}) {
  const [account, setAccount] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasCredentials, setHasCredentials] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const backend = await getApiSettings();
        if (backend?.growatt) {
          setSyncStatus('synced');
          setAccount(backend.growatt.email);
          setPassword(backend.growatt.hasPassword ? MASK : '');
          setHasCredentials(!!backend.growatt.hasPassword);
        }
      } catch {
        setSyncStatus('error');
      }
    })();
  }, [refreshSignal]);

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
      await saveGrowattApiSettings({
        growatt: { email: account.trim(), password: password.trim() },
      });
      setSyncStatus('synced');
      setHasCredentials(true);
      setPassword(MASK);
      setSuccess('Credentials saved securely');
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
      gradient={theme.energy.gradient}
      title="Growatt API"
      subtitle="Credentials for solar data access"
      headerRight={<SyncBadge status={syncStatus} />}
    >
      {error ? <StatusBanner kind="error" message={error} /> : null}
      {success ? <StatusBanner kind="success" message={success} /> : null}

      <Field
        label="ACCOUNT (EMAIL)"
        icon="envelope"
        value={account}
        onChangeText={setAccount}
        placeholder="your-email@domain.com"
        autoCapitalize="none"
        keyboardType="email-address"
        editable={!loading}
      />
      <Field
        label="PASSWORD"
        icon="key"
        secure
        value={password}
        onChangeText={setPassword}
        onFocusClearMask={() => password === MASK && setPassword('')}
        placeholder="Enter your password"
        editable={!loading}
      />

      <Button
        label={hasCredentials ? 'Update Credentials' : 'Save Credentials'}
        icon="check"
        onPress={handleSave}
        loading={loading}
      />
    </SettingsSection>
  );
}
