import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Formik } from 'formik';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { loginSchema } from '@hmi/core';
import { useCore } from '../../src/lib/useCore';
import { GlassCard } from '../../src/components/ui/GlassCard';
import { Field } from '../../src/components/ui/Field';
import { Button } from '../../src/components/ui/Button';
import { StatusBanner } from '../../src/components/ui/StatusBanner';
import { GRADIENTS } from '../../src/lib/gradients';
import type { IconRender } from '../../src/components/ui/types';

const mail: IconRender = (p) => <Ionicons name="mail-outline" {...p} />;
const lock: IconRender = (p) => <Ionicons name="lock-closed-outline" {...p} />;
const arrow: IconRender = (p) => <Ionicons name="arrow-forward" {...p} />;

export default function Login() {
  const { auth } = useCore();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-bg-base"
    >
      <ScrollView
        contentContainerClassName="flex-grow items-center justify-center p-6"
        keyboardShouldPersistTaps="handled"
      >
        <GlassCard strong elevated className="w-full max-w-[430px] p-8">
          <View className="mb-6 items-center">
            <LinearGradient
              colors={GRADIENTS.solar}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                width: 56,
                height: 56,
                borderRadius: 18,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
              }}
            >
              <Ionicons name="flash" size={22} color="#0a1124" />
            </LinearGradient>
            <Text className="text-[26px] font-extrabold tracking-tight text-text-primary">
              Welcome back
            </Text>
            <Text className="mt-1.5 text-sm font-medium text-text-muted">
              Sign in to your energy dashboard
            </Text>
          </View>

          {error ? <StatusBanner kind="error" message={error} /> : null}

          <Formik
            initialValues={{ email: '', password: '' }}
            validationSchema={loginSchema}
            onSubmit={async (values, { setSubmitting }) => {
              setError(null);
              try {
                await auth.loginUser(values);
                router.replace('/(tabs)');
              } catch (e) {
                setError(
                  e instanceof Error
                    ? e.message
                    : 'Login failed. Check your credentials and try again.',
                );
              } finally {
                setSubmitting(false);
              }
            }}
          >
            {({
              values,
              errors,
              touched,
              handleChange,
              handleBlur,
              handleSubmit,
              isSubmitting,
            }) => (
              <View>
                <Field
                  label="EMAIL ADDRESS"
                  icon={mail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  placeholder="you@domain.com"
                  value={values.email}
                  onChangeText={handleChange('email')}
                  onBlur={handleBlur('email')}
                  error={touched.email ? errors.email : undefined}
                  editable={!isSubmitting}
                />
                <Field
                  label="PASSWORD"
                  icon={lock}
                  secure
                  autoComplete="password"
                  placeholder="Enter your password"
                  value={values.password}
                  onChangeText={handleChange('password')}
                  onBlur={handleBlur('password')}
                  error={touched.password ? errors.password : undefined}
                  editable={!isSubmitting}
                />
                <Button
                  label="Sign In"
                  icon={arrow}
                  onPress={() => handleSubmit()}
                  loading={isSubmitting}
                  className="mt-1.5 w-full"
                />
              </View>
            )}
          </Formik>

          <View className="mt-6 flex-row items-center justify-center gap-1.5 border-t border-glass-border pt-5">
            <Text className="text-sm font-medium text-text-muted">
              Don&apos;t have an account?
            </Text>
            <Pressable onPress={() => router.push('/(auth)/register')}>
              <Text className="text-sm font-extrabold text-solar-light">
                Create one
              </Text>
            </Pressable>
          </View>
        </GlassCard>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
