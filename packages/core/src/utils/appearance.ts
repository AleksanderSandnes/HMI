import type { Translator } from "../i18n";

export type AppearancePreference = "light" | "dark" | "system";

/**
 * Subtitle for the appearance setting: the resolved mode's label, wrapped in
 * "System — currently {mode}" when the preference follows the system.
 */
export function appearanceLabel(
  preference: AppearancePreference,
  resolvedMode: "light" | "dark",
  t: Translator,
): string {
  const mode = resolvedMode === "dark" ? t("settings.dark") : t("settings.light");
  return preference === "system" ? t("settings.systemRightNow", { mode }) : mode;
}
