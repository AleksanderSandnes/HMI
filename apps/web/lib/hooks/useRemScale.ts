"use client";

import { useEffect, useState } from "react";

const readScale = (): number =>
  typeof document === "undefined"
    ? 1
    : parseFloat(getComputedStyle(document.documentElement).fontSize) / 16;

/**
 * Current root font-size relative to the 16px default (1 at ≤1920px viewports,
 * up to 1.3 at 4K — see the html clamp in globals.css). Multiply numeric px
 * APIs (e.g. Recharts geometry) by this so they track the fluid root scale.
 */
export function useRemScale(): number {
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const onResize = () => setScale(readScale());
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return scale;
}
