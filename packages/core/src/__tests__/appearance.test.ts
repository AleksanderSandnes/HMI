import { describe, expect, it } from "vitest";

import { getTranslator } from "../i18n";
import { appearanceLabel } from "../utils/appearance";

const t = getTranslator("en");

describe("appearanceLabel", () => {
  it("returns the plain mode label for explicit preferences", () => {
    expect(appearanceLabel("dark", "dark", t)).toBe(t("settings.dark"));
    expect(appearanceLabel("light", "light", t)).toBe(t("settings.light"));
  });

  it("wraps the resolved mode when following the system", () => {
    expect(appearanceLabel("system", "dark", t)).toBe(
      t("settings.systemRightNow", { mode: t("settings.dark") }),
    );
    expect(appearanceLabel("system", "light", t)).toBe(
      t("settings.systemRightNow", { mode: t("settings.light") }),
    );
  });
});
