import { describe, expect, it } from "vitest";

import { BREAKPOINTS } from "../constants";
import { isPhoneWeekly } from "../utils/weatherSeries";

describe("isPhoneWeekly", () => {
  const phone = BREAKPOINTS.tablet - 1;
  const tablet = BREAKPOINTS.tablet;

  it("is true only on a phone-sized viewport in the weekly timespan", () => {
    expect(isPhoneWeekly(phone, "weekly")).toBe(true);
  });

  it("is false on tablet width even in weekly", () => {
    expect(isPhoneWeekly(tablet, "weekly")).toBe(false);
    expect(isPhoneWeekly(tablet + 400, "weekly")).toBe(false);
  });

  it("is false for non-weekly timespans on a phone", () => {
    expect(isPhoneWeekly(phone, "hourly")).toBe(false);
    expect(isPhoneWeekly(phone, "monthly")).toBe(false);
  });
});
