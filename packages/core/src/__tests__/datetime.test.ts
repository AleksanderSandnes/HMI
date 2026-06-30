import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { timeAgo } from "../utils/datetime";

describe("timeAgo", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-30T12:00:00Z"));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  const ago = (ms: number) => new Date(Date.now() - ms).toISOString();

  it('renders "just now" under a minute', () => {
    expect(timeAgo(ago(30_000))).toBe("just now");
  });

  it("renders minutes under an hour", () => {
    expect(timeAgo(ago(5 * 60_000))).toBe("5m ago");
    expect(timeAgo(ago(59 * 60_000))).toBe("59m ago");
  });

  it("renders hours under a day", () => {
    expect(timeAgo(ago(2 * 3_600_000))).toBe("2h ago");
    expect(timeAgo(ago(23 * 3_600_000))).toBe("23h ago");
  });

  it("renders days beyond 24 hours", () => {
    expect(timeAgo(ago(3 * 86_400_000))).toBe("3d ago");
  });
});
