// Numeric coercion / display helpers moved into @hmi/core so web and mobile
// share one implementation. Re-exported here so existing `src/lib/format`
// imports keep working.
export { toNum, round, show, average, lastPositive, clamp } from "@hmi/core";
