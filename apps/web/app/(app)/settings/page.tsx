"use client";

import {
  growattConfig,
  weatherConfig,
  LANGUAGES,
  type ApiSettingsResponse,
  type Locale,
  type Translator,
  type UserProfile,
} from "@hmi/core";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Camera,
  Check,
  ChevronRight,
  CloudSun,
  Contrast,
  KeyRound,
  Languages,
  LogOut,
  Mail,
  MapPin,
  Monitor,
  Moon,
  ShieldCheck,
  Sun,
  SunMedium,
  User,
  type LucideIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";

import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { GlassCard } from "@/components/ui/GlassCard";
import { StatusBanner } from "@/components/ui/StatusBanner";
import { useCore } from "@/lib/hooks/useCore";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type Core = ReturnType<typeof useCore>;
type Banner = { kind: "success" | "error"; message: string } | null;
type Section = "profile" | "password" | "growatt" | "weather";

const GRADIENTS = {
  accent: "linear-gradient(135deg,#a78bfa,#818cf8,#6366f1)",
  revenue: "linear-gradient(135deg,#fde68a,#facc15,#eab308)",
  energy: "linear-gradient(135deg,#5eead4,#2dd4bf,#10b981)",
  solar: "linear-gradient(135deg,#fde047,#fbbf24,#f59e0b)",
  preferences: "linear-gradient(135deg,#818cf8,#6366f1,#4f46e5)",
} as const;
type Gradient = keyof typeof GRADIENTS;

const noopSubscribe = () => () => {};

/** True only after client hydration; false during SSR and the first paint. */
function useHydrated() {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
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

function ConfiguredBadge({ on }: { on: boolean }) {
  const { t } = useI18n();
  return (
    <span
      className={cn(
        "rounded-[var(--radius-pill)] px-2.5 py-1 text-[11px] font-bold",
        on ? "bg-[rgba(52,211,153,0.13)] text-positive" : "bg-glass-fill text-text-muted",
      )}
    >
      {on ? t("settings.connected") : t("settings.notSet")}
    </span>
  );
}

/** A row inside a grouped card (Account/Integrations) — icon chip, title, optional subtitle/badge, chevron. */
function HubRow({
  icon: Icon,
  gradient,
  title,
  subtitle,
  badge,
  active,
  onClick,
}: {
  icon: LucideIcon;
  gradient: Gradient;
  title: string;
  subtitle?: string;
  badge?: ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 px-3.5 py-3 text-left transition",
        active ? "bg-glass-fill" : "hover:bg-glass-fill",
      )}
    >
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px]"
        style={{ backgroundImage: GRADIENTS[gradient] }}
      >
        <Icon size={18} className="text-text-inverse" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[13.5px] font-bold text-text-primary">{title}</span>
        {subtitle ? (
          <span className="mt-px block text-[11px] text-text-muted">{subtitle}</span>
        ) : null}
      </span>
      {badge}
      <ChevronRight size={17} className="shrink-0 text-text-muted" />
    </button>
  );
}

/** The standalone profile row at the top of the list — avatar instead of an icon chip. */
function ProfileHubRow({
  profile,
  active,
  onClick,
}: {
  profile: UserProfile | undefined;
  active: boolean;
  onClick: () => void;
}) {
  const { t } = useI18n();
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3.5 rounded-[18px] border p-3.5 text-left backdrop-blur-xl transition",
        active
          ? "border-glass-border-strong bg-glass-fill"
          : "border-glass-border-strong bg-glass-fill-strong hover:bg-glass-fill",
      )}
    >
      <Avatar initials={deriveInitials(profile?.username)} url={profile?.avatarUrl} size={48} />
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-extrabold text-text-primary">
          {profile?.username ?? t("settings.yourProfile")}
        </span>
        <span className="mt-0.5 block truncate text-xs text-text-muted">
          {profile?.email ?? "—"}
        </span>
      </span>
      <ChevronRight size={18} className="shrink-0 text-text-muted" />
    </button>
  );
}

function GroupLabel({ children }: { children: ReactNode }) {
  return (
    <p className="ml-1.5 mt-1.5 text-[10.5px] font-bold tracking-[0.6px] text-text-muted">
      {children}
    </p>
  );
}

function appearanceLabel(
  hydrated: boolean,
  theme: string | undefined,
  resolvedTheme: string | undefined,
  t: Translator,
): string {
  if (!hydrated) return "—";
  const mode = resolvedTheme === "dark" ? t("settings.dark") : t("settings.light");
  if (theme === "system") return t("settings.systemRightNow", { mode });
  return mode;
}

const APPEARANCE_OPTIONS = [
  { value: "light", labelKey: "settings.light", icon: Sun },
  { value: "system", labelKey: "settings.system", icon: Monitor },
  { value: "dark", labelKey: "settings.dark", icon: Moon },
] as const;

function AppearanceCard() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const { t } = useI18n();
  const hydrated = useHydrated();

  return (
    <>
      <GroupLabel>{t("settings.preferences")}</GroupLabel>
      <div className="overflow-hidden rounded-[18px] border border-glass-border-strong bg-glass-fill-strong backdrop-blur-xl">
        <div className="flex flex-col gap-2.5 px-3.5 py-3">
          <div className="flex items-center gap-3">
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px]"
              style={{ backgroundImage: GRADIENTS.preferences }}
            >
              <Contrast size={18} className="text-text-inverse" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[13.5px] font-bold text-text-primary">
                {t("settings.appearance")}
              </span>
              <span className="mt-px block text-[11px] text-text-muted">
                {appearanceLabel(hydrated, theme, resolvedTheme, t)}
              </span>
            </span>
          </div>
          <div className="flex gap-[3px] rounded-xl border border-glass-border bg-glass-fill-subtle p-[3px]">
            {APPEARANCE_OPTIONS.map(({ value, labelKey, icon: Icon }) => {
              const active = hydrated && theme === value;
              return (
                <button
                  key={value}
                  type="button"
                  disabled={!hydrated}
                  onClick={() => setTheme(value)}
                  aria-pressed={active}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-1.5 rounded-[9px] py-1.5 text-xs font-bold transition",
                    active
                      ? "bg-glass-fill-strong text-text-primary shadow-[0_1px_5px_rgba(0,0,0,0.18)]"
                      : "text-text-secondary hover:text-text-primary",
                  )}
                >
                  <Icon size={14} />
                  {t(labelKey)}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}

function LanguageListbox({
  locale,
  label,
  onPick,
}: {
  locale: string;
  label: string;
  onPick: (code: Locale) => void;
}) {
  return (
    <div
      role="listbox"
      aria-label={label}
      className="absolute left-3.5 right-3.5 top-full z-20 mt-1.5 overflow-hidden rounded-[14px] border border-glass-border-strong bg-glass-fill-strong shadow-[0_10px_36px_rgba(0,0,0,0.28)] backdrop-blur-xl"
    >
      {LANGUAGES.map((lang) => {
        const active = lang.code === locale;
        return (
          <button
            key={lang.code}
            type="button"
            role="option"
            aria-selected={active}
            onClick={() => onPick(lang.code)}
            className={cn(
              "flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-[13px] transition",
              active
                ? "bg-glass-fill font-bold text-text-primary"
                : "text-text-secondary hover:bg-glass-fill hover:text-text-primary",
            )}
          >
            <span className="flex-1">{lang.label}</span>
            {active ? <Check size={15} /> : null}
          </button>
        );
      })}
    </div>
  );
}

/** Language row in the Preferences group — opens a small popover listing the
 * supported languages; picking one re-renders every translation instantly. */
function LanguageCard() {
  const { locale, setLocale, t } = useI18n();
  const hydrated = useHydrated();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const current = LANGUAGES.find((l) => l.code === locale);

  return (
    <div
      ref={rootRef}
      className="relative overflow-visible rounded-[18px] border border-glass-border-strong bg-glass-fill-strong backdrop-blur-xl"
    >
      <button
        type="button"
        disabled={!hydrated}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-3.5 py-3 text-left transition hover:bg-glass-fill"
      >
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px]"
          style={{ backgroundImage: GRADIENTS.preferences }}
        >
          <Languages size={18} className="text-text-inverse" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[13.5px] font-bold text-text-primary">
            {t("common.language")}
          </span>
          <span className="mt-px block text-[11px] text-text-muted">
            {hydrated ? (current?.label ?? locale) : "—"}
          </span>
        </span>
        <ChevronRight
          size={17}
          className={cn("shrink-0 text-text-muted transition-transform", open && "rotate-90")}
        />
      </button>
      {open ? (
        <LanguageListbox
          locale={locale}
          label={t("common.language")}
          onPick={(code) => {
            setLocale(code);
            setOpen(false);
          }}
        />
      ) : null}
    </div>
  );
}

/** Icon chip + title + subtitle header shared by every detail panel, with an optional badge. */
function PanelHeader({
  icon: Icon,
  gradient,
  title,
  subtitle,
  badge,
}: {
  icon: LucideIcon;
  gradient: Gradient;
  title: string;
  subtitle: string;
  badge?: ReactNode;
}) {
  return (
    <>
      <div className="flex items-center gap-3.5">
        <span
          className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-[13px]"
          style={{ backgroundImage: GRADIENTS[gradient] }}
        >
          <Icon size={21} className="text-text-inverse" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-lg font-extrabold tracking-[-0.3px] text-text-primary">
            {title}
          </span>
          <span className="mt-0.5 block text-[12.5px] text-text-muted">{subtitle}</span>
        </span>
        {badge}
      </div>
      <div className="my-[18px] h-px bg-glass-border" />
    </>
  );
}

/** Upload/remove avatar state + handlers, keeping the profile query cache in sync. */
function useAvatarActions(account: Core["account"]) {
  const { t } = useI18n();
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
      t("settings.couldNotUploadPhoto"),
    );
  }

  const remove = () => run(() => account.removeAvatar(), t("settings.couldNotRemovePhoto"));

  return { banner, busy, onFile, remove };
}

function AvatarPicker({ profile, account }: { profile: UserProfile; account: Core["account"] }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { t } = useI18n();
  const { banner, busy, onFile, remove } = useAvatarActions(account);

  return (
    <div className="mb-6 flex flex-col items-center gap-2">
      {banner ? <StatusBanner kind={banner.kind} message={banner.message} /> : null}
      <div className="relative">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          aria-label={t("a11y.changePhoto")}
          className="block rounded-full transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Avatar initials={deriveInitials(profile.username)} url={profile.avatarUrl} size={84} />
          <span
            className="absolute -bottom-0.5 -right-0.5 flex h-7 w-7 items-center justify-center rounded-full border-[3px] border-bg-base"
            style={{ backgroundImage: GRADIENTS.accent }}
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
          {t("settings.removePhoto")}
        </button>
      ) : null}
    </div>
  );
}

function ProfilePanel({
  profile,
  account,
}: {
  profile: UserProfile | undefined;
  account: Core["account"];
}) {
  const { t } = useI18n();
  const [username, setUsername] = useState(profile?.username ?? "");
  const [email, setEmail] = useState(profile?.email ?? "");
  const [banner, setBanner] = useState<Banner>(null);
  const [saving, setSaving] = useState(false);

  async function save() {
    setBanner(null);
    setSaving(true);
    try {
      await account.updateUserProfile({ username, email });
      setBanner({ kind: "success", message: t("settings.profileUpdated") });
    } catch (e) {
      setBanner({
        kind: "error",
        message: e instanceof Error ? e.message : t("settings.couldNotUpdateProfile"),
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <GlassCard strong className="p-7">
      <PanelHeader
        icon={User}
        gradient="accent"
        title={t("settings.profile")}
        subtitle={t("settings.profileSubtitle")}
      />
      {profile ? (
        <>
          <AvatarPicker profile={profile} account={account} />
          {banner ? <StatusBanner kind={banner.kind} message={banner.message} /> : null}
          <div className="grid grid-cols-2 gap-4">
            <Field
              label={t("settings.usernameLabel")}
              icon={User}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <Field
              label={t("settings.emailLabel")}
              icon={Mail}
              inputMode="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="flex justify-end">
            <Button
              label={t("settings.saveProfile")}
              onClick={save}
              loading={saving}
              className="w-auto px-6"
            />
          </div>
        </>
      ) : (
        <p className="text-sm text-text-muted">{t("common.loading")}</p>
      )}
    </GlassCard>
  );
}

function PasswordPanel({ account }: { account: Core["account"] }) {
  const { t } = useI18n();
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [banner, setBanner] = useState<Banner>(null);
  const [saving, setSaving] = useState(false);

  async function save() {
    setBanner(null);
    if (pw.length < 4) return setBanner({ kind: "error", message: t("validation.passwordMin") });
    if (pw !== confirm)
      return setBanner({ kind: "error", message: t("settings.passwordsDoNotMatch") });
    setSaving(true);
    try {
      await account.updateUserPassword({ currentPassword: "", newPassword: pw });
      setBanner({ kind: "success", message: t("settings.passwordChanged") });
      setPw("");
      setConfirm("");
    } catch (e) {
      setBanner({
        kind: "error",
        message: e instanceof Error ? e.message : t("settings.couldNotChangePassword"),
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <GlassCard strong className="p-7">
      <PanelHeader
        icon={ShieldCheck}
        gradient="revenue"
        title={t("settings.changePassword")}
        subtitle={t("settings.changePasswordSubtitle")}
      />
      {banner ? <StatusBanner kind={banner.kind} message={banner.message} /> : null}
      <div className="grid grid-cols-2 gap-4">
        <Field
          label={t("settings.newPasswordLabel")}
          icon={KeyRound}
          secure
          value={pw}
          onChange={(e) => setPw(e.target.value)}
        />
        <Field
          label={t("settings.confirmPasswordLabel")}
          icon={KeyRound}
          secure
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
      </div>
      <div className="flex justify-end">
        <Button
          label={t("settings.changePassword")}
          gradient="revenue"
          onClick={save}
          loading={saving}
          className="w-auto px-6"
        />
      </div>
    </GlassCard>
  );
}

function GrowattPanel({
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
  const { t } = useI18n();
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [banner, setBanner] = useState<Banner>(null);
  const [saving, setSaving] = useState(false);

  async function save() {
    setBanner(null);
    setSaving(true);
    try {
      await settings.saveGrowattApiSettings({ growatt: { email, password } });
      setBanner({ kind: "success", message: t("settings.growattSaved") });
      setPassword("");
      onSaved();
    } catch (e) {
      setBanner({
        kind: "error",
        message: e instanceof Error ? e.message : t("settings.couldNotSaveCredentials"),
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <GlassCard strong className="p-7">
      <PanelHeader
        icon={SunMedium}
        gradient="energy"
        title={t("settings.growatt")}
        subtitle={t("settings.growattPanelSubtitle")}
        badge={<ConfiguredBadge on={configured} />}
      />
      {banner ? <StatusBanner kind={banner.kind} message={banner.message} /> : null}
      <div className="grid grid-cols-2 gap-4">
        <Field
          label={t("settings.accountEmailLabel")}
          icon={Mail}
          inputMode="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Field
          label={t("settings.passwordLabel")}
          icon={KeyRound}
          secure
          placeholder={t("settings.enterToUpdate")}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      <div className="flex justify-end">
        <Button
          label={t("settings.saveCredentials")}
          gradient="energy"
          onClick={save}
          loading={saving}
          className="w-auto px-6"
        />
      </div>
    </GlassCard>
  );
}

function WeatherPanel({
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
  const { t } = useI18n();
  const [stationId, setStationId] = useState(initialStationId);
  const [apiKey, setApiKey] = useState("");
  const [banner, setBanner] = useState<Banner>(null);
  const [saving, setSaving] = useState(false);

  async function save() {
    setBanner(null);
    setSaving(true);
    try {
      await settings.saveWeatherApiSettings({ weather: { stationId, apiKey } });
      setBanner({ kind: "success", message: t("settings.weatherSaved") });
      setApiKey("");
      onSaved();
    } catch (e) {
      setBanner({
        kind: "error",
        message: e instanceof Error ? e.message : t("settings.couldNotSaveCredentials"),
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <GlassCard strong className="p-7">
      <PanelHeader
        icon={CloudSun}
        gradient="solar"
        title={t("settings.weatherStation")}
        subtitle={t("settings.weatherPanelSubtitle")}
        badge={<ConfiguredBadge on={configured} />}
      />
      {banner ? <StatusBanner kind={banner.kind} message={banner.message} /> : null}
      <div className="grid grid-cols-2 gap-4">
        <Field
          label={t("settings.stationIdLabel")}
          icon={MapPin}
          placeholder={t("settings.stationIdPlaceholder")}
          value={stationId}
          onChange={(e) => setStationId(e.target.value)}
        />
        <Field
          label={t("settings.apiKeyLabel")}
          icon={SunMedium}
          secure
          placeholder={t("settings.enterToUpdate")}
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
        />
      </div>
      <div className="flex justify-end">
        <Button
          label={t("settings.saveCredentials")}
          onClick={save}
          loading={saving}
          className="w-auto px-6"
        />
      </div>
    </GlassCard>
  );
}

function SettingsList({
  section,
  onSelect,
  profile,
  gc,
  wc,
  onSignOut,
}: {
  section: Section;
  onSelect: (s: Section) => void;
  profile: UserProfile | undefined;
  gc: ReturnType<typeof growattConfig>;
  wc: ReturnType<typeof weatherConfig>;
  onSignOut: () => void;
}) {
  const { t } = useI18n();
  return (
    <div className="flex w-[370px] shrink-0 flex-col gap-2.5">
      <ProfileHubRow
        profile={profile}
        active={section === "profile"}
        onClick={() => onSelect("profile")}
      />

      <GroupLabel>{t("settings.account")}</GroupLabel>
      <div className="overflow-hidden rounded-[18px] border border-glass-border-strong bg-glass-fill-strong backdrop-blur-xl">
        <HubRow
          icon={ShieldCheck}
          gradient="revenue"
          title={t("settings.changePassword")}
          active={section === "password"}
          onClick={() => onSelect("password")}
        />
      </div>

      <GroupLabel>{t("settings.integrations")}</GroupLabel>
      <div className="overflow-hidden rounded-[18px] border border-glass-border-strong bg-glass-fill-strong backdrop-blur-xl">
        <HubRow
          icon={SunMedium}
          gradient="energy"
          title={t("settings.growatt")}
          subtitle={t("settings.growattSubtitle")}
          badge={<ConfiguredBadge on={gc.configured} />}
          active={section === "growatt"}
          onClick={() => onSelect("growatt")}
        />
        <div className="ml-[62px] h-px bg-glass-border" />
        <HubRow
          icon={CloudSun}
          gradient="solar"
          title={t("settings.weatherStation")}
          subtitle={wc.station ? `${wc.station} · Sandnes` : t("settings.notConfigured")}
          badge={<ConfiguredBadge on={wc.configured} />}
          active={section === "weather"}
          onClick={() => onSelect("weather")}
        />
      </div>

      <AppearanceCard />
      <LanguageCard />

      <Button
        label={t("settings.signOut")}
        icon={LogOut}
        variant="danger"
        onClick={onSignOut}
        className="mt-1.5"
      />
    </div>
  );
}

export default function SettingsPage() {
  const { t } = useI18n();
  const [section, setSection] = useState<Section>("profile");
  const { account, settings, auth } = useCore();
  const router = useRouter();

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

  async function signOut() {
    await auth.logout();
    router.replace("/login");
    router.refresh();
  }

  return (
    <div className="mx-auto flex w-full max-w-[1100px] flex-col gap-[22px]">
      <div>
        <h1 className="text-[28px] font-extrabold tracking-[-0.8px] text-text-primary">
          {t("settings.title")}
        </h1>
        <p className="mt-1 text-sm font-medium text-text-muted">{t("settings.subtitle")}</p>
      </div>

      <div className="flex items-start gap-6">
        <SettingsList
          section={section}
          onSelect={setSection}
          profile={profile}
          gc={gc}
          wc={wc}
          onSignOut={() => void signOut()}
        />

        <div className="min-h-[520px] min-w-0 flex-1">
          {section === "profile" ? <ProfilePanel profile={profile} account={account} /> : null}
          {section === "growatt" ? (
            <GrowattPanel
              key={gc.key}
              initialEmail={gc.email}
              configured={gc.configured}
              settings={settings}
              onSaved={refetchApi}
            />
          ) : null}
          {section === "weather" ? (
            <WeatherPanel
              key={wc.key}
              initialStationId={wc.station}
              configured={wc.configured}
              settings={settings}
              onSaved={refetchApi}
            />
          ) : null}
          {section === "password" ? <PasswordPanel account={account} /> : null}
        </div>
      </div>
    </div>
  );
}
