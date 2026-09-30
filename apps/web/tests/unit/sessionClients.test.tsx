import type { CookieOptions } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { coreContext } from "@/lib/supabase/context";

interface CookieBridge {
  cookies: {
    getAll: () => { name: string; value: string }[];
    setAll: (cookies: { name: string; value: string; options: CookieOptions }[]) => void;
  };
}
const fixture = vi.hoisted(() => ({
  getSession: vi.fn(),
  browserFactory: vi.fn(),
  serverFactory: vi.fn<(url: string, key: string, options: CookieBridge) => object>(),
  cookies: vi.fn(),
  getAll: vi.fn(),
  set: vi.fn(),
}));
vi.mock("@supabase/ssr", () => ({
  createBrowserClient: fixture.browserFactory,
  createServerClient: fixture.serverFactory,
}));
vi.mock("next/headers", () => ({ cookies: fixture.cookies }));
vi.mock("@/lib/env", () => ({
  SUPABASE_URL: "http://127.0.0.1:57321",
  SUPABASE_ANON_KEY: "fictional-anon-key",
  coreEnv: () => ({ dataMode: "production", javaApiBaseUrl: "http://127.0.0.1:18080" }),
}));

function client() {
  return { auth: { getSession: fixture.getSession } } as unknown as SupabaseClient;
}
beforeEach(() => {
  vi.resetModules();
  vi.resetAllMocks();
  fixture.browserFactory.mockReturnValue(client());
  fixture.serverFactory.mockReturnValue(client());
  fixture.cookies.mockResolvedValue({ getAll: fixture.getAll, set: fixture.set });
  fixture.getAll.mockReturnValue([{ name: "session", value: "fictional-session" }]);
});
afterEach(cleanup);

describe("web session clients", () => {
  it("reuses one browser client across consumers", async () => {
    const { createClient } = await import("@/lib/supabase/client");
    expect(createClient()).toBe(createClient());
    expect(fixture.browserFactory).toHaveBeenCalledTimes(1);
    expect(fixture.browserFactory).toHaveBeenCalledWith(
      "http://127.0.0.1:57321",
      "fictional-anon-key",
    );
  });

  it("awaits the request cookie store and writes refreshed cookies", async () => {
    const { createClient } = await import("@/lib/supabase/server");
    await createClient();
    const bridge = fixture.serverFactory.mock.calls[0][2];
    expect(bridge.cookies.getAll()).toEqual([{ name: "session", value: "fictional-session" }]);
    bridge.cookies.setAll([
      { name: "refreshed", value: "new-fictional-session", options: { httpOnly: true } },
    ]);
    expect(fixture.set).toHaveBeenCalledWith("refreshed", "new-fictional-session", {
      httpOnly: true,
    });
  });

  it("permits reads in server components with immutable cookies", async () => {
    fixture.set.mockImplementation(() => {
      throw new Error("Read-only cookie store");
    });
    const { createClient } = await import("@/lib/supabase/server");
    await createClient();
    const bridge = fixture.serverFactory.mock.calls[0][2];
    expect(() =>
      bridge.cookies.setAll([{ name: "session", value: "fictional", options: {} }]),
    ).not.toThrow();
    expect(bridge.cookies.getAll()).toHaveLength(1);
  });

  it("rejects when the request cookie store is unavailable", async () => {
    fixture.cookies.mockRejectedValue(new Error("No request scope"));
    const { createClient } = await import("@/lib/supabase/server");
    await expect(createClient()).rejects.toThrow("No request scope");
    expect(fixture.serverFactory).not.toHaveBeenCalled();
  });

  it("reads current session values afresh after an account switch", async () => {
    const context = coreContext(client());
    fixture.getSession.mockResolvedValue({
      data: { session: { access_token: "account-a-token", user: { id: "account-a" } } },
    });
    expect(await context.getAccessToken()).toBe("account-a-token");
    expect(await context.getCurrentUserId()).toBe("account-a");
    fixture.getSession.mockResolvedValue({
      data: { session: { access_token: "account-b-token", user: { id: "account-b" } } },
    });
    expect(await context.getAccessToken()).toBe("account-b-token");
    expect(await context.getCurrentUserId()).toBe("account-b");
  });

  it.each([null, {}])(
    "returns no identity or token for absent session fields: %j",
    async (session) => {
      fixture.getSession.mockResolvedValue({ data: { session } });
      const context = coreContext(client());
      expect(await context.getAccessToken()).toBeNull();
      expect(await context.getCurrentUserId()).toBeNull();
    },
  );

  it("propagates session-read failures instead of using stale identity", async () => {
    fixture.getSession.mockRejectedValue(new Error("Session unavailable"));
    const context = coreContext(client());
    await expect(context.getAccessToken()).rejects.toThrow("Session unavailable");
    await expect(context.getCurrentUserId()).rejects.toThrow("Session unavailable");
  });

  it("keeps API factories stable across rerenders with one shared client", async () => {
    const { useCore } = await import("@/lib/hooks/useCore");
    const hook = renderHook(useCore);
    const first = hook.result.current;
    hook.rerender();
    expect(hook.result.current).toBe(first);
    expect(fixture.browserFactory).toHaveBeenCalledTimes(1);
    expect(first.auth.confirmRegistration).toBeTypeOf("function");
    expect(first.account.deleteAccount).toBeTypeOf("function");
  });
});
