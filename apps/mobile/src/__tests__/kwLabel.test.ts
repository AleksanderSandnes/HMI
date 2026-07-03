import { kwLabel } from "../components/dashboard/SolarHeroCard";

describe("kwLabel", () => {
  it("formats watts as kW with two decimals under 10 kW", () => {
    expect(kwLabel(0)).toBe("0.00");
    expect(kwLabel(2450)).toBe("2.45");
  });

  it("drops to one decimal from 10 kW", () => {
    expect(kwLabel(10_900)).toBe("10.9");
  });

  it("shows an em dash for missing values", () => {
    expect(kwLabel(null)).toBe("—");
    expect(kwLabel(undefined)).toBe("—");
  });
});
