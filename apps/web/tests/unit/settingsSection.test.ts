import { describe, expect, it } from "vitest";

import { SETTINGS_SECTIONS, sectionFromParam } from "@/lib/settingsSection";

describe("sectionFromParam", () => {
  it("accepts every known section", () => {
    for (const s of SETTINGS_SECTIONS) expect(sectionFromParam(s)).toBe(s);
  });

  it("returns null for unknown values", () => {
    expect(sectionFromParam("bogus")).toBeNull();
    expect(sectionFromParam("")).toBeNull();
  });

  it("returns null when the param is absent", () => {
    expect(sectionFromParam(null)).toBeNull();
  });
});
