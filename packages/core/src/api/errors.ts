// Locale-aware errors for the API layer. The api/* modules run outside any
// React tree and can't know the user's language, so instead of a translated
// string they throw a `CoreError` carrying a catalog key; the apps translate
// it at display time via `coreErrorMessage`. `message` stays the English
// catalog value so logs and non-localized callers keep working.
import { translate, type TranslationKey, type Translator } from "../i18n";

export class CoreError extends Error {
  readonly key: TranslationKey;

  constructor(key: TranslationKey) {
    super(translate("en", key));
    this.name = "CoreError";
    this.key = key;
  }
}

/**
 * Display message for a caught error: `CoreError`s translate through `t`,
 * plain `Error`s keep their message (e.g. Supabase's own English text), and
 * anything else falls back to the given already-translated string.
 */
export function coreErrorMessage(err: unknown, t: Translator, fallback: string): string {
  if (err instanceof CoreError) return t(err.key);
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}
