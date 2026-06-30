"use client";

import { registerAccountSchema } from "@hmi/core";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CloudSun,
  Key,
  Lock,
  Mail,
  MapPin,
  SunMedium,
  User,
  UserPlus,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import * as Yup from "yup";

import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { GlassCard } from "@/components/ui/GlassCard";
import { StatusBanner } from "@/components/ui/StatusBanner";
import { useCore } from "@/lib/hooks/useCore";
import { cn } from "@/lib/utils";

const STEPS = [
  { key: "account", label: "Account" },
  { key: "solar", label: "Solar" },
  { key: "weather", label: "Weather" },
] as const;

type Gradient = "solar" | "energy" | "accent";
const HEADERS: Record<
  number,
  { icon: LucideIcon; gradient: Gradient; title: string; subtitle: string }
> = {
  0: {
    icon: UserPlus,
    gradient: "accent",
    title: "Create account",
    subtitle: "Join your energy monitoring dashboard",
  },
  1: {
    icon: SunMedium,
    gradient: "energy",
    title: "Connect Growatt",
    subtitle: "Optional — add your solar credentials",
  },
  2: {
    icon: CloudSun,
    gradient: "solar",
    title: "Connect Weather.com",
    subtitle: "Optional — add your weather station",
  },
};

const GRADIENT_CSS: Record<Gradient, string> = {
  solar: "linear-gradient(135deg,#fde047,#fbbf24,#f59e0b)",
  energy: "linear-gradient(135deg,#5eead4,#2dd4bf,#10b981)",
  accent: "linear-gradient(135deg,#a78bfa,#818cf8,#6366f1)",
};

export default function RegisterPage() {
  const { auth, settings } = useCore();
  const router = useRouter();

  const [step, setStep] = useState(0);
  const [account, setAccount] = useState({
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
  });
  const [accountErrors, setAccountErrors] = useState<Record<string, string>>({});
  const [growatt, setGrowatt] = useState({ email: "", password: "" });
  const [weather, setWeather] = useState({ stationId: "", apiKey: "" });
  const [stepError, setStepError] = useState<string | null>(null);
  const [accountError, setAccountError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const setField =
    <T,>(setter: React.Dispatch<React.SetStateAction<T>>, key: keyof T) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setter((s) => ({ ...s, [key]: e.target.value }));

  const finalize = () => {
    router.replace("/dashboard");
    router.refresh();
  };

  async function handleCreateAccount() {
    setStepError(null);
    setAccountError(null);
    setAccountErrors({});
    try {
      await registerAccountSchema.validate(account, { abortEarly: false });
    } catch (err) {
      const map: Record<string, string> = {};
      if (err instanceof Yup.ValidationError) {
        err.inner.forEach((e) => {
          if (e.path && !map[e.path]) map[e.path] = e.message;
        });
      }
      setAccountErrors(map);
      return;
    }
    try {
      setSaving(true);
      await auth.registerUser({
        email: account.email.trim(),
        username: account.username.trim(),
        password: account.password,
      });
      setStep(1);
    } catch (e) {
      setAccountError(e instanceof Error ? e.message : "Registration failed. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveGrowatt() {
    setStepError(null);
    const email = growatt.email.trim();
    const password = growatt.password.trim();
    if (!email && !password) return setStep(2);
    if (!email || !password)
      return setStepError("Enter both account and password, or skip this step.");
    if (!email.includes("@")) return setStepError("Please enter a valid email address.");
    try {
      setSaving(true);
      await settings.saveGrowattApiSettings({ growatt: { email, password } });
      setStep(2);
    } catch {
      setStepError("Could not save Growatt credentials. You can add them later in Settings.");
    } finally {
      setSaving(false);
    }
  }

  async function handleFinish() {
    setStepError(null);
    const stationId = weather.stationId.trim();
    const apiKey = weather.apiKey.trim();
    if (!stationId && !apiKey) return finalize();
    if (!stationId || !apiKey)
      return setStepError("Enter both station ID and API key, or skip this step.");
    try {
      setSaving(true);
      await settings.saveWeatherApiSettings({ weather: { apiKey, stationId } });
      finalize();
    } catch {
      setStepError("Could not save weather credentials. You can add them later in Settings.");
    } finally {
      setSaving(false);
    }
  }

  const header = HEADERS[step];
  const HeaderIcon = header.icon;

  return (
    <GlassCard strong elevated className="w-full max-w-[460px] p-8 sm:p-9">
      <StepIndicator step={step} />

      <div className="mb-5 flex flex-col items-center text-center">
        <div
          className="mb-4 flex h-14 w-14 items-center justify-center rounded-[18px]"
          style={{ backgroundImage: GRADIENT_CSS[header.gradient] }}
        >
          <HeaderIcon size={20} className="text-text-inverse" />
        </div>
        <h1 className="text-[25px] font-extrabold tracking-tight text-text-primary">
          {header.title}
        </h1>
        <p className="mt-1.5 text-sm font-medium text-text-muted">{header.subtitle}</p>
      </div>

      {accountError ? <StatusBanner kind="error" message={accountError} /> : null}
      {stepError ? <StatusBanner kind="error" message={stepError} /> : null}

      {step === 0 ? (
        <div>
          <Field
            label="EMAIL ADDRESS"
            icon={Mail}
            inputMode="email"
            placeholder="you@domain.com"
            value={account.email}
            onChange={setField(setAccount, "email")}
            error={accountErrors.email}
            disabled={saving}
          />
          <Field
            label="USERNAME"
            icon={User}
            placeholder="Choose a username"
            value={account.username}
            onChange={setField(setAccount, "username")}
            error={accountErrors.username}
            disabled={saving}
          />
          <Field
            label="PASSWORD"
            icon={Lock}
            secure
            placeholder="Create a secure password"
            value={account.password}
            onChange={setField(setAccount, "password")}
            error={accountErrors.password}
            disabled={saving}
          />
          <Field
            label="CONFIRM PASSWORD"
            icon={Lock}
            secure
            placeholder="Re-enter your password"
            value={account.confirmPassword}
            onChange={setField(setAccount, "confirmPassword")}
            error={accountErrors.confirmPassword}
            disabled={saving}
          />
          <Button
            label="Create account"
            icon={ArrowRight}
            onClick={handleCreateAccount}
            loading={saving}
            className="mt-1.5"
          />
        </div>
      ) : null}

      {step === 1 ? (
        <div>
          <Field
            label="ACCOUNT (EMAIL)"
            icon={Mail}
            inputMode="email"
            placeholder="your-email@domain.com"
            value={growatt.email}
            onChange={setField(setGrowatt, "email")}
            disabled={saving}
          />
          <Field
            label="PASSWORD"
            icon={Key}
            secure
            placeholder="Enter your Growatt password"
            value={growatt.password}
            onChange={setField(setGrowatt, "password")}
            disabled={saving}
          />
          <p className="mb-4 mt-0.5 text-center text-[12.5px] font-medium leading-[18px] text-text-muted">
            Optional — you can add or change this anytime in Settings.
          </p>
          <div className="flex gap-3">
            <Button
              label="Skip"
              variant="ghost"
              onClick={() => {
                setStepError(null);
                setStep(2);
              }}
            />
            <Button
              label="Continue"
              icon={ArrowRight}
              gradient="energy"
              onClick={handleSaveGrowatt}
              loading={saving}
            />
          </div>
        </div>
      ) : null}

      {step === 2 ? (
        <div>
          <Field
            label="WEATHER STATION ID"
            icon={MapPin}
            placeholder="e.g. ISANDN24"
            hint="Find your local station ID at weather.com/weather/map"
            value={weather.stationId}
            onChange={setField(setWeather, "stationId")}
            disabled={saving}
          />
          <Field
            label="API KEY"
            icon={Key}
            secure
            placeholder="Enter your Weather.com API key"
            hint="Get your API key from the weather.com developer portal"
            value={weather.apiKey}
            onChange={setField(setWeather, "apiKey")}
            disabled={saving}
          />
          <p className="mb-4 mt-0.5 text-center text-[12.5px] font-medium leading-[18px] text-text-muted">
            Optional — you can add or change this anytime in Settings.
          </p>
          <div className="flex gap-3">
            <Button
              label="Back"
              variant="ghost"
              icon={ArrowLeft}
              onClick={() => {
                setStepError(null);
                setStep(1);
              }}
            />
            <Button label="Finish" icon={Check} onClick={handleFinish} loading={saving} />
          </div>
        </div>
      ) : null}

      {step === 0 ? (
        <div className="mt-6 flex items-center justify-center gap-1.5 border-t border-glass-border pt-5">
          <span className="text-sm font-medium text-text-muted">Already have an account?</span>
          <Link href="/login" className="text-sm font-extrabold text-solar-light">
            Sign in
          </Link>
        </div>
      ) : null}
    </GlassCard>
  );
}

function StepIndicator({ step }: { step: number }) {
  return (
    <div className="mb-5 flex items-center justify-center">
      {STEPS.map((s, i) => {
        const done = i < step;
        const active = i === step;
        return (
          <div key={s.key} className="flex items-center">
            <div className="flex w-16 flex-col items-center">
              <div
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full border text-xs font-extrabold",
                  done && "border-solar bg-solar text-text-inverse",
                  active && !done && "border-solar bg-solar-soft text-solar-light",
                  !active && !done && "border-glass-border-strong bg-glass-fill text-text-muted",
                )}
              >
                {done ? <Check size={12} /> : i + 1}
              </div>
              <span
                className={cn(
                  "mt-1.5 text-[11px] font-bold",
                  active ? "text-text-secondary" : "text-text-muted",
                )}
              >
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 ? (
              <div
                className={cn(
                  "-mt-4 h-0.5 w-10 rounded",
                  i < step ? "bg-solar" : "bg-glass-border-strong",
                )}
              />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
