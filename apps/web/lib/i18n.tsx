"use client";

import {
  DEFAULT_LOCALE,
  getTranslator,
  translatePlural,
  type Locale,
  type PluralBaseKey,
  type TranslateParams,
  type Translator,
} from "@hmi/core";
import { createContext, useCallback, useContext, useMemo, useState } from "react";

import { LOCALE_COOKIE } from "./locale-cookie";

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: Translator;
  tp: (base: PluralBaseKey, count: number, params?: TranslateParams) => string;
}

// English no-op fallback for components rendered outside `LocaleProvider`
// (unit tests mounting a component directly). The app always mounts the
// provider in the root layout.
const DEFAULT_CONTEXT: I18nContextValue = {
  locale: DEFAULT_LOCALE,
  setLocale: () => {},
  t: getTranslator(DEFAULT_LOCALE),
  tp: (base, count, params) => translatePlural(DEFAULT_LOCALE, base, count, params),
};

const I18nContext = createContext<I18nContextValue>(DEFAULT_CONTEXT);

export function LocaleProvider({
  initialLocale,
  children,
}: {
  initialLocale: Locale;
  children: React.ReactNode;
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
    document.documentElement.lang = next;
  }, []);

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      setLocale,
      t: getTranslator(locale),
      tp: (base, count, params) => translatePlural(locale, base, count, params),
    }),
    [locale, setLocale],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

/** Current locale + setter + translators. English no-op outside the provider. */
export function useI18n(): I18nContextValue {
  return useContext(I18nContext);
}
