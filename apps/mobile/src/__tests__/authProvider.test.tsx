import { AuthError, type AuthChangeEvent, type Session } from "@supabase/supabase-js";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React, { useState } from "react";
import TestRenderer, { act } from "react-test-renderer";

import { AuthProvider, useAuth } from "../lib/auth";
import { supabase } from "../lib/supabase";

jest.mock("../lib/supabase", () => ({
  supabase: {
    auth: { getSession: jest.fn(), onAuthStateChange: jest.fn(), signOut: jest.fn() },
  },
}));

const auth = jest.mocked(supabase.auth);
const unsubscribe = jest.fn();
let listener: (event: AuthChangeEvent, session: Session | null) => void;
let resolveInitial: (value: Awaited<ReturnType<typeof auth.getSession>>) => void;
let rejectInitial: (error: Error) => void;
let current: ReturnType<typeof useAuth>;
let renderer: TestRenderer.ReactTestRenderer;
let client: QueryClient;
let draft: string;
let setDraft: (value: string) => void;

function session(id: string): Session {
  return {
    access_token: "fictional-access-token",
    refresh_token: "fictional-refresh-token",
    token_type: "bearer",
    expires_in: 3600,
    user: {
      id,
      app_metadata: {},
      user_metadata: {},
      aud: "authenticated",
      created_at: "2026-09-30",
    },
  };
}

async function mount() {
  function Probe() {
    current = useAuth();
    [draft, setDraft] = useState("empty");
    return null;
  }
  await act(async () => {
    renderer = TestRenderer.create(
      <QueryClientProvider client={client}>
        <AuthProvider>
          <Probe />
        </AuthProvider>
      </QueryClientProvider>,
    );
  });
}

beforeEach(() => {
  jest.resetAllMocks();
  client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { gcTime: 0 } },
  });
  auth.getSession.mockReturnValue(
    new Promise((resolve, reject) => {
      resolveInitial = resolve;
      rejectInitial = reject;
    }),
  );
  auth.onAuthStateChange.mockImplementation((callback) => {
    listener = (event, nextSession) => {
      void callback(event, nextSession);
    };
    return { data: { subscription: { id: "fixture", callback: listener, unsubscribe } } };
  });
  auth.signOut.mockResolvedValue({ error: null });
});
afterEach(() => {
  act(() => renderer?.unmount());
  client.clear();
});

describe("native authentication lifecycle", () => {
  it("loads a persisted session before ending the loading state", async () => {
    await mount();
    expect(current.isLoading).toBe(true);
    await act(async () => resolveInitial({ data: { session: session("demo-a") }, error: null }));
    expect(current.user?.id).toBe("demo-a");
    expect(current.isLoading).toBe(false);
  });

  it("ends loading signed out after a rejected session read", async () => {
    await mount();
    await act(async () => rejectInitial(new Error("secure storage unavailable")));
    expect(current.session).toBeNull();
    expect(current.isLoading).toBe(false);
  });

  it("ends loading signed out after an auth error", async () => {
    await mount();
    await act(async () =>
      resolveInitial({
        data: { session: null },
        error: new AuthError("Invalid session"),
      }),
    );
    expect(current.session).toBeNull();
    expect(current.isLoading).toBe(false);
  });

  it("does not resurrect a stale initial session after sign-out", async () => {
    await mount();
    act(() => listener("SIGNED_OUT", null));
    await act(async () => resolveInitial({ data: { session: session("demo-a") }, error: null }));
    expect(current.session).toBeNull();
  });

  it("keeps a newer sign-in when the initial session read later fails", async () => {
    await mount();
    act(() => listener("SIGNED_IN", session("demo-b")));
    await act(async () => rejectInitial(new Error("stale read")));
    expect(current.user?.id).toBe("demo-b");
  });
});

describe("native account isolation and cleanup", () => {
  it("removes local drafts when the account changes but retains them on token refresh", async () => {
    await mount();
    act(() => listener("SIGNED_IN", session("demo-a")));
    act(() => setDraft("private draft"));
    act(() => listener("TOKEN_REFRESHED", session("demo-a")));
    expect(draft).toBe("private draft");
    act(() => listener("SIGNED_IN", session("demo-b")));
    expect(draft).toBe("empty");
  });

  it("clears previous account queries and mutations on account changes and sign-out", async () => {
    await mount();
    act(() => listener("SIGNED_IN", session("demo-a")));
    client.setQueryData(["profile"], { name: "Fictional account A" });
    client.getMutationCache().build(client, { mutationKey: ["profile-update"] });
    act(() => listener("SIGNED_IN", session("demo-b")));
    expect(client.getQueryData(["profile"])).toBeUndefined();
    expect(client.getMutationCache().getAll()).toHaveLength(0);
    client.setQueryData(["notifications"], ["Fictional account B"]);
    act(() => listener("SIGNED_OUT", null));
    expect(client.getQueryCache().getAll()).toHaveLength(0);
  });

  it("preserves the current account's cache during token refresh", async () => {
    await mount();
    act(() => listener("SIGNED_IN", session("demo-a")));
    client.setQueryData(["profile"], { name: "Fictional account A" });
    act(() => listener("TOKEN_REFRESHED", session("demo-a")));
    expect(client.getQueryData(["profile"])).toEqual({ name: "Fictional account A" });
  });

  it("prevents an old account's pending request from repopulating the cache", async () => {
    await mount();
    act(() => listener("SIGNED_IN", session("demo-a")));
    let resolveProfile!: (value: string) => void;
    const request = client
      .fetchQuery({
        queryKey: ["profile"],
        queryFn: () =>
          new Promise<string>((resolve) => {
            resolveProfile = resolve;
          }),
      })
      .catch(() => undefined);
    act(() => listener("SIGNED_IN", session("demo-b")));
    resolveProfile("Fictional account A");
    await request;
    expect(client.getQueryData(["profile"])).toBeUndefined();
    expect(current.user?.id).toBe("demo-b");
  });

  it("unsubscribes and ignores late session results after unmount", async () => {
    await mount();
    act(() => renderer.unmount());
    client.setQueryData(["fixture"], "keep");
    await act(async () => resolveInitial({ data: { session: session("demo-a") }, error: null }));
    act(() => listener("SIGNED_IN", session("demo-b")));
    expect(unsubscribe).toHaveBeenCalledTimes(1);
    expect(client.getQueryData(["fixture"])).toBe("keep");
  });

  it("propagates sign-out errors to the caller", async () => {
    await mount();
    const error = new AuthError("Sign-out failed");
    auth.signOut.mockResolvedValue({ error });
    await expect(current.signOut()).rejects.toEqual(error);
    auth.signOut.mockResolvedValue({ error: null });
    await expect(current.signOut()).resolves.toBeUndefined();
  });
});
