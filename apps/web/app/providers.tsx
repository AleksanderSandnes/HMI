"use client";

import type { Locale } from "@hmi/core";
import { ThemeProvider } from "next-themes";

import { AccountQueryProvider } from "@/lib/account-query-provider";
import { LocaleProvider } from "@/lib/i18n";

/**
 * Client providers (theme + locale + React Query). Auth/session is read from Supabase SSR
 * cookies, so there is no global auth store provider here (replaces the RN Redux setup).
 */
export function Providers({
  initialLocale,
  initialUserId,
  children,
}: {
  initialLocale: Locale;
  initialUserId: string | null;
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <LocaleProvider initialLocale={initialLocale}>
        <AccountQueryProvider initialUserId={initialUserId}>{children}</AccountQueryProvider>
      </LocaleProvider>
    </ThemeProvider>
  );
}
