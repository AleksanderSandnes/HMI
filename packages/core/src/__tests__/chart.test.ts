import { describe, expect, it } from "vitest";
import { weatherYDomain, barGapPercent } from "../utils/chart";

describe("weatherYDomain", () => {
  it("returns a unit band for an empty series", () => {
    expect(weatherYDomain([])).toEqual({ min: 0, max: 1, range: 1 });
  });

  it("anchors the floor at 0 for all-positive data and pads the top ~14%", () => {
    const d = weatherYDomain([0, 50, 100]);
    expect(d.min).toBe(0);
    expect(d.max).toBeCloseTo(114, 5); // 100 + (100-0)*0.14
    expect(d.range).toBeCloseTo(114, 5);
  });

  it("pads both ends when data dips below zero", () => {
    const d = weatherYDomain([-10, 10]);
    const pad = (10 - -10) * 0.14; // 2.8
    expect(d.max).toBeCloseTo(10 + pad, 5);
    expect(d.min).toBeCloseTo(-10 - pad, 5);
  });

  it("expands a flat line into a visible band", () => {
    const d = weatherYDomain([5, 5, 5]);
    // yMin/yMax become 4/6, then floor anchors at 0 (rawMin >= 0), top pads.
    expect(d.min).toBe(0);
    expect(d.max).toBeGreaterThan(6);
    expect(d.range).toBeGreaterThan(0);
  });
});

describe("barGapPercent", () => {
  it("scales the gap to the bar count and stays below 50", () => {
    expect(barGapPercent(5)).toBe(46); // sparse (<=12)
    expect(barGapPercent(12)).toBe(46);
    expect(barGapPercent(13)).toBe(42); // medium (13..24)
    expect(barGapPercent(24)).toBe(42);
    expect(barGapPercent(30)).toBe(34); // dense (>24)
  });
});
