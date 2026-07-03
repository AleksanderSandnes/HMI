import { Appearance } from "react-native";

import { resolvePreference } from "../lib/theme";

describe("resolvePreference", () => {
  afterEach(() => jest.restoreAllMocks());

  it("passes explicit preferences through", () => {
    expect(resolvePreference("light")).toBe("light");
    expect(resolvePreference("dark")).toBe("dark");
  });

  it("resolves system to the OS scheme", () => {
    jest.spyOn(Appearance, "getColorScheme").mockReturnValue("light");
    expect(resolvePreference("system")).toBe("light");
    jest.spyOn(Appearance, "getColorScheme").mockReturnValue("dark");
    expect(resolvePreference("system")).toBe("dark");
  });

  it("defaults system to dark when the OS scheme is unknown", () => {
    jest.spyOn(Appearance, "getColorScheme").mockReturnValue(null);
    expect(resolvePreference("system")).toBe("dark");
  });
});
