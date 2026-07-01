import { Ionicons } from "@expo/vector-icons";
import { registerAccountSchema } from "@hmi/core";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import * as Yup from "yup";

import { Button } from "../../src/components/ui/Button";
import { Field } from "../../src/components/ui/Field";
import { GlassCard } from "../../src/components/ui/GlassCard";
import { ScreenBackground } from "../../src/components/ui/ScreenBackground";
import { StatusBanner } from "../../src/components/ui/StatusBanner";
import type { IconRender } from "../../src/components/ui/types";
import { GRADIENTS, type StatGradient } from "../../src/lib/gradients";
import { useCore } from "../../src/lib/useCore";

const mail: IconRender = (p) => <Ionicons name="mail-outline" {...p} />;
const user: IconRender = (p) => <Ionicons name="person-outline" {...p} />;
const lock: IconRender = (p) => <Ionicons name="lock-closed-outline" {...p} />;
const key: IconRender = (p) => <Ionicons name="key-outline" {...p} />;
const pin: IconRender = (p) => <Ionicons name="location-outline" {...p} />;
const arrow: IconRender = (p) => <Ionicons name="arrow-forward" {...p} />;

const STEPS = ["Account", "Solar", "Weather"] as const;
const HEADERS: Record<
  number,
  { icon: keyof typeof Ionicons.glyphMap; gradient: StatGradient; title: string; subtitle: string }
> = {
  0: {
    icon: "person-add",
    gradient: "accent",
    title: "Create account",
    subtitle: "Join your energy monitoring dashboard",
  },
  1: {
    icon: "sunny",
    gradient: "energy",
    title: "Connect Growatt",
    subtitle: "Optional — add your solar credentials",
  },
  2: {
    icon: "partly-sunny",
    gradient: "solar",
    title: "Connect Weather.com",
    subtitle: "Optional — add your weather credentials",
  },
};

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

type Core = ReturnType<typeof useCore>;
type Setter<T> = (v: T) => void;

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

  const createAccount = () =>
    runCreateAccount({
      auth,
      account,
      setStep,
      setSaving,
      setStepError,
      setAccountError,
      setAccountErrors,
    });
  const saveGrowatt = () => runSaveGrowatt({ settings, growatt, setStep, setSaving, setStepError });
  const finish = () =>
    runFinish({
      settings,
      weather,
      done: () => router.replace("/(tabs)"),
      setSaving,
      setStepError,
    });

  return {
    router,
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
    createAccount,
    saveGrowatt,
    finish,
  };
}

type RegisterFlow = ReturnType<typeof useRegisterFlow>;

function StepDots({ step }: { step: number }) {
  return (
    <View className="mb-5 flex-row items-center justify-center">
      {STEPS.map((label, i) => {
        const done = i < step;
        const active = i === step;
        return (
          <View key={label} className="flex-row items-center">
            <View className="w-16 items-center">
              <View
                className={
                  done
                    ? "h-7 w-7 items-center justify-center rounded-pill border border-solar bg-solar"
                    : active
                      ? "h-7 w-7 items-center justify-center rounded-pill border border-solar bg-solar-soft"
                      : "h-7 w-7 items-center justify-center rounded-pill border border-glass-border-strong bg-glass-fill"
                }
              >
                {done ? (
                  <Ionicons name="checkmark" size={12} color="#0a1124" />
                ) : (
                  <Text
                    className={
                      active
                        ? "text-xs font-extrabold text-solar-light"
                        : "text-xs font-extrabold text-text-muted"
                    }
                  >
                    {i + 1}
                  </Text>
                )}
              </View>
              <Text
                className={
                  active
                    ? "mt-1.5 text-[11px] font-bold text-text-secondary"
                    : "mt-1.5 text-[11px] font-bold text-text-muted"
                }
              >
                {label}
              </Text>
            </View>
            {i < STEPS.length - 1 ? (
              <View
                className={`-mt-4 h-0.5 w-10 rounded ${i < step ? "bg-solar" : "bg-glass-border-strong"}`}
              />
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

function RegisterHeader({ header }: { header: (typeof HEADERS)[number] }) {
  return (
    <View className="mb-5 flex-row items-center gap-3.5">
      <LinearGradient
        colors={GRADIENTS[header.gradient]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          width: 52,
          height: 52,
          borderRadius: 16,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons name={header.icon} size={20} color="#0a1124" />
      </LinearGradient>
      <View className="flex-1">
        <Text className="text-[22px] font-extrabold tracking-tight text-text-primary">
          {header.title}
        </Text>
        <Text className="mt-1 text-[13px] font-medium text-text-muted">{header.subtitle}</Text>
      </View>
    </View>
  );
}

function AccountStep({ flow }: { flow: RegisterFlow }) {
  const { account, setAccount, accountErrors, saving, createAccount } = flow;
  const set = (k: keyof AccountState) => (t: string) => setAccount((s) => ({ ...s, [k]: t }));
  return (
    <View>
      <Field
        label="EMAIL ADDRESS"
        icon={mail}
        keyboardType="email-address"
        autoCapitalize="none"
        placeholder="you@domain.com"
        value={account.email}
        onChangeText={set("email")}
        error={accountErrors.email}
        editable={!saving}
      />
      <Field
        label="USERNAME"
        icon={user}
        autoCapitalize="none"
        placeholder="Choose a username"
        value={account.username}
        onChangeText={set("username")}
        error={accountErrors.username}
        editable={!saving}
      />
      <Field
        label="PASSWORD"
        icon={lock}
        secure
        placeholder="Create a secure password"
        value={account.password}
        onChangeText={set("password")}
        error={accountErrors.password}
        editable={!saving}
      />
      <Field
        label="CONFIRM PASSWORD"
        icon={lock}
        secure
        placeholder="Re-enter your password"
        value={account.confirmPassword}
        onChangeText={set("confirmPassword")}
        error={accountErrors.confirmPassword}
        editable={!saving}
      />
      <Button
        label="Create account"
        icon={arrow}
        onPress={createAccount}
        loading={saving}
        className="mt-1.5 w-full"
      />
    </View>
  );
}

function GrowattStep({ flow }: { flow: RegisterFlow }) {
  const { growatt, setGrowatt, saving, setStep, setStepError, saveGrowatt } = flow;
  return (
    <View>
      <Field
        label="ACCOUNT (EMAIL)"
        icon={mail}
        keyboardType="email-address"
        autoCapitalize="none"
        placeholder="your-email@domain.com"
        value={growatt.email}
        onChangeText={(t) => setGrowatt((s) => ({ ...s, email: t }))}
        editable={!saving}
      />
      <Field
        label="PASSWORD"
        icon={key}
        secure
        placeholder="Enter your Growatt password"
        value={growatt.password}
        onChangeText={(t) => setGrowatt((s) => ({ ...s, password: t }))}
        editable={!saving}
      />
      <Text className="mb-4 mt-0.5 text-center text-[12.5px] font-medium leading-[18px] text-text-muted">
        Optional — you can add or change this anytime in Settings.
      </Text>
      <View className="flex-row gap-3">
        <Button
          label="Skip"
          variant="ghost"
          onPress={() => {
            setStepError(null);
            setStep(2);
          }}
          className="flex-1"
        />
        <Button
          label="Continue"
          icon={arrow}
          gradient="energy"
          onPress={saveGrowatt}
          loading={saving}
          className="flex-1"
        />
      </View>
    </View>
  );
}

function WeatherStep({ flow }: { flow: RegisterFlow }) {
  const { weather, setWeather, saving, setStep, setStepError, finish } = flow;
  return (
    <View>
      <Field
        label="WEATHER STATION ID"
        icon={pin}
        autoCapitalize="characters"
        placeholder="e.g. ISANDN24"
        hint="Find your local station ID at weather.com/weather/map"
        value={weather.stationId}
        onChangeText={(t) => setWeather((s) => ({ ...s, stationId: t }))}
        editable={!saving}
      />
      <Field
        label="API KEY"
        icon={key}
        secure
        placeholder="Enter your Weather.com API key"
        hint="Get your API key from the weather.com developer portal"
        value={weather.apiKey}
        onChangeText={(t) => setWeather((s) => ({ ...s, apiKey: t }))}
        editable={!saving}
      />
      <Text className="mb-4 mt-0.5 text-center text-[12.5px] font-medium leading-[18px] text-text-muted">
        Optional — you can add or change this anytime in Settings.
      </Text>
      <View className="flex-row gap-3">
        <Button
          label="Back"
          variant="ghost"
          onPress={() => {
            setStepError(null);
            setStep(1);
          }}
          className="flex-1"
        />
        <Button label="Finish" onPress={finish} loading={saving} className="flex-1" />
      </View>
    </View>
  );
}

export default function Register() {
  const flow = useRegisterFlow();
  const { step, accountError, stepError, router } = flow;
  const header = HEADERS[step];

  return (
    <View className="flex-1 bg-bg-base">
      <ScreenBackground />
      <KeyboardAwareScrollView
        contentContainerStyle={{
          flexGrow: 1,
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
        }}
        keyboardShouldPersistTaps="handled"
        bottomOffset={24}
      >
        <GlassCard strong elevated className="w-full max-w-[460px] p-8">
          <StepDots step={step} />
          <RegisterHeader header={header} />
          {accountError ? <StatusBanner kind="error" message={accountError} /> : null}
          {stepError ? <StatusBanner kind="error" message={stepError} /> : null}

          {step === 0 ? <AccountStep flow={flow} /> : null}
          {step === 1 ? <GrowattStep flow={flow} /> : null}
          {step === 2 ? <WeatherStep flow={flow} /> : null}

          {step === 0 ? (
            <View className="mt-6 flex-row items-center justify-center gap-1.5 border-t border-glass-border pt-5">
              <Text className="text-sm font-medium text-text-muted">Already have an account?</Text>
              <Pressable onPress={() => router.replace("/(auth)/login")}>
                <Text className="text-sm font-extrabold text-solar-light">Sign in</Text>
              </Pressable>
            </View>
          ) : null}
        </GlassCard>
      </KeyboardAwareScrollView>
    </View>
  );
}
