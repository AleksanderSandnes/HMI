import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
} from 'react-native';
import React from 'react';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { useRouter } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { useDispatch } from 'react-redux';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontAwesome5 } from '@expo/vector-icons';

import { loginUser } from '../(services)/api/api';
import { loginUserAction } from '../(redux)/authSlice';
import AuthBackground from '../components/auth/AuthBackground';
import GlassCard from '../components/premium/GlassCard';
import PremiumField from '../components/premium/PremiumField';
import PremiumButton from '../components/premium/PremiumButton';
import StatusBanner from '../components/settings/premium/StatusBanner';
import { premiumTheme } from '../theme/premiumTheme';

const validationSchema = Yup.object().shape({
  email: Yup.string().required('Email is required').email().label('Email'),
  password: Yup.string()
    .required('Password is required')
    .min(4)
    .label('Password'),
});

const Login = () => {
  const mutation = useMutation({
    mutationFn: loginUser,
    mutationKey: ['login'],
  });
  const dispatch = useDispatch();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isMobile = width <= 768;

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
              { maxWidth: isMobile ? 460 : 430, padding: isMobile ? 24 : 34 },
            ]}
          >
            <View style={styles.brand}>
              <LinearGradient
                colors={premiumTheme.solar.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.brandIcon}
              >
                <FontAwesome5
                  name="bolt"
                  size={20}
                  color={premiumTheme.text.inverse}
                  solid
                />
              </LinearGradient>
              <Text style={styles.title}>Welcome back</Text>
              <Text style={styles.subtitle}>
                Sign in to your energy dashboard
              </Text>
            </View>

            {mutation?.isError ? (
              <StatusBanner
                kind="error"
                message={
                  mutation?.error?.response?.data?.message ||
                  'Login failed. Please check your credentials and try again.'
                }
              />
            ) : null}

            <Formik
              initialValues={{ email: '', password: '' }}
              validationSchema={validationSchema}
              onSubmit={(values) => {
                mutation
                  .mutateAsync(values)
                  .then((data) => {
                    dispatch(loginUserAction(data));
                    router.push('/(tabs)');
                  })
                  .catch((error) => {
                    console.log('Login error:', error);
                  });
              }}
            >
              {({
                handleChange,
                handleBlur,
                handleSubmit,
                values,
                errors,
                touched,
              }) => (
                <View>
                  <PremiumField
                    label="EMAIL ADDRESS"
                    icon="envelope"
                    value={values.email}
                    onChangeText={handleChange('email')}
                    onBlur={handleBlur('email')}
                    placeholder="you@domain.com"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!mutation.isPending}
                  />
                  {touched.email && errors.email ? (
                    <Text style={styles.fieldError}>{errors.email}</Text>
                  ) : null}

                  <PremiumField
                    label="PASSWORD"
                    icon="lock"
                    secure
                    value={values.password}
                    onChangeText={handleChange('password')}
                    onBlur={handleBlur('password')}
                    placeholder="Enter your password"
                    editable={!mutation.isPending}
                  />
                  {touched.password && errors.password ? (
                    <Text style={styles.fieldError}>{errors.password}</Text>
                  ) : null}

                  <PremiumButton
                    label="Sign In"
                    icon="arrow-right"
                    onPress={handleSubmit}
                    loading={mutation.isPending}
                    style={styles.submit}
                  />
                </View>
              )}
            </Formik>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Don't have an account?</Text>
              <Text
                style={styles.link}
                onPress={() => router.push('/auth/register')}
              >
                Create one
              </Text>
            </View>
          </GlassCard>
        </ScrollView>
      </KeyboardAvoidingView>
    </AuthBackground>
  );
};

export default Login;

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: { width: '100%' },
  brand: { alignItems: 'center', marginBottom: 24 },
  brandIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: premiumTheme.text.primary,
    letterSpacing: -0.6,
  },
  subtitle: {
    fontSize: 14,
    color: premiumTheme.text.muted,
    marginTop: 6,
    fontWeight: '500',
    textAlign: 'center',
  },
  fieldError: {
    color: premiumTheme.negative,
    fontSize: 12,
    fontWeight: '600',
    marginTop: -8,
    marginBottom: 14,
    marginLeft: 2,
  },
  submit: { marginTop: 6 },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: premiumTheme.glass.border,
  },
  footerText: {
    color: premiumTheme.text.muted,
    fontSize: 14,
    fontWeight: '500',
  },
  link: {
    color: premiumTheme.solar.light,
    fontSize: 14,
    fontWeight: '800',
    marginLeft: 5,
  },
});
