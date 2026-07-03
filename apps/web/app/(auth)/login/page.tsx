"use client";

import { coreErrorMessage, createLoginSchema } from "@hmi/core";
import { Formik, type FormikProps } from "formik";
import { ArrowRight, Lock, Mail, Zap } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { GlassCard } from "@/components/ui/GlassCard";
import { StatusBanner } from "@/components/ui/StatusBanner";
import { useCore } from "@/lib/hooks/useCore";
import { useI18n } from "@/lib/i18n";

interface LoginValues {
  email: string;
  password: string;
}

function LoginHeader() {
  const { t } = useI18n();
  return (
    <div className="mb-6 flex flex-col items-center text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-[18px] bg-[linear-gradient(135deg,#fde047,#fbbf24,#f59e0b)]">
        <Zap size={20} className="size-[1.25rem] text-text-inverse" fill="currentColor" />
      </div>
      <h1 className="text-[1.625rem] font-extrabold tracking-tight text-text-primary">
        {t("auth.login.title")}
      </h1>
      <p className="mt-1.5 text-sm font-medium text-text-muted">{t("auth.login.subtitle")}</p>
    </div>
  );
}

function LoginFields({
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
    <form onSubmit={handleSubmit} noValidate>
      <Field
        label={t("auth.emailAddressLabel")}
        icon={Mail}
        name="email"
        inputMode="email"
        autoComplete="email"
        placeholder={t("auth.emailPlaceholder")}
        value={values.email}
        onChange={handleChange}
        onBlur={handleBlur}
        error={touched.email ? errors.email : undefined}
        disabled={isSubmitting}
      />
      <Field
        label={t("settings.passwordLabel")}
        icon={Lock}
        secure
        name="password"
        autoComplete="current-password"
        placeholder={t("auth.passwordPlaceholder")}
        value={values.password}
        onChange={handleChange}
        onBlur={handleBlur}
        error={touched.password ? errors.password : undefined}
        disabled={isSubmitting}
      />
      <Button
        type="submit"
        label={t("auth.login.signIn")}
        icon={ArrowRight}
        loading={isSubmitting}
        className="mt-1.5"
      />
    </form>
  );
}

function LoginForm() {
  const { auth } = useCore();
  const { t } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") || "/dashboard";
  const [error, setError] = useState<string | null>(null);
  const schema = useMemo(() => createLoginSchema(t), [t]);

  return (
    <GlassCard strong elevated className="w-full max-w-[26.875rem] p-8 sm:p-9">
      <LoginHeader />
      {error ? <StatusBanner kind="error" message={error} /> : null}

      <Formik
        initialValues={{ email: "", password: "" }}
        validationSchema={schema}
        onSubmit={async (values, { setSubmitting }) => {
          setError(null);
          try {
            await auth.loginUser(values);
            router.replace(redirectTo);
            router.refresh();
          } catch (e) {
            setError(coreErrorMessage(e, t, t("auth.login.failed")));
          } finally {
            setSubmitting(false);
          }
        }}
      >
        {(props) => <LoginFields {...props} />}
      </Formik>

      <div className="mt-6 flex items-center justify-center gap-1.5 border-t border-glass-border pt-5">
        <span className="text-sm font-medium text-text-muted">{t("auth.login.noAccount")}</span>
        <Link href="/register" className="text-sm font-extrabold text-solar-light">
          {t("auth.login.createOne")}
        </Link>
      </div>
    </GlassCard>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
