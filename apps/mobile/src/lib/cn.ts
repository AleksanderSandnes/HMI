/**
 * Tiny className joiner for NativeWind. Joins truthy class strings with a space;
 * later classes should win for conflicting utilities (keep call sites
 * non-conflicting since we don't pull in tailwind-merge on native).
 */
export type ClassValue = string | false | null | undefined;

export function cn(...values: ClassValue[]): string {
  return values.filter(Boolean).join(" ");
}
