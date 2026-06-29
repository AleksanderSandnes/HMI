// Chart-geometry helpers moved into @hmi/core so web (Recharts) and mobile
// (Victory Native XL) share one implementation. Re-exported here so existing
// `@/lib/chart` imports keep working.
export { weatherYDomain, barGapPercent, type YDomain } from "@hmi/core";
