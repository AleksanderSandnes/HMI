"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Formik } from "formik";
import { ArrowRight, Lock, Mail, Zap } from "lucide-react";
import { loginSchema } from "@hmi/core";
import { useCore } from "@/lib/hooks/useCore";
import { GlassCard } from "@/components/ui/GlassCard";
import { Field } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { StatusBanner } from "@/components/ui/StatusBanner";

function LoginForm() {
  const { auth } = useCore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") || "/dashboard";
  const [error, setError] = useState<string | null>(null);

  return (
    <GlassCard strong elevated className="w-full max-w-[430px] p-8 sm:p-9">
      <div className="mb-6 flex flex-col items-center text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-[18px] bg-[linear-gradient(135deg,#fde047,#fbbf24,#f59e0b)]">
          <Zap size={20} className="text-text-inverse" fill="currentColor" />
        </div>
        <h1 className="text-[26px] font-extrabold tracking-tight text-text-primary">
          Welcome back
        </h1>
        <p className="mt-1.5 text-sm font-medium text-text-muted">
          Sign in to your energy dashboard
        </p>
      </div>

      {error ? <StatusBanner kind="error" message={error} /> : null}

      <Formik
        initialValues={{ email: "", password: "" }}
        validationSchema={loginSchema}
        onSubmit={async (values, { setSubmitting }) => {
          setError(null);
          try {
            await auth.loginUser(values);
            router.replace(redirectTo);
            router.refresh();
          } catch (e) {
            setError(
              e instanceof Error
                ? e.message
                : "Login failed. Check your credentials and try again."
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
          <form onSubmit={handleSubmit} noValidate>
            <Field
              label="EMAIL ADDRESS"
              icon={Mail}
              name="email"
              inputMode="email"
              autoComplete="email"
              placeholder="you@domain.com"
              value={values.email}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.email ? errors.email : undefined}
              disabled={isSubmitting}
            />
            <Field
              label="PASSWORD"
              icon={Lock}
              secure
              name="password"
              autoComplete="current-password"
              placeholder="Enter your password"
              value={values.password}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.password ? errors.password : undefined}
              disabled={isSubmitting}
            />
            <Button
              type="submit"
              label="Sign In"
              icon={ArrowRight}
              loading={isSubmitting}
              className="mt-1.5"
            />
          </form>
        )}
      </Formik>

      <div className="mt-6 flex items-center justify-center gap-1.5 border-t border-glass-border pt-5">
        <span className="text-sm font-medium text-text-muted">
          Don&apos;t have an account?
        </span>
        <Link
          href="/register"
          className="text-sm font-extrabold text-solar-light"
        >
          Create one
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
