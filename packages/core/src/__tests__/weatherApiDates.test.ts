import { describe, expect, it } from "vitest";

import { isLiveDate, parseYmd, toYmd, weekDatesEnding } from "../api/weather";

describe("toYmd", () => {
  it("zero-pads month and day", () => {
    expect(toYmd(new Date(2026, 0, 5))).toBe("20260105");
    expect(toYmd(new Date(2026, 11, 31))).toBe("20261231");
  });
});

describe("parseYmd", () => {
  it("round-trips with toYmd in local time", () => {
    const d = parseYmd("20260228");
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(1);
    expect(d.getDate()).toBe(28);
    expect(toYmd(d)).toBe("20260228");
  });
});

describe("isLiveDate", () => {
  const now = new Date(2026, 2, 15, 12, 0, 0);

  it("treats today and yesterday as live", () => {
    expect(isLiveDate("20260315", now)).toBe(true);
    expect(isLiveDate("20260314", now)).toBe(true);
  });

  it("treats older and future days as settled", () => {
    expect(isLiveDate("20260313", now)).toBe(false);
    expect(isLiveDate("20260316", now)).toBe(false);
  });

  it("handles month boundaries", () => {
    expect(isLiveDate("20260228", new Date(2026, 2, 1, 8, 0, 0))).toBe(true);
  });
});

describe("weekDatesEnding", () => {
  it("returns the 7 dates ending on the given day, oldest first", () => {
    expect(weekDatesEnding("20260315")).toEqual([
      "20260309",
      "20260310",
      "20260311",
      "20260312",
      "20260313",
      "20260314",
      "20260315",
    ]);
  });

  it("ends on the injected now when no end date is given", () => {
    const dates = weekDatesEnding(undefined, new Date(2026, 0, 3));
    expect(dates).toHaveLength(7);
    expect(dates[6]).toBe("20260103");
    expect(dates[0]).toBe("20251228");
  });
});
