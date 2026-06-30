"use client";

import { registerAccountSchema } from "@hmi/core";
import { ArrowLeft, ArrowRight, Check, Key, Lock, Mail, MapPin, User } from "lucide-react";
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

const HEADERS: Record<number, { title: string; subtitle: string }> = {
  0: {
    title: "Create account",
    subtitle: "Join your energy monitoring dashboard",
  },
  1: {
    title: "Connect Growatt",
    subtitle: "Optional — add your solar credentials",
  },
  2: {
    title: "Connect Weather.com",
    subtitle: "Optional — add your weather station",
  },
};

type Core = ReturnType<typeof useCore>;
type Setter<T> = (v: T) => void;

interface AccountState {
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
}

function validateAccount(account: AccountState): Record<string, string> {
  try {
    registerAccountSchema.validateSync(account, { abortEarly: false });
    return {};
  } catch (err) {
    const map: Record<string, string> = {};
    if (err instanceof Yup.ValidationError) {
      err.inner.forEach((e) => {
        if (e.path && !map[e.path]) map[e.path] = e.message;
      });
    }
    return map;
  }
}

interface CreateAccountDeps {
  auth: Core["auth"];
  account: AccountState;
  setStep: Setter<number>;
  setSaving: Setter<boolean>;
  setStepError: Setter<string | null>;
  setAccountError: Setter<string | null>;
  setAccountErrors: Setter<Record<string, string>>;
}

async function runCreateAccount(d: CreateAccountDeps) {
  d.setStepError(null);
  d.setAccountError(null);
  const errs = validateAccount(d.account);
  d.setAccountErrors(errs);
  if (Object.keys(errs).length) return;
  d.setSaving(true);
  try {
    await d.auth.registerUser({
      email: d.account.email.trim(),
      username: d.account.username.trim(),
      password: d.account.password,
    });
    d.setStep(1);
  } catch (e) {
    d.setAccountError(e instanceof Error ? e.message : "Registration failed. Please try again.");
  } finally {
    d.setSaving(false);
  }
}

interface SaveGrowattDeps {
  settings: Core["settings"];
  growatt: { email: string; password: string };
  setStep: Setter<number>;
  setSaving: Setter<boolean>;
  setStepError: Setter<string | null>;
}

async function runSaveGrowatt(d: SaveGrowattDeps) {
  d.setStepError(null);
  const email = d.growatt.email.trim();
  const password = d.growatt.password.trim();
  if (!email && !password) return d.setStep(2);
  if (!email || !password)
    return d.setStepError("Enter both account and password, or skip this step.");
  if (!email.includes("@")) return d.setStepError("Please enter a valid email address.");
  d.setSaving(true);
  try {
    await d.settings.saveGrowattApiSettings({ growatt: { email, password } });
    d.setStep(2);
  } catch {
    d.setStepError("Could not save Growatt credentials. You can add them later in Settings.");
  } finally {
    d.setSaving(false);
  }
}

interface FinishDeps {
  settings: Core["settings"];
  weather: { stationId: string; apiKey: string };
  done: () => void;
  setSaving: Setter<boolean>;
  setStepError: Setter<string | null>;
}

async function runFinish(d: FinishDeps) {
  d.setStepError(null);
  const stationId = d.weather.stationId.trim();
  const apiKey = d.weather.apiKey.trim();
  if (!stationId && !apiKey) return d.done();
  if (!stationId || !apiKey)
    return d.setStepError("Enter both station ID and API key, or skip this step.");
  d.setSaving(true);
  try {
    await d.settings.saveWeatherApiSettings({ weather: { apiKey, stationId } });
    d.done();
  } catch {
    d.setStepError("Could not save weather credentials. You can add them later in Settings.");
  } finally {
    d.setSaving(false);
  }
}

function useRegisterFlow() {
  const { auth, settings } = useCore();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [account, setAccount] = useState<AccountState>({
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

  const finalize = () => {
    router.replace("/dashboard");
    router.refresh();
  };

  return {
    step,
    setStep,
    account,
    setAccount,
    accountErrors,
    growatt,
    setGrowatt,
    weather,
    setWeather,
    stepError,
    setStepError,
    accountError,
    saving,
    createAccount: () =>
      runCreateAccount({
        auth,
        account,
        setStep,
        setSaving,
        setStepError,
        setAccountError,
        setAccountErrors,
      }),
    saveGrowatt: () => runSaveGrowatt({ settings, growatt, setStep, setSaving, setStepError }),
    finish: () => runFinish({ settings, weather, done: finalize, setSaving, setStepError }),
  };
}

type RegisterFlow = ReturnType<typeof useRegisterFlow>;

const setField =
  <T,>(setter: React.Dispatch<React.SetStateAction<T>>, key: keyof T) =>
  (e: React.ChangeEvent<HTMLInputElement>) =>
    setter((s) => ({ ...s, [key]: e.target.value }));

function RegisterHeader({ header }: { header: (typeof HEADERS)[number] }) {
  return (
    <div className="mb-5 flex flex-col items-center text-center">
      <h1 className="text-[25px] font-extrabold tracking-tight text-text-primary">
        {header.title}
      </h1>
      <p className="mt-1.5 text-sm font-medium text-text-muted">{header.subtitle}</p>
    </div>
  );
}

function AccountStep({ flow }: { flow: RegisterFlow }) {
  const { account, setAccount, accountErrors, saving, createAccount } = flow;
  return (
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
        onClick={createAccount}
        loading={saving}
        className="mt-1.5"
      />
    </div>
  );
}

function GrowattStep({ flow }: { flow: RegisterFlow }) {
  const { growatt, setGrowatt, saving, setStep, setStepError, saveGrowatt } = flow;
  return (
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
          onClick={saveGrowatt}
          loading={saving}
        />
      </div>
    </div>
  );
}

function WeatherStep({ flow }: { flow: RegisterFlow }) {
  const { weather, setWeather, saving, setStep, setStepError, finish } = flow;
  return (
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
        <Button label="Finish" icon={Check} onClick={finish} loading={saving} />
      </div>
    </div>
  );
}

export default function RegisterPage() {
  const flow = useRegisterFlow();
  const { step, accountError, stepError } = flow;
  const header = HEADERS[step];

  return (
    <GlassCard strong elevated className="w-full max-w-[460px] p-8 sm:p-9">
      <StepIndicator step={step} />
      <RegisterHeader header={header} />

      {accountError ? <StatusBanner kind="error" message={accountError} /> : null}
      {stepError ? <StatusBanner kind="error" message={stepError} /> : null}

      {step === 0 ? <AccountStep flow={flow} /> : null}
      {step === 1 ? <GrowattStep flow={flow} /> : null}
      {step === 2 ? <WeatherStep flow={flow} /> : null}

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
