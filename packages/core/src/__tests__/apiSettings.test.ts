import { describe, expect, it } from "vitest";

import { growattConfig, weatherConfig } from "../utils/apiSettings";

describe("growattConfig", () => {
  it("derives a masked email + configured flag", () => {
    expect(
      growattConfig({ growatt: { email: "a@b.com", plantId: "1", hasPassword: true } }),
    ).toEqual({ key: "a@b.com", email: "a@b.com", configured: true });
  });

  it("falls back to placeholders when unset", () => {
    expect(growattConfig(null)).toEqual({ key: "g", email: "", configured: false });
    expect(growattConfig(undefined)).toEqual({ key: "g", email: "", configured: false });
    expect(growattConfig({})).toEqual({ key: "g", email: "", configured: false });
  });
});

describe("weatherConfig", () => {
  it("derives station id + configured flag", () => {
    expect(weatherConfig({ weather: { stationId: "KXX", hasApiKey: true } })).toEqual({
      key: "KXX",
      station: "KXX",
      configured: true,
    });
  });

  it("falls back to placeholders when unset", () => {
    expect(weatherConfig(null)).toEqual({ key: "w", station: "", configured: false });
    expect(weatherConfig({ weather: { stationId: "KXX", hasApiKey: false } })).toEqual({
      key: "KXX",
      station: "KXX",
      configured: false,
    });
  });
});
