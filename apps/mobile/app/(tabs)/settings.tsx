import { useEffect, useState, type ReactNode } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import type { ApiSettingsResponse, UserProfile } from '@hmi/core';
import { useCore } from '../../src/lib/useCore';
import { useLogout } from '../../src/lib/useLogout';
import { GlassCard } from '../../src/components/ui/GlassCard';
import { Field } from '../../src/components/ui/Field';
import { Button } from '../../src/components/ui/Button';
import { StatusBanner } from '../../src/components/ui/StatusBanner';
import { GRADIENTS, type StatGradient } from '../../src/lib/gradients';
import type { IconRender } from '../../src/components/ui/types';

type Core = ReturnType<typeof useCore>;
type Banner = { kind: 'success' | 'error'; message: string } | null;

const mail: IconRender = (p) => <Ionicons name="mail-outline" {...p} />;
const user: IconRender = (p) => <Ionicons name="person-outline" {...p} />;
const keyIc: IconRender = (p) => <Ionicons name="key-outline" {...p} />;
const pin: IconRender = (p) => <Ionicons name="location-outline" {...p} />;
const sun: IconRender = (p) => <Ionicons name="sunny-outline" {...p} />;

function Section({
  title,
  icon,
  gradient,
  children,
}: {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  gradient: StatGradient;
  children: ReactNode;
}) {
  return (
    <GlassCard strong className="p-5">
      <View className="mb-4 flex-row items-center gap-2.5">
        <LinearGradient
          colors={GRADIENTS[gradient]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' }}
        >
          <Ionicons name={icon} size={16} color="#0a1124" />
        </LinearGradient>
        <Text className="text-base font-extrabold text-text-primary">{title}</Text>
      </View>
      {children}
    </GlassCard>
  );
}

function ConfiguredBadge({ on }: { on: boolean }) {
  return (
    <View className={`ml-2 rounded-pill px-2.5 py-1 ${on ? 'bg-[rgba(52,211,153,0.13)]' : 'bg-glass-fill'}`}>
      <Text className={`text-[11px] font-bold ${on ? 'text-positive' : 'text-text-muted'}`}>
        {on ? 'Configured' : 'Not set'}
      </Text>
    </View>
  );
}

export default function Settings() {
  const core = useCore();
  const { account, settings } = core;
  const logout = useLogout();

  const { data: profile } = useQuery<UserProfile>({
    queryKey: ['profile'],
    queryFn: () => account.getUserProfile(),
  });

  const { data: api, refetch: refetchApi } = useQuery<ApiSettingsResponse | null>({
    queryKey: ['api-settings'],
    queryFn: () => settings.getApiSettings(),
  });

  useEffect(() => settings.subscribeSettings(() => refetchApi()), [settings, refetchApi]);

  return (
    <SafeAreaView className="flex-1 bg-bg-base" edges={['top']}>
      <ScrollView contentContainerClassName="gap-4 p-4">
        <View>
          <Text className="text-[28px] font-extrabold tracking-[-0.6px] text-text-primary">
            Settings
          </Text>
          <Text className="mt-1 text-[14px] font-medium text-text-muted">
            Account & integration credentials
          </Text>
        </View>

        <Section title="Growatt solar" icon="sunny" gradient="energy">
          <GrowattForm
            key={api?.growatt?.email ?? 'g'}
            initialEmail={api?.growatt?.email ?? ''}
            configured={!!api?.growatt?.hasPassword}
            settings={settings}
            onSaved={refetchApi}
          />
        </Section>

        <Section title="Weather.com station" icon="cloud" gradient="solar">
          <WeatherForm
            key={api?.weather?.stationId ?? 'w'}
            initialStationId={api?.weather?.stationId ?? ''}
            configured={!!api?.weather?.hasApiKey}
            settings={settings}
            onSaved={refetchApi}
          />
        </Section>

        <Section title="Account" icon="person" gradient="accent">
          <AccountForm key={profile?.id ?? 'loading'} profile={profile} account={account} />
        </Section>

        <Section title="Password" icon="shield-checkmark" gradient="revenue">
          <PasswordForm account={account} />
        </Section>

        <Button label="Sign out" variant="danger" onPress={logout} className="w-full" />
      </ScrollView>
    </SafeAreaView>
  );
}

function AccountForm({ profile, account }: { profile: UserProfile | undefined; account: Core['account'] }) {
  const [username, setUsername] = useState(profile?.username ?? '');
  const [email, setEmail] = useState(profile?.email ?? '');
  const [banner, setBanner] = useState<Banner>(null);
  const [saving, setSaving] = useState(false);

  if (!profile) return <Text className="text-sm text-text-muted">Loading…</Text>;

  async function save() {
    setBanner(null);
    setSaving(true);
    try {
      await account.updateUserProfile({ username, email });
      setBanner({ kind: 'success', message: 'Profile updated.' });
    } catch (e) {
      setBanner({ kind: 'error', message: e instanceof Error ? e.message : 'Could not update profile.' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      {banner ? <StatusBanner kind={banner.kind} message={banner.message} /> : null}
      <Field label="USERNAME" icon={user} autoCapitalize="none" value={username} onChangeText={setUsername} />
      <Field label="EMAIL" icon={mail} keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} />
      <Button label="Save profile" onPress={save} loading={saving} className="w-full" />
    </>
  );
}

function PasswordForm({ account }: { account: Core['account'] }) {
  const [pw, setPw] = useState('');
  const [confirm, setConfirm] = useState('');
  const [banner, setBanner] = useState<Banner>(null);
  const [saving, setSaving] = useState(false);

  async function save() {
    setBanner(null);
    if (pw.length < 4) return setBanner({ kind: 'error', message: 'Password must be at least 4 characters.' });
    if (pw !== confirm) return setBanner({ kind: 'error', message: 'Passwords do not match.' });
    setSaving(true);
    try {
      await account.updateUserPassword({ currentPassword: '', newPassword: pw });
      setBanner({ kind: 'success', message: 'Password changed.' });
      setPw('');
      setConfirm('');
    } catch (e) {
      setBanner({ kind: 'error', message: e instanceof Error ? e.message : 'Could not change password.' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      {banner ? <StatusBanner kind={banner.kind} message={banner.message} /> : null}
      <Field label="NEW PASSWORD" icon={keyIc} secure value={pw} onChangeText={setPw} />
      <Field label="CONFIRM PASSWORD" icon={keyIc} secure value={confirm} onChangeText={setConfirm} />
      <Button label="Change password" onPress={save} loading={saving} className="w-full" />
    </>
  );
}

function GrowattForm({ initialEmail, configured, settings, onSaved }: { initialEmail: string; configured: boolean; settings: Core['settings']; onSaved: () => void }) {
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState('');
  const [banner, setBanner] = useState<Banner>(null);
  const [saving, setSaving] = useState(false);

  async function save() {
    setBanner(null);
    setSaving(true);
    try {
      await settings.saveGrowattApiSettings({ growatt: { email, password } });
      setBanner({ kind: 'success', message: 'Growatt credentials saved.' });
      setPassword('');
      onSaved();
    } catch (e) {
      setBanner({ kind: 'error', message: e instanceof Error ? e.message : 'Could not save credentials.' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <View className="mb-4 -mt-1 flex-row items-center">
        <Text className="text-sm text-text-muted">Used by the server to fetch your solar data.</Text>
        <ConfiguredBadge on={configured} />
      </View>
      {banner ? <StatusBanner kind={banner.kind} message={banner.message} /> : null}
      <Field label="ACCOUNT (EMAIL)" icon={mail} keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} />
      <Field label="PASSWORD" icon={keyIc} secure placeholder="Enter to update" value={password} onChangeText={setPassword} />
      <Button label="Save Growatt credentials" gradient="energy" onPress={save} loading={saving} className="w-full" />
    </>
  );
}

function WeatherForm({ initialStationId, configured, settings, onSaved }: { initialStationId: string; configured: boolean; settings: Core['settings']; onSaved: () => void }) {
  const [stationId, setStationId] = useState(initialStationId);
  const [apiKey, setApiKey] = useState('');
  const [banner, setBanner] = useState<Banner>(null);
  const [saving, setSaving] = useState(false);

  async function save() {
    setBanner(null);
    setSaving(true);
    try {
      await settings.saveWeatherApiSettings({ weather: { stationId, apiKey } });
      setBanner({ kind: 'success', message: 'Weather credentials saved.' });
      setApiKey('');
      onSaved();
    } catch (e) {
      setBanner({ kind: 'error', message: e instanceof Error ? e.message : 'Could not save credentials.' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <View className="mb-4 -mt-1 flex-row items-center">
        <Text className="text-sm text-text-muted">Personal weather station data source.</Text>
        <ConfiguredBadge on={configured} />
      </View>
      {banner ? <StatusBanner kind={banner.kind} message={banner.message} /> : null}
      <Field label="WEATHER STATION ID" icon={pin} autoCapitalize="characters" placeholder="e.g. ISANDN24" value={stationId} onChangeText={setStationId} />
      <Field label="API KEY" icon={sun} secure placeholder="Enter to update" value={apiKey} onChangeText={setApiKey} />
      <Button label="Save weather credentials" onPress={save} loading={saving} className="w-full" />
    </>
  );
}
