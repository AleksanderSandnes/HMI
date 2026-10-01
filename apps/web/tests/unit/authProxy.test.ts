import type { CookieOptions } from "@supabase/ssr";
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { updateSession } from "@/lib/supabase/proxy";

interface CookieWrite {
  name: string;
  value: string;
  options: CookieOptions;
}
interface CookieAdapter {
  getAll: () => { name: string; value: string }[];
  setAll: (cookies: CookieWrite[]) => void;
}

const auth = vi.hoisted(() => ({ getUser: vi.fn(), createServerClient: vi.fn() }));
vi.mock("@supabase/ssr", () => ({ createServerClient: auth.createServerClient }));
vi.mock("@/lib/env", () => ({
  SUPABASE_URL: "https://example.supabase.co",
  SUPABASE_ANON_KEY: "fixture-public-key",
}));

let adapter: CookieAdapter;
beforeEach(() => {
  vi.resetAllMocks();
  auth.getUser.mockResolvedValue({ data: { user: null } });
  auth.createServerClient.mockImplementation(
    (_url: string, _key: string, options: { cookies: CookieAdapter }) => {
      adapter = options.cookies;
      return { auth: { getUser: auth.getUser } };
    },
  );
});

describe("verified server-side route guards", () => {
  it.each(["/dashboard", "/solar", "/weather", "/notifications", "/settings/profile"])(
    "redirects an anonymous request to %s to same-origin login",
    async (path) => {
      const response = await updateSession(new NextRequest(`https://hmi.example.test${path}`));
      const target = new URL(response.headers.get("location")!);
      expect(target.origin).toBe("https://hmi.example.test");
      expect(target.pathname).toBe("/login");
      expect(target.searchParams.get("redirectTo")).toBe(path);
      expect(auth.getUser).toHaveBeenCalledOnce();
    },
  );

  it.each(["/login", "/register"])(
    "redirects a verified user from %s to the dashboard",
    async (path) => {
      auth.getUser.mockResolvedValue({ data: { user: { id: "fixture" } } });
      const response = await updateSession(
        new NextRequest(
          `https://hmi.example.test${path}?redirectTo=https://untrusted.example.test`,
        ),
      );
      expect(response.headers.get("location")).toBe("https://hmi.example.test/dashboard");
    },
  );

  it("allows public pages and forwards verified authenticated requests", async () => {
    const publicResponse = await updateSession(new NextRequest("https://hmi.example.test/privacy"));
    expect(publicResponse.headers.get("location")).toBeNull();
    auth.getUser.mockResolvedValue({ data: { user: { id: "fixture" } } });
    const request = new NextRequest("https://hmi.example.test/dashboard", {
      headers: { cookie: "fixture=old" },
    });
    const response = await updateSession(request);
    expect(response.headers.get("location")).toBeNull();
    expect(adapter.getAll()).toEqual([{ name: "fixture", value: "old" }]);
  });
});

describe("auth refresh cookies", () => {
  it.each([
    ["/login", { id: "fixture" }],
    ["/dashboard", null],
  ] as const)("preserves cookie changes and attributes when redirecting %s", async (path, user) => {
    auth.getUser.mockImplementation(async () => {
      adapter.setAll([
        {
          name: "fixture-session",
          value: user ? "refreshed" : "",
          options: {
            path: "/",
            secure: true,
            httpOnly: true,
            sameSite: "lax",
            maxAge: user ? 3600 : 0,
          },
        },
      ]);
      return { data: { user } };
    });
    const response = await updateSession(new NextRequest(`https://hmi.example.test${path}`));
    expect(response.cookies.get("fixture-session")).toMatchObject({
      value: user ? "refreshed" : "",
      path: "/",
      secure: true,
      httpOnly: true,
      sameSite: "lax",
      maxAge: user ? 3600 : 0,
    });
  });

  it("preserves multiple refresh batches on the outgoing response", async () => {
    auth.getUser.mockImplementation(async () => {
      adapter.setAll([{ name: "fixture-session.0", value: "first", options: { path: "/" } }]);
      adapter.setAll([{ name: "fixture-session.1", value: "second", options: { path: "/" } }]);
      return { data: { user: { id: "fixture" } } };
    });
    const request = new NextRequest("https://hmi.example.test/dashboard");
    const response = await updateSession(request);
    expect(request.cookies.getAll()).toHaveLength(2);
    expect(response.cookies.get("fixture-session.0")?.value).toBe("first");
    expect(response.cookies.get("fixture-session.1")?.value).toBe("second");
  });
});
