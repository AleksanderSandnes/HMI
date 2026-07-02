"use client";

import {
  growattConfig,
  weatherConfig,
  type ApiSettingsResponse,
  type UserProfile,
} from "@hmi/core";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Camera,
  CloudSun,
  KeyRound,
  type LucideIcon,
  Mail,
  MapPin,
  Moon,
  ShieldCheck,
  SunMedium,
  User,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";

import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { GlassCard } from "@/components/ui/GlassCard";
import { StatusBanner } from "@/components/ui/StatusBanner";
import { Toggle } from "@/components/ui/Toggle";
import { useCore } from "@/lib/hooks/useCore";

type Core = ReturnType<typeof useCore>;
type Banner = { kind: "success" | "error"; message: string } | null;

const SECTION_GRADIENTS: Record<string, string> = {
  accent: "linear-gradient(135deg,#a78bfa,#818cf8,#6366f1)",
  revenue: "linear-gradient(135deg,#fde68a,#facc15,#eab308)",
  energy: "linear-gradient(135deg,#5eead4,#2dd4bf,#10b981)",
  solar: "linear-gradient(135deg,#fde047,#fbbf24,#f59e0b)",
  preferences: "linear-gradient(135deg,#818cf8,#6366f1,#4f46e5)",
};

function Section({
  title,
  icon: Icon,
  gradient,
  children,
}: {
  title: string;
  icon: LucideIcon;
  gradient: keyof typeof SECTION_GRADIENTS;
  children: React.ReactNode;
}) {
  return (
    <GlassCard strong className="p-5">
      <div className="mb-4 flex items-center gap-2.5">
        <span
          className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-md)]"
          style={{ backgroundImage: SECTION_GRADIENTS[gradient] }}
        >
          <Icon size={16} className="text-text-inverse" />
        </span>
        <h2 className="text-base font-extrabold text-text-primary">{title}</h2>
      </div>
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
  useEffect(() => settings.subscribeSettings(() => void refetchApi()), [settings, refetchApi]);

  const gc = growattConfig(api);
  const wc = weatherConfig(api);

  return (
    <div className="mx-auto flex w-full max-w-[1040px] flex-col gap-5">
      <div>
        <h1 className="text-[30px] font-extrabold tracking-[-0.8px] text-text-primary">Settings</h1>
        <p className="mt-1 text-[14.5px] font-medium text-text-muted">
          Account &amp; integration credentials
        </p>
      </div>

      {/* Two columns on desktop: account on the left, integrations on the right,
          so everything fits one viewport without scrolling. */}
      {/* Row 1: integrations (Growatt + Weather) · Row 2: Account + Password. */}
      <div className="grid items-start gap-4 lg:grid-cols-2">
        <Section title="Growatt solar" icon={SunMedium} gradient="energy">
          <GrowattForm
            key={gc.key}
            initialEmail={gc.email}
            configured={gc.configured}
            settings={settings}
            onSaved={refetchApi}
          />
        </Section>

        <Section title="Weather.com station" icon={CloudSun} gradient="solar">
          <WeatherForm
            key={wc.key}
            initialStationId={wc.station}
            configured={wc.configured}
            settings={settings}
            onSaved={refetchApi}
          />
        </Section>

        <Section title="Account" icon={User} gradient="accent">
          <AccountForm key={profile?.id ?? "loading"} profile={profile} account={account} />
        </Section>

        <Section title="Password" icon={ShieldCheck} gradient="revenue">
          <PasswordForm account={account} />
        </Section>
      </div>

      <Section title="Preferences" icon={Moon} gradient="preferences">
        <PreferencesForm />
      </Section>
    </div>
  );
}

const noopSubscribe = () => () => {};

/** True only after client hydration; false during SSR and the first paint. */
function useHydrated() {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}

function PreferencesForm() {
  const { resolvedTheme, setTheme } = useTheme();
  // next-themes resolves the theme only on the client; gate on hydration so the
  // toggle renders a stable value during SSR and avoids a hydration mismatch.
  const hydrated = useHydrated();
  const isDark = hydrated && resolvedTheme === "dark";

  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-semibold text-text-primary">Dark theme</p>
        <p className="text-[13px] text-text-muted">{isDark ? "Dark" : "Light"}</p>
      </div>
      <Toggle
        value={isDark}
        disabled={!hydrated}
        onChange={(v) => setTheme(v ? "dark" : "light")}
      />
    </div>
  );
}

function ConfiguredBadge({ on }: { on: boolean }) {
  return (
    <span
      className={`ml-2 rounded-[var(--radius-pill)] px-2.5 py-1 text-[11px] font-bold ${
        on ? "bg-[rgba(52,211,153,0.13)] text-positive" : "bg-glass-fill text-text-muted"
      }`}
    >
      {on ? "Configured" : "Not set"}
    </span>
  );
}

/** First letters of the first two words, else the first two characters. */
function deriveInitials(name?: string | null): string {
  if (!name) return "·";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.trim().slice(0, 2).toUpperCase();
}

/** Best-effort file extension from the filename, falling back to the mime type. */
function extractExtension(file: File): string {
  const dot = file.name.lastIndexOf(".");
  if (dot > 0 && dot < file.name.length - 1) {
    return file.name.slice(dot + 1).toLowerCase();
  }
  return file.type.split("/")[1] || "jpg";
}

/** Upload/remove avatar state + handlers, keeping the profile query cache in sync. */
function useAvatarActions(account: Core["account"]) {
  const queryClient = useQueryClient();
  const [banner, setBanner] = useState<Banner>(null);
  const [busy, setBusy] = useState(false);

  function syncProfile(updated: UserProfile) {
    queryClient.setQueryData(["profile"], updated);
    return queryClient.invalidateQueries({ queryKey: ["profile"] });
  }

  async function run(action: () => Promise<UserProfile>, failure: string) {
    setBanner(null);
    setBusy(true);
    try {
      await syncProfile(await action());
    } catch (err) {
      setBanner({ kind: "error", message: err instanceof Error ? err.message : failure });
    } finally {
      setBusy(false);
    }
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // let the same file be re-picked later
    if (!file) return;
    await run(
      () =>
        account.uploadAvatar({
          data: file,
          contentType: file.type || "image/jpeg",
          extension: extractExtension(file),
        }),
      "Could not upload photo.",
    );
  }

  const remove = () => run(() => account.removeAvatar(), "Could not remove photo.");

  return { banner, busy, onFile, remove };
}

function AvatarPicker({ profile, account }: { profile: UserProfile; account: Core["account"] }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { banner, busy, onFile, remove } = useAvatarActions(account);

  return (
    <div className="mb-4 flex flex-col items-center gap-2">
      {banner ? <StatusBanner kind={banner.kind} message={banner.message} /> : null}
      <div className="relative">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          aria-label="Change photo"
          className="block rounded-full transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Avatar initials={deriveInitials(profile.username)} url={profile.avatarUrl} size={84} />
          <span
            className="absolute -bottom-0.5 -right-0.5 flex h-7 w-7 items-center justify-center rounded-full border-[3px] border-bg-base"
            style={{ backgroundImage: SECTION_GRADIENTS.accent }}
          >
            <Camera size={13} className="text-text-inverse" />
          </span>
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={(e) => void onFile(e)}
        />
      </div>
      {profile.avatarUrl ? (
        <button
          type="button"
          onClick={() => void remove()}
          disabled={busy}
          className="text-[13px] font-bold text-text-muted transition hover:text-text-secondary disabled:cursor-not-allowed disabled:opacity-60"
        >
          Remove photo
        </button>
      ) : null}
    </div>
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
      <AvatarPicker profile={profile} account={account} />
      {banner ? <StatusBanner kind={banner.kind} message={banner.message} /> : null}
      <Field
        label="USERNAME"
        icon={User}
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      <Field
        label="EMAIL"
        icon={Mail}
        inputMode="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
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
    if (pw !== confirm) return setBanner({ kind: "error", message: "Passwords do not match." });
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
      <Field
        label="NEW PASSWORD"
        icon={KeyRound}
        secure
        value={pw}
        onChange={(e) => setPw(e.target.value)}
      />
      <Field
        label="CONFIRM PASSWORD"
        icon={KeyRound}
        secure
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
      />
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
      <Field
        label="ACCOUNT (EMAIL)"
        icon={Mail}
        inputMode="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <Field
        label="PASSWORD"
        icon={KeyRound}
        secure
        placeholder="Enter to update"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
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
      <Field
        label="WEATHER STATION ID"
        icon={MapPin}
        placeholder="e.g. ISANDN24"
        value={stationId}
        onChange={(e) => setStationId(e.target.value)}
      />
      <Field
        label="API KEY"
        icon={SunMedium}
        secure
        placeholder="Enter to update"
        value={apiKey}
        onChange={(e) => setApiKey(e.target.value)}
      />
      <Button label="Save weather credentials" onClick={save} loading={saving} />
    </>
  );
}
