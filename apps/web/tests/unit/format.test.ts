import { describe, expect, it } from "vitest";
import { average, clamp, lastPositive, round, show, toNum } from "@/lib/format";

describe("toNum", () => {
  it("passes finite numbers through", () => {
    expect(toNum(0)).toBe(0);
    expect(toNum(12.5)).toBe(12.5);
    expect(toNum(-3)).toBe(-3);
  });

  it("returns null for nullish or non-numeric input", () => {
    expect(toNum(null)).toBeNull();
    expect(toNum(undefined)).toBeNull();
    expect(toNum(NaN)).toBeNull();
  });
});

describe("round", () => {
  it("rounds to the requested precision", () => {
    expect(round(12.345, 1)).toBe(12.3);
    expect(round(12.345, 2)).toBe(12.35);
    expect(round(12.5)).toBe(13);
  });

  it("defaults to whole numbers and preserves null", () => {
    expect(round(9.6)).toBe(10);
    expect(round(null)).toBeNull();
    expect(round(undefined, 2)).toBeNull();
  });
});

describe("show", () => {
  it("formats a rounded value as a string", () => {
    expect(show(12.34, 1)).toBe("12.3");
    expect(show(0)).toBe("0");
  });

  it("renders an em dash for missing values", () => {
    expect(show(null)).toBe("—");
    expect(show(undefined, 2)).toBe("—");
    expect(show(NaN)).toBe("—");
  });
});

describe("average", () => {
  it("averages the meaningful values, ignoring null/NaN/zero", () => {
    expect(average([10, 20, 30])).toBe(20);
    expect(average([10, 0, null, NaN, 30])).toBe(20);
  });

  it("returns null when nothing is meaningful", () => {
    expect(average([])).toBeNull();
    expect(average([0, null, NaN])).toBeNull();
  });

  it("keeps negatives (only exact zero is dropped)", () => {
    expect(average([-10, 10])).toBe(0);
  });
});

describe("lastPositive", () => {
  it("returns the last strictly-positive value", () => {
    expect(lastPositive([100, 250, 80, 0, 0])).toBe(80);
    expect(lastPositive([5])).toBe(5);
  });

  it("returns 0 when there is no positive value", () => {
    expect(lastPositive([])).toBe(0);
    expect(lastPositive([0, 0, 0])).toBe(0);
    expect(lastPositive([-5, -1])).toBe(0);
  });
});

describe("clamp", () => {
  it("constrains a value to the range", () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-2, 0, 10)).toBe(0);
    expect(clamp(99, 0, 10)).toBe(10);
  });
});
