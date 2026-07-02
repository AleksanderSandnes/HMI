// Locale registry + translation runtime. Adding a language means extending
// SUPPORTED_LOCALES and LANGUAGES, adding one catalog file, and registering it
// in CATALOGS — the selector UIs iterate LANGUAGES and pick it up.
import { en, type TranslationKey } from "./en";
import { nb } from "./nb";

export const SUPPORTED_LOCALES = ["en", "nb"] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";

export interface LanguageOption {
  code: Locale;
  /** Endonym — shown in its own language, never translated. */
  label: string;
  short: string;
}

export const LANGUAGES: readonly LanguageOption[] = [
  { code: "en", label: "English", short: "EN" },
  { code: "nb", label: "Norsk bokmål", short: "NO" },
];

export function isLocale(v: unknown): v is Locale {
  return typeof v === "string" && (SUPPORTED_LOCALES as readonly string[]).includes(v);
}

export type TranslateParams = Record<string, string | number>;
export type Translator = (key: TranslationKey, params?: TranslateParams) => string;

const CATALOGS: Record<Locale, Record<TranslationKey, string>> = { en, nb };

function interpolate(template: string, params?: TranslateParams): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in params ? String(params[name]) : match,
  );
}

export function translate(locale: Locale, key: TranslationKey, params?: TranslateParams): string {
  const template = CATALOGS[locale][key] ?? en[key];
  return interpolate(template, params);
}

export function getTranslator(locale: Locale): Translator {
  return (key, params) => translate(locale, key, params);
}

/** Keys that exist as `.one`/`.other` pairs, addressed by their base. */
export type PluralBaseKey = {
  [K in TranslationKey]: K extends `${infer Base}.one` ? Base : never;
}[TranslationKey];

export function translatePlural(
  locale: Locale,
  base: PluralBaseKey,
  count: number,
  params?: TranslateParams,
): string {
  const key = `${base}.${count === 1 ? "one" : "other"}` as TranslationKey;
  return translate(locale, key, { count, ...params });
}

export { en, nb };
export type { TranslationKey };
export * from "./dates";
