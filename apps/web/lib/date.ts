// Local-time calendar helpers moved into @hmi/core so web and mobile share one
// implementation. Re-exported here so existing `@/lib/date` imports keep working.
export {
  parseYMD,
  toYMD,
  sameDay,
  shiftYMD,
  buildMonthGrid,
  yearBlockStart,
  nextZoomView,
} from "@hmi/core";
export type { CalendarView } from "@hmi/core";
