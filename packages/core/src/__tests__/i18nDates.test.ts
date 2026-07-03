import { describe, expect, it } from "vitest";

import { monthAbbr, monthName, weekdayName } from "../i18n/dates";

describe("monthName", () => {
  it("returns full month names per locale", () => {
    expect(monthName("en", 0)).toBe("January");
    expect(monthName("nb", 0)).toBe("januar");
    expect(monthName("en", 11)).toBe("December");
  });
});

describe("monthAbbr", () => {
  it("returns abbreviated month names per locale", () => {
    expect(monthAbbr("en", 1)).toBe("Feb");
    expect(monthAbbr("nb", 1)).toBe("feb");
  });
});

describe("weekdayName", () => {
  it("returns full weekday names indexed by Date.getDay()", () => {
    expect(weekdayName("en", 0)).toBe("Sunday");
    expect(weekdayName("nb", 0)).toBe("søndag");
    expect(weekdayName("en", 6)).toBe("Saturday");
  });
});
