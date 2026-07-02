// Locale-keyed month/weekday name tables. Used instead of
// `toLocaleDateString` because Hermes ships a partial Intl — "nb-NO" month and
// weekday names are not guaranteed on React Native, and tables keep web and
// mobile output identical. Norwegian names are intentionally lowercase.
import type { Locale } from "./index";

export interface DateNames {
  /** Full month names, indexed by `Date.getMonth()` (0 = January). */
  months: readonly string[];
  /** Abbreviated month names, indexed by `Date.getMonth()`. */
  monthsShort: readonly string[];
  /** Full weekday names, indexed by `Date.getDay()` (0 = Sunday). */
  weekdays: readonly string[];
  /** Abbreviated weekday names, indexed by `Date.getDay()`. */
  weekdaysShort: readonly string[];
}

export const DATE_NAMES: Record<Locale, DateNames> = {
  en: {
    months: [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ],
    monthsShort: [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ],
    weekdays: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    weekdaysShort: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
  },
  nb: {
    months: [
      "januar",
      "februar",
      "mars",
      "april",
      "mai",
      "juni",
      "juli",
      "august",
      "september",
      "oktober",
      "november",
      "desember",
    ],
    monthsShort: [
      "jan",
      "feb",
      "mar",
      "apr",
      "mai",
      "jun",
      "jul",
      "aug",
      "sep",
      "okt",
      "nov",
      "des",
    ],
    weekdays: ["søndag", "mandag", "tirsdag", "onsdag", "torsdag", "fredag", "lørdag"],
    weekdaysShort: ["søn", "man", "tir", "ons", "tor", "fre", "lør"],
  },
};

export function monthName(locale: Locale, monthIndex: number): string {
  return DATE_NAMES[locale].months[monthIndex] ?? "";
}

export function monthAbbr(locale: Locale, monthIndex: number): string {
  return DATE_NAMES[locale].monthsShort[monthIndex] ?? "";
}

export function weekdayName(locale: Locale, dayIndex: number): string {
  return DATE_NAMES[locale].weekdays[dayIndex] ?? "";
}

export function weekdayAbbr(locale: Locale, dayIndex: number): string {
  return DATE_NAMES[locale].weekdaysShort[dayIndex] ?? "";
}

/** Compact day-of-month + month, e.g. "Jul 2" (en) / "2. jul" (nb). */
export function formatDayMonth(locale: Locale, d: Date): string {
  const abbr = monthAbbr(locale, d.getMonth());
  return locale === "en" ? `${abbr} ${d.getDate()}` : `${d.getDate()}. ${abbr}`;
}

/** Full-month day-of-month, e.g. "July 2" (en) / "2. juli" (nb). */
export function formatDayMonthLong(locale: Locale, d: Date): string {
  const month = monthName(locale, d.getMonth());
  return locale === "en" ? `${month} ${d.getDate()}` : `${d.getDate()}. ${month}`;
}
