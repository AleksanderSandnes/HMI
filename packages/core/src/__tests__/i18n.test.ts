import { describe, expect, it } from "vitest";

import { formatDayMonth, formatDayMonthLong, isLocale, translate, weekdayAbbr } from "../i18n";
import { en } from "../i18n/en";
import { nb } from "../i18n/nb";
import { timeAgo } from "../utils/datetime";
import { periodLabel } from "../utils/solarStats";

describe("catalogs", () => {
  it("nb covers exactly the same keys as en", () => {
    expect(Object.keys(nb).sort()).toEqual(Object.keys(en).sort());
  });

  it("nb has no untranslated empty values", () => {
    for (const [key, value] of Object.entries(nb)) {
      expect(value, `nb["${key}"]`).not.toBe("");
    }
  });
});

describe("isLocale", () => {
  it("accepts supported locales and rejects everything else", () => {
    expect(isLocale("en")).toBe(true);
    expect(isLocale("nb")).toBe(true);
    expect(isLocale("de")).toBe(false);
    expect(isLocale(undefined)).toBe(false);
    expect(isLocale(42)).toBe(false);
  });
});

describe("translate", () => {
  it("interpolates {name} params", () => {
    expect(translate("en", "time.minutesAgo", { m: 5 })).toBe("5m ago");
    expect(translate("nb", "time.minutesAgo", { m: 5 })).toBe("5 min siden");
  });

  it("leaves unknown placeholders untouched", () => {
    expect(translate("en", "time.minutesAgo")).toBe("{m}m ago");
  });
});

describe("date names", () => {
  it("localizes weekday abbreviations", () => {
    expect(weekdayAbbr("en", 0)).toBe("Sun");
    expect(weekdayAbbr("nb", 0)).toBe("søn");
  });

  it("orders day-month per locale", () => {
    const d = new Date("2026-07-02T12:00:00");
    expect(formatDayMonth("en", d)).toBe("Jul 2");
    expect(formatDayMonth("nb", d)).toBe("2. jul");
    expect(formatDayMonthLong("nb", d)).toBe("2. juli");
  });
});

describe("localized helpers", () => {
  it("periodLabel translates to nb", () => {
    expect(periodLabel("hourly", "nb")).toBe("I dag");
    expect(periodLabel("weekly", "nb")).toBe("Denne uken");
  });

  it("timeAgo translates to nb", () => {
    const iso = new Date(Date.now() - 5 * 60_000).toISOString();
    expect(timeAgo(iso, "nb")).toBe("5 min siden");
  });
});
