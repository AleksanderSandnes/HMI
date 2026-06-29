import { describe, expect, it } from "vitest";
import {
  buildMonthGrid,
  nextZoomView,
  parseYMD,
  sameDay,
  shiftYMD,
  toYMD,
  yearBlockStart,
} from "@/lib/date";

describe("parseYMD / toYMD", () => {
  it("round-trips a date string without timezone drift", () => {
    expect(toYMD(parseYMD("2026-06-30"))).toBe("2026-06-30");
    expect(toYMD(parseYMD("2026-01-01"))).toBe("2026-01-01");
  });

  it("parses into local date components", () => {
    const d = parseYMD("2026-06-30");
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(5); // June (0-indexed)
    expect(d.getDate()).toBe(30);
  });

  it("zero-pads month and day", () => {
    expect(toYMD(new Date(2026, 0, 5))).toBe("2026-01-05");
  });
});

describe("sameDay", () => {
  it("ignores the time component", () => {
    expect(sameDay(new Date(2026, 5, 30, 8), new Date(2026, 5, 30, 23))).toBe(true);
  });
  it("distinguishes different days", () => {
    expect(sameDay(new Date(2026, 5, 30), new Date(2026, 6, 1))).toBe(false);
  });
});

describe("shiftYMD", () => {
  it("steps forward and backward by whole days", () => {
    expect(shiftYMD("2026-06-30", 1)).toBe("2026-07-01"); // month rollover
    expect(shiftYMD("2026-06-01", -1)).toBe("2026-05-31");
  });

  it("crosses year boundaries", () => {
    expect(shiftYMD("2026-12-31", 1)).toBe("2027-01-01");
  });

  it("handles leap day", () => {
    expect(shiftYMD("2028-02-28", 1)).toBe("2028-02-29"); // 2028 is a leap year
  });
});

describe("buildMonthGrid", () => {
  it("returns a 6×7 grid aligned to the week", () => {
    const grid = buildMonthGrid(new Date(2026, 5, 1)); // June 2026
    expect(grid).toHaveLength(42);
    // First cell is the Sunday on/before the 1st. June 1 2026 is a Monday,
    // so the grid starts on Sunday May 31.
    expect(toYMD(grid[0])).toBe("2026-05-31");
    expect(grid[0].getDay()).toBe(0); // Sunday
    // The grid spans contiguous days.
    expect(toYMD(grid[41])).toBe("2026-07-11");
  });

  it("includes every day of the target month", () => {
    const grid = buildMonthGrid(new Date(2026, 5, 15));
    const june = grid.filter((d) => d.getMonth() === 5);
    expect(june).toHaveLength(30); // June has 30 days
  });
});

describe("yearBlockStart", () => {
  it("snaps to the start of the 12-year block", () => {
    expect(yearBlockStart(2026)).toBe(2016);
    expect(yearBlockStart(2016)).toBe(2016);
    expect(yearBlockStart(2015)).toBe(2004);
  });
});

describe("nextZoomView", () => {
  it("cycles day → month → year → day", () => {
    expect(nextZoomView("day")).toBe("month");
    expect(nextZoomView("month")).toBe("year");
    expect(nextZoomView("year")).toBe("day");
  });
});
