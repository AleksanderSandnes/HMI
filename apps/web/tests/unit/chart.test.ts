import { describe, expect, it } from "vitest";
import { barGapPercent, weatherYDomain } from "@/lib/chart";

describe("weatherYDomain", () => {
  it("anchors the floor at 0 and pads the top for all-positive data", () => {
    const { min, max, range } = weatherYDomain([0, 50, 100]);
    expect(min).toBe(0);
    // 14% headroom above the raw max.
    expect(max).toBeCloseTo(114);
    expect(range).toBeCloseTo(114);
  });

  it("pads both ends when values go negative", () => {
    const { min, max } = weatherYDomain([-10, 10]);
    const padTop = (10 - -10) * 0.14; // 2.8
    expect(max).toBeCloseTo(10 + padTop);
    expect(min).toBeCloseTo(-10 - padTop);
  });

  it("expands a flat line into a visible band", () => {
    // All equal → widened to [v-1, v+1] before padding, then floored at 0.
    const { min, max } = weatherYDomain([5, 5, 5]);
    expect(min).toBe(0); // positive data → floor at 0
    expect(max).toBeGreaterThan(5);
  });

  it("keeps a flat negative line off the axis", () => {
    const { min, max } = weatherYDomain([-5, -5]);
    expect(min).toBeLessThan(-5);
    expect(max).toBeGreaterThan(-5);
  });

  it("returns a safe unit domain for empty input", () => {
    expect(weatherYDomain([])).toEqual({ min: 0, max: 1, range: 1 });
  });
});

describe("barGapPercent", () => {
  it("shrinks the gap as bar count grows, always below 50", () => {
    expect(barGapPercent(5)).toBe(46); // sparse (e.g. 5-year)
    expect(barGapPercent(12)).toBe(46);
    expect(barGapPercent(13)).toBe(42); // ~weekly/yearly
    expect(barGapPercent(24)).toBe(42);
    expect(barGapPercent(31)).toBe(34); // dense (month of days)
  });

  it("never reaches the Recharts zero-width threshold of 50", () => {
    for (let n = 0; n <= 366; n++) {
      expect(barGapPercent(n)).toBeLessThan(50);
    }
  });
});
