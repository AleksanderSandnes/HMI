"use client";

import { BREAKPOINTS } from "@hmi/core";
import { useSyncExternalStore } from "react";

const subscribe = (onChange: () => void) => {
  window.addEventListener("resize", onChange);
  return () => window.removeEventListener("resize", onChange);
};

/**
 * Live viewport width for data-level responsive branches (e.g. the weather
 * band view) that CSS breakpoints can't express. Server-renders as
 * BREAKPOINTS.desktop, so the first client render on small screens may flip
 * once after hydration — callers must tolerate that.
 */
export function useViewportWidth(): number {
  return useSyncExternalStore(
    subscribe,
    () => window.innerWidth,
    () => BREAKPOINTS.desktop,
  );
}
