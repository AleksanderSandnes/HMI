import {
  DEFAULT_LOCALE,
  getTranslator,
  isLocale,
  translatePlural,
  type Locale,
  type PluralBaseKey,
  type TranslateParams,
  type Translator,
} from "@hmi/core";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

const STORAGE_KEY = "pref.language";

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: Translator;
  tp: (base: PluralBaseKey, count: number, params?: TranslateParams) => string;
}

// English no-op fallback for components rendered outside `I18nProvider` —
// e.g. unit tests that mount a single component directly with no provider
// tree. The real app always mounts `I18nProvider` in the root layout.
const DEFAULT_CONTEXT: I18nContextValue = {
  locale: DEFAULT_LOCALE,
  setLocale: () => {},
  t: getTranslator(DEFAULT_LOCALE),
  tp: (base, count, params) => translatePlural(DEFAULT_LOCALE, base, count, params),
};

const I18nContext = createContext<I18nContextValue>(DEFAULT_CONTEXT);

/**
 * Resolves the boot locale (stored, else English) before first paint —
 * mirrors `useThemeBootstrap` so the root layout can gate on `ready` and the
 * app never flashes the wrong language.
 */
export function useI18nBootstrap(): { locale: Locale; ready: boolean } {
  const [state, setState] = useState<{ locale: Locale; ready: boolean }>({
    locale: DEFAULT_LOCALE,
    ready: false,
  });

  useEffect(() => {
    let alive = true;
    void (async () => {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      const initial = isLocale(stored) ? stored : DEFAULT_LOCALE;
      if (alive) setState({ locale: initial, ready: true });
    })();
    return () => {
      alive = false;
    };
  }, []);

  return state;
}

export function I18nProvider({
  locale: initialLocale,
  children,
}: {
  locale: Locale;
  children: ReactNode;
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    void AsyncStorage.setItem(STORAGE_KEY, next);
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

export default I18nProvider;
