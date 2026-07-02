// Time-display helpers shared by web + mobile (e.g. the notifications list).
import { DEFAULT_LOCALE, translate, type Locale } from "../i18n";

/** Compact "time ago" label from an ISO timestamp (e.g. "5m ago", "2h ago"). */
export function timeAgo(iso: string, locale: Locale = DEFAULT_LOCALE): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return translate(locale, "time.justNow");
  if (m < 60) return translate(locale, "time.minutesAgo", { m });
  const h = Math.floor(m / 60);
  if (h < 24) return translate(locale, "time.hoursAgo", { h });
  return translate(locale, "time.daysAgo", { d: Math.floor(h / 24) });
}
