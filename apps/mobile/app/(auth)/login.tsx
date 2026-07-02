import { Ionicons } from "@expo/vector-icons";
import { coreErrorMessage, createLoginSchema } from "@hmi/core";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Formik, type FormikProps } from "formik";
import { useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";

import { Button } from "../../src/components/ui/Button";
import { Field } from "../../src/components/ui/Field";
import { GlassCard } from "../../src/components/ui/GlassCard";
import { ScreenBackground } from "../../src/components/ui/ScreenBackground";
import { StatusBanner } from "../../src/components/ui/StatusBanner";
import type { IconRender } from "../../src/components/ui/types";
import { GRADIENTS } from "../../src/lib/gradients";
import { useI18n } from "../../src/lib/i18n";
import { useCore } from "../../src/lib/useCore";

const mail: IconRender = (p) => <Ionicons name="mail-outline" {...p} />;
const lock: IconRender = (p) => <Ionicons name="lock-closed-outline" {...p} />;
const arrow: IconRender = (p) => <Ionicons name="arrow-forward" {...p} />;

interface LoginValues {
  email: string;
  password: string;
}

function LoginHeader() {
  const { t } = useI18n();
  return (
    <View className="mb-6 items-center">
      <LinearGradient
        colors={GRADIENTS.solar}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          width: 56,
          height: 56,
          borderRadius: 18,
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 16,
        }}
      >
        <Ionicons name="flash" size={22} color="#0a1124" />
      </LinearGradient>
      <Text className="text-[26px] font-extrabold tracking-tight text-text-primary">
        {t("auth.login.title")}
      </Text>
      <Text className="mt-1.5 text-sm font-medium text-text-muted">{t("auth.login.subtitle")}</Text>
    </View>
  );
}

function LoginForm({
  values,
  errors,
  touched,
  handleChange,
  handleBlur,
  handleSubmit,
  isSubmitting,
}: FormikProps<LoginValues>) {
  const { t } = useI18n();
  return (
    <View>
      <Field
        label={t("auth.emailAddressLabel")}
        icon={mail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        placeholder={t("auth.emailPlaceholder")}
        value={values.email}
        onChangeText={handleChange("email")}
        onBlur={handleBlur("email")}
        error={touched.email ? errors.email : undefined}
        editable={!isSubmitting}
      />
      <Field
        label={t("settings.passwordLabel")}
        icon={lock}
        secure
        autoComplete="password"
        placeholder={t("auth.passwordPlaceholder")}
        value={values.password}
        onChangeText={handleChange("password")}
        onBlur={handleBlur("password")}
        error={touched.password ? errors.password : undefined}
        editable={!isSubmitting}
      />
      <Button
        label={t("auth.login.signIn")}
        icon={arrow}
        onPress={() => handleSubmit()}
        loading={isSubmitting}
        className="mt-1.5 w-full"
      />
    </View>
  );
}

export default function Login() {
  const { auth } = useCore();
  const { t } = useI18n();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const schema = useMemo(() => createLoginSchema(t), [t]);

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
        <GlassCard strong elevated className="w-full max-w-[430px] p-8">
          <LoginHeader />
          {error ? <StatusBanner kind="error" message={error} /> : null}
          <Formik
            initialValues={{ email: "", password: "" }}
            validationSchema={schema}
            onSubmit={async (values, { setSubmitting }) => {
              setError(null);
              try {
                await auth.loginUser(values);
                router.replace("/(tabs)");
              } catch (e) {
                setError(coreErrorMessage(e, t, t("auth.login.failed")));
              } finally {
                setSubmitting(false);
              }
            }}
          >
            {(props) => <LoginForm {...props} />}
          </Formik>

          <View className="mt-6 flex-row items-center justify-center gap-1.5 border-t border-glass-border pt-5">
            <Text className="text-sm font-medium text-text-muted">{t("auth.login.noAccount")}</Text>
            <Pressable onPress={() => router.push("/(auth)/register")}>
              <Text className="text-sm font-extrabold text-solar-light">
                {t("auth.login.createOne")}
              </Text>
            </Pressable>
          </View>
        </GlassCard>
      </KeyboardAwareScrollView>
    </View>
  );
}
