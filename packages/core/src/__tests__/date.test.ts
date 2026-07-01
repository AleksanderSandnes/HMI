import { describe, expect, it } from "vitest";

import {
  buildMonthGrid,
  nextZoomView,
  parseYMD,
  sameDay,
  shiftYMD,
  toYMD,
  yearBlockStart,
} from "../utils/date";

describe("parseYMD / toYMD", () => {
  it("round-trips a date string without timezone drift", () => {
    const iso = "2026-07-01";
    expect(toYMD(parseYMD(iso))).toBe(iso);
  });

  it("parses into local-time components (no UTC shift)", () => {
    const d = parseYMD("2026-01-15");
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(0);
    expect(d.getDate()).toBe(15);
    expect(d.getHours()).toBe(0);
  });

  it("pads single-digit month and day", () => {
    expect(toYMD(new Date(2026, 2, 5))).toBe("2026-03-05");
  });
});

describe("sameDay", () => {
  it("ignores the time component", () => {
    expect(sameDay(new Date(2026, 6, 1, 8), new Date(2026, 6, 1, 23))).toBe(true);
    expect(sameDay(new Date(2026, 6, 1), new Date(2026, 6, 2))).toBe(false);
  });
});

describe("shiftYMD", () => {
  it("shifts forward and backward across month boundaries", () => {
    expect(shiftYMD("2026-07-01", -1)).toBe("2026-06-30");
    expect(shiftYMD("2026-07-31", 1)).toBe("2026-08-01");
    expect(shiftYMD("2026-12-31", 1)).toBe("2027-01-01");
  });
});

describe("buildMonthGrid", () => {
  it("returns a 42-cell grid starting on a Sunday", () => {
    const grid = buildMonthGrid(new Date(2026, 6, 1));
    expect(grid).toHaveLength(42);
    expect(grid[0].getDay()).toBe(0);
    // The 1st of the month must appear within the first week.
    const firstOfMonth = grid.findIndex((d) => d.getDate() === 1 && d.getMonth() === 6);
    expect(firstOfMonth).toBeGreaterThanOrEqual(0);
    expect(firstOfMonth).toBeLessThan(7);
  });

  it("covers the whole month within the grid", () => {
    const grid = buildMonthGrid(new Date(2026, 1, 1)); // Feb 2026 (28 days)
    const inMonth = grid.filter((d) => d.getMonth() === 1);
    expect(inMonth).toHaveLength(28);
  });
});

describe("yearBlockStart", () => {
  it("returns the first year of the 12-year block", () => {
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
