"use client";

import {
  coreErrorMessage,
  createRegisterAccountSchema,
  type TranslationKey,
  type Translator,
} from "@hmi/core";
import { ArrowLeft, ArrowRight, Check, Key, Lock, Mail, MapPin, User } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import * as Yup from "yup";

import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { GlassCard } from "@/components/ui/GlassCard";
import { StatusBanner } from "@/components/ui/StatusBanner";
import { useCore } from "@/lib/hooks/useCore";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const STEPS = [
  { key: "account", labelKey: "auth.register.stepAccount" },
  { key: "solar", labelKey: "auth.register.stepSolar" },
  { key: "weather", labelKey: "auth.register.stepWeather" },
] as const;

const HEADERS: Record<number, { titleKey: TranslationKey; subtitleKey: TranslationKey }> = {
  0: {
    titleKey: "auth.register.createAccountTitle",
    subtitleKey: "auth.register.createAccountSubtitle",
  },
  1: {
    titleKey: "auth.register.growattTitle",
    subtitleKey: "auth.register.growattSubtitle",
  },
  2: {
    titleKey: "auth.register.weatherTitle",
    subtitleKey: "auth.register.weatherSubtitle",
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

function validateAccount(
  account: AccountState,
  schema: ReturnType<typeof createRegisterAccountSchema>,
): Record<string, string> {
  try {
    schema.validateSync(account, { abortEarly: false });
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
  schema: ReturnType<typeof createRegisterAccountSchema>;
  t: Translator;
  setStep: Setter<number>;
  setSaving: Setter<boolean>;
  setStepError: Setter<string | null>;
  setAccountError: Setter<string | null>;
  setAccountErrors: Setter<Record<string, string>>;
}

async function runCreateAccount(d: CreateAccountDeps) {
  d.setStepError(null);
  d.setAccountError(null);
  const errs = validateAccount(d.account, d.schema);
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
    d.setAccountError(coreErrorMessage(e, d.t, d.t("auth.register.failed")));
  } finally {
    d.setSaving(false);
  }
}

interface SaveGrowattDeps {
  settings: Core["settings"];
  growatt: { email: string; password: string };
  t: Translator;
  setStep: Setter<number>;
  setSaving: Setter<boolean>;
  setStepError: Setter<string | null>;
}

async function runSaveGrowatt(d: SaveGrowattDeps) {
  d.setStepError(null);
  const email = d.growatt.email.trim();
  const password = d.growatt.password.trim();
  if (!email && !password) return d.setStep(2);
  if (!email || !password) return d.setStepError(d.t("auth.register.growattBothOrSkip"));
  if (!email.includes("@")) return d.setStepError(d.t("auth.register.invalidEmail"));
  d.setSaving(true);
  try {
    await d.settings.saveGrowattApiSettings({ growatt: { email, password } });
    d.setStep(2);
  } catch {
    d.setStepError(d.t("auth.register.growattSaveFailed"));
  } finally {
    d.setSaving(false);
  }
}

interface FinishDeps {
  settings: Core["settings"];
  weather: { stationId: string; apiKey: string };
  t: Translator;
  done: () => void;
  setSaving: Setter<boolean>;
  setStepError: Setter<string | null>;
}

async function runFinish(d: FinishDeps) {
  d.setStepError(null);
  const stationId = d.weather.stationId.trim();
  const apiKey = d.weather.apiKey.trim();
  if (!stationId && !apiKey) return d.done();
  if (!stationId || !apiKey) return d.setStepError(d.t("auth.register.weatherBothOrSkip"));
  d.setSaving(true);
  try {
    await d.settings.saveWeatherApiSettings({ weather: { apiKey, stationId } });
    d.done();
  } catch {
    d.setStepError(d.t("auth.register.weatherSaveFailed"));
  } finally {
    d.setSaving(false);
  }
}

function useRegisterFlow() {
  const { auth, settings } = useCore();
  const { t } = useI18n();
  const router = useRouter();
  const schema = useMemo(() => createRegisterAccountSchema(t), [t]);
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
        schema,
        t,
        setStep,
        setSaving,
        setStepError,
        setAccountError,
        setAccountErrors,
      }),
    saveGrowatt: () => runSaveGrowatt({ settings, growatt, t, setStep, setSaving, setStepError }),
    finish: () => runFinish({ settings, weather, t, done: finalize, setSaving, setStepError }),
  };
}

type RegisterFlow = ReturnType<typeof useRegisterFlow>;

const setField =
  <T,>(setter: React.Dispatch<React.SetStateAction<T>>, key: keyof T) =>
  (e: React.ChangeEvent<HTMLInputElement>) =>
    setter((s) => ({ ...s, [key]: e.target.value }));

function RegisterHeader({ header }: { header: (typeof HEADERS)[number] }) {
  const { t } = useI18n();
  return (
    <div className="mb-5 flex flex-col items-center text-center">
      <h1 className="text-[25px] font-extrabold tracking-tight text-text-primary">
        {t(header.titleKey)}
      </h1>
      <p className="mt-1.5 text-sm font-medium text-text-muted">{t(header.subtitleKey)}</p>
    </div>
  );
}

function AccountStep({ flow }: { flow: RegisterFlow }) {
  const { t } = useI18n();
  const { account, setAccount, accountErrors, saving, createAccount } = flow;
  return (
    <div>
      <Field
        label={t("auth.emailAddressLabel")}
        icon={Mail}
        inputMode="email"
        placeholder={t("auth.emailPlaceholder")}
        value={account.email}
        onChange={setField(setAccount, "email")}
        error={accountErrors.email}
        disabled={saving}
      />
      <Field
        label={t("settings.usernameLabel")}
        icon={User}
        placeholder={t("auth.register.usernamePlaceholder")}
        value={account.username}
        onChange={setField(setAccount, "username")}
        error={accountErrors.username}
        disabled={saving}
      />
      <Field
        label={t("settings.passwordLabel")}
        icon={Lock}
        secure
        placeholder={t("auth.register.passwordPlaceholder")}
        value={account.password}
        onChange={setField(setAccount, "password")}
        error={accountErrors.password}
        disabled={saving}
      />
      <Field
        label={t("settings.confirmPasswordLabel")}
        icon={Lock}
        secure
        placeholder={t("auth.register.confirmPasswordPlaceholder")}
        value={account.confirmPassword}
        onChange={setField(setAccount, "confirmPassword")}
        error={accountErrors.confirmPassword}
        disabled={saving}
      />
      <Button
        label={t("auth.register.createAccountTitle")}
        icon={ArrowRight}
        onClick={createAccount}
        loading={saving}
        className="mt-1.5"
      />
    </div>
  );
}

function GrowattStep({ flow }: { flow: RegisterFlow }) {
  const { t } = useI18n();
  const { growatt, setGrowatt, saving, setStep, setStepError, saveGrowatt } = flow;
  return (
    <div>
      <Field
        label={t("settings.accountEmailLabel")}
        icon={Mail}
        inputMode="email"
        placeholder={t("auth.register.growattEmailPlaceholder")}
        value={growatt.email}
        onChange={setField(setGrowatt, "email")}
        disabled={saving}
      />
      <Field
        label={t("settings.passwordLabel")}
        icon={Key}
        secure
        placeholder={t("auth.register.growattPasswordPlaceholder")}
        value={growatt.password}
        onChange={setField(setGrowatt, "password")}
        disabled={saving}
      />
      <p className="mb-4 mt-0.5 text-center text-[12.5px] font-medium leading-[18px] text-text-muted">
        {t("auth.register.optionalHint")}
      </p>
      <div className="flex gap-3">
        <Button
          label={t("auth.register.skip")}
          variant="ghost"
          onClick={() => {
            setStepError(null);
            setStep(2);
          }}
        />
        <Button
          label={t("auth.register.continue")}
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
  const { t } = useI18n();
  const { weather, setWeather, saving, setStep, setStepError, finish } = flow;
  return (
    <div>
      <Field
        label={t("settings.stationIdLabel")}
        icon={MapPin}
        placeholder={t("settings.stationIdPlaceholder")}
        hint={t("auth.register.stationIdHint")}
        value={weather.stationId}
        onChange={setField(setWeather, "stationId")}
        disabled={saving}
      />
      <Field
        label={t("settings.apiKeyLabel")}
        icon={Key}
        secure
        placeholder={t("auth.register.apiKeyPlaceholder")}
        hint={t("auth.register.apiKeyHint")}
        value={weather.apiKey}
        onChange={setField(setWeather, "apiKey")}
        disabled={saving}
      />
      <p className="mb-4 mt-0.5 text-center text-[12.5px] font-medium leading-[18px] text-text-muted">
        {t("auth.register.optionalHint")}
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
        <Button label={t("auth.register.finish")} icon={Check} onClick={finish} loading={saving} />
      </div>
    </div>
  );
}

export default function RegisterPage() {
  const { t } = useI18n();
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
          <span className="text-sm font-medium text-text-muted">
            {t("auth.register.haveAccount")}
          </span>
          <Link href="/login" className="text-sm font-extrabold text-solar-light">
            {t("auth.register.signIn")}
          </Link>
        </div>
      ) : null}
    </GlassCard>
  );
}

function StepIndicator({ step }: { step: number }) {
  const { t } = useI18n();
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
                {t(s.labelKey)}
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
