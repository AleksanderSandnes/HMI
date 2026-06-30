import { describe, expect, it } from "vitest";

import { average, clamp, lastPositive, round, show, toNum } from "../utils/format";

describe("toNum", () => {
  it("returns null for nullish or non-numeric input", () => {
    expect(toNum(null)).toBeNull();
    expect(toNum(undefined)).toBeNull();
    expect(toNum(NaN)).toBeNull();
  });

  it("coerces numeric values", () => {
    expect(toNum(0)).toBe(0);
    expect(toNum(42)).toBe(42);
    expect(toNum(-3.5)).toBe(-3.5);
  });
});

describe("round", () => {
  it("rounds to the requested decimal places", () => {
    expect(round(1.2345, 2)).toBe(1.23);
    expect(round(1.235, 2)).toBe(1.24);
    expect(round(1.5)).toBe(2);
  });

  it("defaults to zero decimal places and preserves null", () => {
    expect(round(9.7)).toBe(10);
    expect(round(null)).toBeNull();
    expect(round(undefined)).toBeNull();
  });
});

describe("show", () => {
  it("renders a rounded string", () => {
    expect(show(1.26, 1)).toBe("1.3");
    expect(show(5)).toBe("5");
  });

  it("renders an em dash for missing values", () => {
    expect(show(null)).toBe("—");
    expect(show(undefined)).toBe("—");
    expect(show(NaN)).toBe("—");
  });
});

describe("average", () => {
  it("ignores null, NaN, and exact zeros", () => {
    expect(average([10, null, 20, NaN, 0, undefined])).toBe(15);
  });

  it("returns null when there are no meaningful values", () => {
    expect(average([])).toBeNull();
    expect(average([0, null, NaN])).toBeNull();
  });
});

describe("lastPositive", () => {
  it("returns the last strictly-positive value", () => {
    expect(lastPositive([1, 5, 3, 0, 0])).toBe(3);
    expect(lastPositive([0, 2, 0, 9])).toBe(9);
  });

  it("returns 0 when nothing is positive", () => {
    expect(lastPositive([])).toBe(0);
    expect(lastPositive([0, -1, 0])).toBe(0);
  });
});

describe("clamp", () => {
  it("clamps into the inclusive range", () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-3, 0, 10)).toBe(0);
    expect(clamp(99, 0, 10)).toBe(10);
  });
});
