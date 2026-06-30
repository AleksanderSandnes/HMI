import { toNum, round, show, average, lastPositive, clamp } from "../lib/format";

describe("toNum", () => {
  it("coerces numeric input and preserves null for missing/non-numeric", () => {
    expect(toNum(3.5)).toBe(3.5);
    expect(toNum(0)).toBe(0);
    expect(toNum(null)).toBeNull();
    expect(toNum(undefined)).toBeNull();
    expect(toNum(NaN)).toBeNull();
  });
});

describe("round", () => {
  it("rounds to dp places, preserving null", () => {
    expect(round(3.14159, 2)).toBe(3.14);
    expect(round(2.5)).toBe(3);
    expect(round(null, 2)).toBeNull();
  });
});

describe("show", () => {
  it("renders rounded value or an em dash for missing", () => {
    expect(show(12.34, 1)).toBe("12.3");
    expect(show(null)).toBe("—");
    expect(show(undefined, 2)).toBe("—");
  });
});

describe("average", () => {
  it("averages meaningful values, ignoring null/NaN and exact zeros", () => {
    expect(average([10, 20, 30])).toBe(20);
    expect(average([0, 10, null, NaN, 20])).toBe(15);
    expect(average([0, 0])).toBeNull();
    expect(average([])).toBeNull();
  });
});

describe("lastPositive", () => {
  it("returns the last strictly-positive value, else 0", () => {
    expect(lastPositive([1, 5, 0, 0])).toBe(5);
    expect(lastPositive([0, 0])).toBe(0);
    expect(lastPositive([])).toBe(0);
    expect(lastPositive([3, 0, 7])).toBe(7);
  });
});

describe("clamp", () => {
  it("clamps into the inclusive range", () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-3, 0, 10)).toBe(0);
    expect(clamp(99, 0, 10)).toBe(10);
  });
});
