import AsyncStorage from "@react-native-async-storage/async-storage";
import { colorScheme as nwColorScheme } from "nativewind";
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { Appearance } from "react-native";

export type ThemeMode = "light" | "dark";

const STORAGE_KEY = "pref.theme";

/**
 * Chrome colors for non-className consumers (Ionicons `color=`, raw SVG
 * `stroke=`/`fill=`, `BlurView` `tint=`, `StatusBar` `style=`). Values mirror
 * the CSS variables in global.css — keep the two in sync. Gradient tokens
 * (solar/energy/accent/revenue fills, GRADIENTS in lib/gradients.ts) are
 * intentionally mode-independent and live outside this module.
 */
export interface ThemeColors {
  bgBase: string;
  glassFill: string;
  glassFillStrong: string;
  glassBorder: string;
  glassBorderStrong: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textInverse: string;
  positive: string;
  negative: string;
  /** Darker/lighter flat tint of the solar accent, used for label text/icons (not gradients). */
  solarTint: string;
  /** Darker/lighter flat tint of the energy accent, used for label text/icons (not gradients). */
  energyTint: string;
  /** Darker/lighter flat tint (sky blue) for precipitation-style data icons. */
  skyTint: string;
  /** Darker/lighter flat tint (cyan) for pressure-style data icons. */
  cyanTint: string;
  /** Faint disc fill behind compass/gauge dials (wind, barometer). */
  dialFill: string;
  /** Hairline ring stroke around compass/gauge dials. */
  dialRing: string;
  /** Dimming backdrop behind modals/sheets. */
  scrim: string;
  /** Solid (non-glass) panel background, e.g. the notifications sheet. */
  panelBg: string;
}

const LIGHT: ThemeColors = {
  bgBase: "#eaeef5",
  glassFill: "rgba(255, 255, 255, 0.66)",
  glassFillStrong: "rgba(255, 255, 255, 0.92)",
  glassBorder: "rgba(20, 26, 41, 0.1)",
  glassBorderStrong: "rgba(20, 26, 41, 0.14)",
  textPrimary: "#141a29",
  textSecondary: "#45506a",
  textMuted: "#7b8698",
  textInverse: "#0a1124",
  positive: "#059669",
  negative: "#e11d48",
  solarTint: "#d97706",
  energyTint: "#0d9488",
  skyTint: "#0284c7",
  cyanTint: "#0891b2",
  dialFill: "rgba(20, 26, 41, 0.045)",
  dialRing: "rgba(20, 26, 41, 0.14)",
  scrim: "rgba(20, 26, 41, 0.25)",
  panelBg: "rgba(255, 255, 255, 0.97)",
};

const DARK: ThemeColors = {
  bgBase: "#070b16",
  glassFill: "rgba(255, 255, 255, 0.045)",
  glassFillStrong: "rgba(255, 255, 255, 0.075)",
  glassBorder: "rgba(255, 255, 255, 0.09)",
  glassBorderStrong: "rgba(255, 255, 255, 0.16)",
  textPrimary: "#f6f8fc",
  textSecondary: "#aeb8cc",
  textMuted: "#71809a",
  textInverse: "#0a1124",
  positive: "#34d399",
  negative: "#fb7185",
  solarTint: "#fbbf24",
  energyTint: "#34d399",
  skyTint: "#38bdf8",
  cyanTint: "#22d3ee",
  dialFill: "rgba(255, 255, 255, 0.03)",
  dialRing: "rgba(255, 255, 255, 0.12)",
  scrim: "rgba(4, 7, 14, 0.5)",
  panelBg: "#0d1320",
};

/**
 * Ad-hoc low-alpha hairline (gauge ticks/rings, etc. not covered by a named
 * token) — white-on-dark in dark mode, the same alpha dark-tinted-on-light in
 * light mode. Matches how the design's own border tokens relate (`--bd`/
 * `--bdS` use ~the same alpha as their dark equivalents, just the opposite
 * base color).
 */
export function hairline(mode: ThemeMode, alpha: number): string {
  return mode === "dark" ? `rgba(255, 255, 255, ${alpha})` : `rgba(20, 26, 41, ${alpha})`;
}

async function loadStoredMode(): Promise<ThemeMode | null> {
  const v = await AsyncStorage.getItem(STORAGE_KEY);
  return v === "light" || v === "dark" ? v : null;
}

interface ThemeContextValue {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  colors: ThemeColors;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

/**
 * Resolves the boot mode (stored preference, else system) and applies it to
 * NativeWind's colorScheme before first paint. Mirrors the font-loading gate
 * in app/_layout.tsx — render a spinner until `ready`, then mount
 * `ThemeProvider` with the resolved `mode`, so there's no flash of the wrong
 * theme.
 */
export function useThemeBootstrap(): { mode: ThemeMode; ready: boolean } {
  const [state, setState] = useState<{ mode: ThemeMode; ready: boolean }>({
    mode: "dark",
    ready: false,
  });

  useEffect(() => {
    let alive = true;
    void (async () => {
      const stored = await loadStoredMode();
      const initial = stored ?? (Appearance.getColorScheme() === "light" ? "light" : "dark");
      nwColorScheme.set(initial);
      if (alive) setState({ mode: initial, ready: true });
    })();
    return () => {
      alive = false;
    };
  }, []);

  return state;
}

export function ThemeProvider({
  mode: initialMode,
  children,
}: {
  mode: ThemeMode;
  children: ReactNode;
}) {
  const [mode, setModeState] = useState<ThemeMode>(initialMode);

  const setMode = useCallback((next: ThemeMode) => {
    nwColorScheme.set(next);
    setModeState(next);
    void AsyncStorage.setItem(STORAGE_KEY, next);
  }, []);

  const colors = mode === "dark" ? DARK : LIGHT;

  return (
    <ThemeContext.Provider value={{ mode, setMode, colors }}>{children}</ThemeContext.Provider>
  );
}

/** Current mode + colors + setter. Must be used within `ThemeProvider`. */
export function useThemeColors(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useThemeColors must be used within ThemeProvider");
  return ctx;
}

export default ThemeProvider;
