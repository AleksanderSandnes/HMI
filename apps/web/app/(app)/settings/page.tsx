"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { KeyRound, Mail, MapPin, SunMedium, User } from "lucide-react";
import type { ApiSettingsResponse, UserProfile } from "@hmi/core";
import { useCore } from "@/lib/hooks/useCore";
import { GlassCard } from "@/components/ui/GlassCard";
import { Field } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { StatusBanner } from "@/components/ui/StatusBanner";

type Core = ReturnType<typeof useCore>;
type Banner = { kind: "success" | "error"; message: string } | null;

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <GlassCard strong className="p-6">
      <h2 className="mb-4 text-lg font-extrabold text-text-primary">{title}</h2>
      {children}
    </GlassCard>
  );
}

export default function SettingsPage() {
  const { account, settings } = useCore();

  const { data: profile } = useQuery<UserProfile>({
    queryKey: ["profile"],
    queryFn: () => account.getUserProfile(),
  });

  const { data: api, refetch: refetchApi } = useQuery<ApiSettingsResponse | null>({
    queryKey: ["api-settings"],
    queryFn: () => settings.getApiSettings(),
  });

  // Cross-device sync: refresh integration settings when they change elsewhere.
  useEffect(
    () => settings.subscribeSettings(() => refetchApi()),
    [settings, refetchApi]
  );

  return (
    <div className="mx-auto flex w-full max-w-[720px] flex-col gap-5">
      <div>
        <h1 className="text-[30px] font-extrabold tracking-[-0.8px] text-text-primary">
          Settings
        </h1>
        <p className="mt-1 text-[14.5px] font-medium text-text-muted">
          Account &amp; integration credentials
        </p>
      </div>

      <Section title="Account">
        <AccountForm key={profile?.id ?? "loading"} profile={profile} account={account} />
      </Section>

      <Section title="Password">
        <PasswordForm account={account} />
      </Section>

      <Section title="Growatt solar">
        <GrowattForm
          key={api?.growatt?.email ?? "g"}
          initialEmail={api?.growatt?.email ?? ""}
          configured={!!api?.growatt?.hasPassword}
          settings={settings}
          onSaved={refetchApi}
        />
      </Section>

      <Section title="Weather.com station">
        <WeatherForm
          key={api?.weather?.stationId ?? "w"}
          initialStationId={api?.weather?.stationId ?? ""}
          configured={!!api?.weather?.hasApiKey}
          settings={settings}
          onSaved={refetchApi}
        />
      </Section>
    </div>
  );
}

function ConfiguredBadge({ on }: { on: boolean }) {
  return (
    <span
      className={`ml-2 rounded-[var(--radius-pill)] px-2.5 py-1 text-[11px] font-bold ${
        on
          ? "bg-[rgba(52,211,153,0.13)] text-positive"
          : "bg-glass-fill text-text-muted"
      }`}
    >
      {on ? "Configured" : "Not set"}
    </span>
  );
}

function AccountForm({
  profile,
  account,
}: {
  profile: UserProfile | undefined;
  account: Core["account"];
}) {
  const [username, setUsername] = useState(profile?.username ?? "");
  const [email, setEmail] = useState(profile?.email ?? "");
  const [banner, setBanner] = useState<Banner>(null);
  const [saving, setSaving] = useState(false);

  if (!profile) {
    return <p className="text-sm text-text-muted">Loading…</p>;
  }

  async function save() {
    setBanner(null);
    setSaving(true);
    try {
      await account.updateUserProfile({ username, email });
      setBanner({ kind: "success", message: "Profile updated." });
    } catch (e) {
      setBanner({
        kind: "error",
        message: e instanceof Error ? e.message : "Could not update profile.",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      {banner ? <StatusBanner kind={banner.kind} message={banner.message} /> : null}
      <Field label="USERNAME" icon={User} value={username} onChange={(e) => setUsername(e.target.value)} />
      <Field label="EMAIL" icon={Mail} inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <Button label="Save profile" onClick={save} loading={saving} />
    </>
  );
}

function PasswordForm({ account }: { account: Core["account"] }) {
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [banner, setBanner] = useState<Banner>(null);
  const [saving, setSaving] = useState(false);

  async function save() {
    setBanner(null);
    if (pw.length < 4)
      return setBanner({ kind: "error", message: "Password must be at least 4 characters." });
    if (pw !== confirm)
      return setBanner({ kind: "error", message: "Passwords do not match." });
    setSaving(true);
    try {
      await account.updateUserPassword({ currentPassword: "", newPassword: pw });
      setBanner({ kind: "success", message: "Password changed." });
      setPw("");
      setConfirm("");
    } catch (e) {
      setBanner({
        kind: "error",
        message: e instanceof Error ? e.message : "Could not change password.",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      {banner ? <StatusBanner kind={banner.kind} message={banner.message} /> : null}
      <Field label="NEW PASSWORD" icon={KeyRound} secure value={pw} onChange={(e) => setPw(e.target.value)} />
      <Field label="CONFIRM PASSWORD" icon={KeyRound} secure value={confirm} onChange={(e) => setConfirm(e.target.value)} />
      <Button label="Change password" onClick={save} loading={saving} />
    </>
  );
}

function GrowattForm({
  initialEmail,
  configured,
  settings,
  onSaved,
}: {
  initialEmail: string;
  configured: boolean;
  settings: Core["settings"];
  onSaved: () => void;
}) {
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [banner, setBanner] = useState<Banner>(null);
  const [saving, setSaving] = useState(false);

  async function save() {
    setBanner(null);
    setSaving(true);
    try {
      await settings.saveGrowattApiSettings({ growatt: { email, password } });
      setBanner({ kind: "success", message: "Growatt credentials saved." });
      setPassword("");
      onSaved();
    } catch (e) {
      setBanner({
        kind: "error",
        message: e instanceof Error ? e.message : "Could not save credentials.",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <p className="mb-4 -mt-2 flex items-center text-sm text-text-muted">
        Used by the server to fetch your solar data.
        <ConfiguredBadge on={configured} />
      </p>
      {banner ? <StatusBanner kind={banner.kind} message={banner.message} /> : null}
      <Field label="ACCOUNT (EMAIL)" icon={Mail} inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <Field label="PASSWORD" icon={KeyRound} secure placeholder="Enter to update" value={password} onChange={(e) => setPassword(e.target.value)} />
      <Button label="Save Growatt credentials" gradient="energy" onClick={save} loading={saving} />
    </>
  );
}

function WeatherForm({
  initialStationId,
  configured,
  settings,
  onSaved,
}: {
  initialStationId: string;
  configured: boolean;
  settings: Core["settings"];
  onSaved: () => void;
}) {
  const [stationId, setStationId] = useState(initialStationId);
  const [apiKey, setApiKey] = useState("");
  const [banner, setBanner] = useState<Banner>(null);
  const [saving, setSaving] = useState(false);

  async function save() {
    setBanner(null);
    setSaving(true);
    try {
      await settings.saveWeatherApiSettings({ weather: { stationId, apiKey } });
      setBanner({ kind: "success", message: "Weather credentials saved." });
      setApiKey("");
      onSaved();
    } catch (e) {
      setBanner({
        kind: "error",
        message: e instanceof Error ? e.message : "Could not save credentials.",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <p className="mb-4 -mt-2 flex items-center text-sm text-text-muted">
        Personal weather station data source.
        <ConfiguredBadge on={configured} />
      </p>
      {banner ? <StatusBanner kind={banner.kind} message={banner.message} /> : null}
      <Field label="WEATHER STATION ID" icon={MapPin} placeholder="e.g. ISANDN24" value={stationId} onChange={(e) => setStationId(e.target.value)} />
      <Field label="API KEY" icon={SunMedium} secure placeholder="Enter to update" value={apiKey} onChange={(e) => setApiKey(e.target.value)} />
      <Button label="Save weather credentials" onClick={save} loading={saving} />
    </>
  );
}
