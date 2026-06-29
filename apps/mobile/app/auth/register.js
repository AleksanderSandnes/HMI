import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
} from 'react-native';
import React, { useState } from 'react';
import * as Yup from 'yup';
import { useRouter } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { useDispatch } from 'react-redux';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontAwesome5 } from '@expo/vector-icons';

import { registerUser } from '../../src/services/api/api';
import { loginUserAction } from '../../src/redux/authSlice';
import AuthBackground from '../../src/components/auth/AuthBackground';
import GlassCard from '../../src/components/ui/GlassCard';
import Field from '../../src/components/ui/Field';
import Button from '../../src/components/ui/Button';
import StatusBanner from '../../src/components/settings/cards/StatusBanner';
import { theme } from '../../src/theme/theme';
import {
  saveGrowattApiSettings,
  saveWeatherApiSettings,
} from '../../src/services/settingsApiService';

const accountSchema = Yup.object().shape({
  email: Yup.string().required('Email is required').email().label('Email'),
  username: Yup.string().required('Username is required').label('Username'),
  password: Yup.string()
    .required('Password is required')
    .min(4)
    .label('Password'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password'), null], 'Passwords must match')
    .required('Please confirm your password'),
});

const STEPS = [
  { key: 'account', label: 'Account' },
  { key: 'solar', label: 'Solar' },
  { key: 'weather', label: 'Weather' },
];

/** Persist the auth payload so settings saves can read the token immediately. */
async function persistUserInfo(data) {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('userInfo', JSON.stringify(data));
    } else {
      const AsyncStorage =
        require('@react-native-async-storage/async-storage').default;
      await AsyncStorage.setItem('userInfo', JSON.stringify(data));
    }
  } catch {
    // non-fatal — the redux action also persists
  }
}

const Register = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isMobile = width <= 768;

  const registerMutation = useMutation({
    mutationFn: registerUser,
    mutationKey: ['register'],
  });

  const [step, setStep] = useState(0);

  // Auth payload from a successful account creation. We hold it locally and only
  // commit it to Redux at the end of the wizard, otherwise the global auth guard
  // (AppWrapper) would immediately redirect away from steps 2 and 3.
  const [registeredUser, setRegisteredUser] = useState(null);

  // Step 1 — account
  const [account, setAccount] = useState({
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
  });
  const [accountErrors, setAccountErrors] = useState({});

  // Step 2 — Growatt
  const [growatt, setGrowatt] = useState({
    email: '',
    password: '',
  });

  // Step 3 — Weather
  const [weather, setWeather] = useState({ stationId: '', apiKey: '' });

  const [stepError, setStepError] = useState(null);
  const [saving, setSaving] = useState(false);

  const setAccountField = (k) => (v) => setAccount((s) => ({ ...s, [k]: v }));
  const setGrowattField = (k) => (v) => setGrowatt((s) => ({ ...s, [k]: v }));
  const setWeatherField = (k) => (v) => setWeather((s) => ({ ...s, [k]: v }));

  // Complete the wizard: commit auth to Redux (which lets the guard route us in)
  // and navigate to the dashboard.
  const finalize = () => {
    if (registeredUser) dispatch(loginUserAction(registeredUser));
    router.replace('/(tabs)');
  };

  const handleCreateAccount = async () => {
    setStepError(null);
    setAccountErrors({});
    try {
      await accountSchema.validate(account, { abortEarly: false });
    } catch (err) {
      const map = {};
      if (err.inner) {
        err.inner.forEach((e) => {
          if (e.path && !map[e.path]) map[e.path] = e.message;
        });
      }
      setAccountErrors(map);
      return;
    }

    try {
      const data = await registerMutation.mutateAsync({
        email: account.email.trim(),
        username: account.username.trim(),
        password: account.password,
      });
      // Persist to storage so the optional credential saves can authenticate,
      // but do NOT commit to Redux yet (that would trigger the auth redirect).
      await persistUserInfo(data);
      setRegisteredUser(data);
      setStep(1);
    } catch (error) {
      console.log('Registration error:', error);
    }
  };

  const handleSaveGrowatt = async () => {
    setStepError(null);
    const email = growatt.email.trim();
    const password = growatt.password.trim();

    // Both empty → skip this optional step.
    if (!email && !password) {
      setStep(2);
      return;
    }
    if (!email || !password) {
      setStepError('Enter both account and password, or skip this step.');
      return;
    }
    if (!email.includes('@')) {
      setStepError('Please enter a valid email address.');
      return;
    }

    try {
      setSaving(true);
      await saveGrowattApiSettings({
        growatt: { email, password },
      });
      setStep(2);
    } catch {
      setStepError('Could not save Growatt credentials. You can add them later in Settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleFinish = async () => {
    setStepError(null);
    const stationId = weather.stationId.trim();
    const apiKey = weather.apiKey.trim();

    // Both empty → finish without saving.
    if (!stationId && !apiKey) {
      finalize();
      return;
    }
    if (!stationId || !apiKey) {
      setStepError('Enter both station ID and API key, or skip this step.');
      return;
    }

    try {
      setSaving(true);
      await saveWeatherApiSettings({ weather: { apiKey, stationId } });
      finalize();
    } catch {
      setStepError('Could not save weather credentials. You can add them later in Settings.');
    } finally {
      setSaving(false);
    }
  };

  const header = (() => {
    if (step === 0) {
      return {
        icon: 'user-plus',
        gradient: theme.accent.gradient,
        title: 'Create account',
        subtitle: 'Join your energy monitoring dashboard',
      };
    }
    if (step === 1) {
      return {
        icon: 'solar-panel',
        gradient: theme.energy.gradient,
        title: 'Connect Growatt',
        subtitle: 'Optional — add your solar credentials',
      };
    }
    return {
      icon: 'cloud-sun',
      gradient: theme.solar.gradient,
      title: 'Connect Weather.com',
      subtitle: 'Optional — add your weather station',
    };
  })();

  return (
    <AuthBackground>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            {
              paddingTop: 20 + insets.top,
              paddingBottom: 20 + insets.bottom,
              paddingLeft: 20 + insets.left,
              paddingRight: 20 + insets.right,
            },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <GlassCard
            strong
            elevated
            style={[
              styles.card,
              { maxWidth: isMobile ? 480 : 460, padding: isMobile ? 24 : 34 },
            ]}
          >
            <StepIndicator step={step} />

            <View style={styles.brand}>
              <LinearGradient
                colors={header.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.brandIcon}
              >
                <FontAwesome5
                  name={header.icon}
                  size={20}
                  color={theme.text.inverse}
                  solid
                />
              </LinearGradient>
              <Text style={styles.title}>{header.title}</Text>
              <Text style={styles.subtitle}>{header.subtitle}</Text>
            </View>

            {step === 0 && registerMutation?.isError ? (
              <StatusBanner
                kind="error"
                message={
                  registerMutation?.error?.response?.data?.message ||
                  'Registration failed. Please try again.'
                }
              />
            ) : null}
            {stepError ? <StatusBanner kind="error" message={stepError} /> : null}

            {step === 0 ? (
              <View>
                <Field
                  label="EMAIL ADDRESS"
                  icon="envelope"
                  value={account.email}
                  onChangeText={setAccountField('email')}
                  placeholder="you@domain.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!registerMutation.isPending}
                />
                <FieldError message={accountErrors.email} />

                <Field
                  label="USERNAME"
                  icon="user"
                  value={account.username}
                  onChangeText={setAccountField('username')}
                  placeholder="Choose a username"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!registerMutation.isPending}
                />
                <FieldError message={accountErrors.username} />

                <Field
                  label="PASSWORD"
                  icon="lock"
                  secure
                  value={account.password}
                  onChangeText={setAccountField('password')}
                  placeholder="Create a secure password"
                  editable={!registerMutation.isPending}
                />
                <FieldError message={accountErrors.password} />

                <Field
                  label="CONFIRM PASSWORD"
                  icon="lock"
                  secure
                  value={account.confirmPassword}
                  onChangeText={setAccountField('confirmPassword')}
                  placeholder="Re-enter your password"
                  editable={!registerMutation.isPending}
                />
                <FieldError message={accountErrors.confirmPassword} />

                <Button
                  label="Create account"
                  icon="arrow-right"
                  onPress={handleCreateAccount}
                  loading={registerMutation.isPending}
                  style={styles.submit}
                />
              </View>
            ) : null}

            {step === 1 ? (
              <View>
                <Field
                  label="ACCOUNT (EMAIL)"
                  icon="envelope"
                  value={growatt.email}
                  onChangeText={setGrowattField('email')}
                  placeholder="your-email@domain.com"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  editable={!saving}
                />
                <Field
                  label="PASSWORD"
                  icon="key"
                  secure
                  value={growatt.password}
                  onChangeText={setGrowattField('password')}
                  placeholder="Enter your Growatt password"
                  editable={!saving}
                />

                <Text style={styles.optionalNote}>
                  Optional — you can add or change this anytime in Settings.
                </Text>

                <View style={styles.buttonRow}>
                  <Button
                    label="Skip"
                    variant="ghost"
                    onPress={() => {
                      setStepError(null);
                      setStep(2);
                    }}
                    style={styles.rowBtn}
                  />
                  <Button
                    label="Continue"
                    icon="arrow-right"
                    onPress={handleSaveGrowatt}
                    loading={saving}
                    gradient={theme.energy.gradient}
                    style={styles.rowBtn}
                  />
                </View>
              </View>
            ) : null}

            {step === 2 ? (
              <View>
                <Field
                  label="WEATHER STATION ID"
                  icon="map-marker-alt"
                  value={weather.stationId}
                  onChangeText={setWeatherField('stationId')}
                  placeholder="e.g. ISANDN24"
                  autoCapitalize="characters"
                  hint="Find your local station ID at weather.com/weather/map"
                  editable={!saving}
                />
                <Field
                  label="API KEY"
                  icon="key"
                  secure
                  value={weather.apiKey}
                  onChangeText={setWeatherField('apiKey')}
                  placeholder="Enter your Weather.com API key"
                  hint="Get your API key from the weather.com developer portal"
                  editable={!saving}
                />

                <Text style={styles.optionalNote}>
                  Optional — you can add or change this anytime in Settings.
                </Text>

                <View style={styles.buttonRow}>
                  <Button
                    label="Back"
                    variant="ghost"
                    icon="arrow-left"
                    onPress={() => {
                      setStepError(null);
                      setStep(1);
                    }}
                    style={styles.rowBtn}
                  />
                  <Button
                    label="Finish"
                    icon="check"
                    onPress={handleFinish}
                    loading={saving}
                    style={styles.rowBtn}
                  />
                </View>
              </View>
            ) : null}

            {step === 0 ? (
              <View style={styles.footer}>
                <Text style={styles.footerText}>Already have an account?</Text>
                <Text
                  style={styles.link}
                  onPress={() => router.push('/auth/login')}
                >
                  Sign in
                </Text>
              </View>
            ) : null}
          </GlassCard>
        </ScrollView>
      </KeyboardAvoidingView>
    </AuthBackground>
  );
};

export default Register;

function FieldError({ message }) {
  if (!message) return null;
  return <Text style={styles.fieldError}>{message}</Text>;
}

function StepIndicator({ step }) {
  return (
    <View style={styles.steps}>
      {STEPS.map((s, i) => {
        const done = i < step;
        const active = i === step;
        return (
          <React.Fragment key={s.key}>
            <View style={styles.stepItem}>
              <View
                style={[
                  styles.stepDot,
                  active && styles.stepDotActive,
                  done && styles.stepDotDone,
                ]}
              >
                {done ? (
                  <FontAwesome5
                    name="check"
                    size={10}
                    color={theme.text.inverse}
                    solid
                  />
                ) : (
                  <Text
                    style={[
                      styles.stepNum,
                      (active || done) && styles.stepNumActive,
                    ]}
                  >
                    {i + 1}
                  </Text>
                )}
              </View>
              <Text
                style={[styles.stepLabel, active && styles.stepLabelActive]}
              >
                {s.label}
              </Text>
            </View>
            {i < STEPS.length - 1 ? (
              <View
                style={[styles.stepBar, i < step && styles.stepBarDone]}
              />
            ) : null}
          </React.Fragment>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: { width: '100%' },

  steps: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 22,
  },
  stepItem: { alignItems: 'center', width: 64 },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.glass.fill,
    borderWidth: 1,
    borderColor: theme.glass.borderStrong,
  },
  stepDotActive: {
    backgroundColor: theme.solar.soft,
    borderColor: theme.solar.main,
  },
  stepDotDone: {
    backgroundColor: theme.solar.main,
    borderColor: theme.solar.main,
  },
  stepNum: {
    fontSize: 12,
    fontWeight: '800',
    color: theme.text.muted,
  },
  stepNumActive: { color: theme.solar.light },
  stepLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.text.muted,
    marginTop: 6,
  },
  stepLabelActive: { color: theme.text.secondary },
  stepBar: {
    flex: 1,
    height: 2,
    maxWidth: 40,
    marginTop: -16,
    backgroundColor: theme.glass.borderStrong,
    borderRadius: 2,
  },
  stepBarDone: { backgroundColor: theme.solar.main },

  brand: { alignItems: 'center', marginBottom: 22 },
  brandIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 25,
    fontWeight: '800',
    color: theme.text.primary,
    letterSpacing: -0.6,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: theme.text.muted,
    marginTop: 6,
    fontWeight: '500',
    textAlign: 'center',
  },
  fieldError: {
    color: theme.negative,
    fontSize: 12,
    fontWeight: '600',
    marginTop: -8,
    marginBottom: 14,
    marginLeft: 2,
  },
  optionalNote: {
    fontSize: 12.5,
    color: theme.text.muted,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 2,
    marginBottom: 18,
    lineHeight: 18,
  },
  submit: { marginTop: 6 },
  buttonRow: { flexDirection: 'row', gap: 12 },
  rowBtn: { flex: 1 },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: theme.glass.border,
  },
  footerText: {
    color: theme.text.muted,
    fontSize: 14,
    fontWeight: '500',
  },
  link: {
    color: theme.solar.light,
    fontSize: 14,
    fontWeight: '800',
    marginLeft: 5,
  },
});
