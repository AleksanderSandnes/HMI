"use client";

import type { Locale } from "@hmi/core";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { useState } from "react";

import { LocaleProvider } from "@/lib/i18n";

/**
 * Client providers (theme + locale + React Query). Auth/session is read from Supabase SSR
 * cookies, so there is no global auth store provider here (replaces the RN Redux setup).
 */
export function Providers({
  initialLocale,
  children,
}: {
  initialLocale: Locale;
  children: React.ReactNode;
}) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      }),
  );

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <LocaleProvider initialLocale={initialLocale}>
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      </LocaleProvider>
    </ThemeProvider>
  );
}
