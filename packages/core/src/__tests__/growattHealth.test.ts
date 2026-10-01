import { afterEach, describe, expect, it, vi } from "vitest";

import type { CoreApiContext } from "../api/context";
import { createGrowattApi } from "../api/growatt";

function api() {
  return createGrowattApi({
    env: { javaApiBaseUrl: "https://growatt.example.test" },
  } as CoreApiContext);
}

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("Growatt health probe", () => {
  it.each([true, false])("reports HTTP success %s and releases its timeout", async (ok) => {
    vi.useFakeTimers();
    const fetchMock = vi.fn().mockResolvedValue({ ok });
    vi.stubGlobal("fetch", fetchMock);
    await expect(api().checkApiHealth()).resolves.toBe(ok);
    expect(fetchMock).toHaveBeenCalledWith("https://growatt.example.test/api/growatt/health", {
      method: "GET",
      signal: expect.any(AbortSignal),
    });
    expect(vi.getTimerCount()).toBe(0);
  });

  it("reports network failures and releases the timeout immediately", async () => {
    vi.useFakeTimers();
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    await expect(api().checkApiHealth()).resolves.toBe(false);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("aborts a stalled request after five seconds", async () => {
    vi.useFakeTimers();
    vi.spyOn(console, "error").mockImplementation(() => {});
    const fetchMock = vi.fn(
      (_url: string, init: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init.signal?.addEventListener("abort", () => reject(new Error("aborted")), {
            once: true,
          });
        }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const result = api().checkApiHealth();
    await vi.advanceTimersByTimeAsync(5000);
    await expect(result).resolves.toBe(false);
    expect(fetchMock.mock.calls[0][1].signal?.aborted).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
  });
});
