import { describe, expect, it } from "vitest";

import {
  formatDayMonthLong,
  monthAbbr,
  monthName,
  translatePlural,
  weekdayAbbr,
  weekdayName,
} from "../i18n";

describe("localized date boundaries", () => {
  it("returns empty names for out-of-range indices", () => {
    for (const lookup of [monthName, monthAbbr, weekdayName, weekdayAbbr]) {
      expect(lookup("en", -1)).toBe("");
      expect(lookup("nb", 99)).toBe("");
    }
    expect(formatDayMonthLong("en", new Date(2026, 8, 30))).toBe("September 30");
  });
});

describe("plural translation", () => {
  it("selects singular and plural keys and interpolates the count", () => {
    expect(translatePlural("nb", "notifications.count", 1)).toBe("1 varsel");
    expect(translatePlural("nb", "notifications.count", 2, {})).toBe("2 varsler");
    expect(translatePlural("en", "notifications.count", 0)).toBe("0 notifications");
  });
});
