export const SETTINGS_SECTIONS = ["profile", "password", "growatt", "weather"] as const;

export type Section = (typeof SETTINGS_SECTIONS)[number];

/**
 * Parse the `?section=` query param. `null` means "no panel open": mobile
 * shows the settings list, desktop falls back to the profile panel.
 */
export function sectionFromParam(value: string | null): Section | null {
  return SETTINGS_SECTIONS.find((s) => s === value) ?? null;
}
