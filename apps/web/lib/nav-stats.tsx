"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

export interface SolarNavStats {
  generation: string;
  genUnit: string;
  peak: string;
  peakUnit: string;
}

interface NavStatsValue {
  solarStats: SolarNavStats | null;
  setSolarStats: (s: SolarNavStats | null) => void;
}

const NavStatsContext = createContext<NavStatsValue>({
  solarStats: null,
  setSolarStats: () => {},
});

/**
 * Lets a page publish a couple of headline stats to the top nav (e.g. the Solar
 * page shares its current generation/peak so the nav widget can show them next
 * to the temp/location chip). Provided around AppNav + the page content.
 */
export function NavStatsProvider({ children }: { children: ReactNode }) {
  const [solarStats, setSolarStats] = useState<SolarNavStats | null>(null);
  return (
    <NavStatsContext.Provider value={{ solarStats, setSolarStats }}>
      {children}
    </NavStatsContext.Provider>
  );
}

export const useNavStats = () => useContext(NavStatsContext);
