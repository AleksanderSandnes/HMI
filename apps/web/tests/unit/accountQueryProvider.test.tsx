import type { Session } from "@supabase/supabase-js";
import { QueryClient, useQuery, useQueryClient } from "@tanstack/react-query";
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import { useEffect, useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AccountQueryProvider } from "@/lib/account-query-provider";

const fixture = vi.hoisted(() => ({
  subscribe: vi.fn(),
  unsubscribe: vi.fn(),
  fetch: vi.fn(),
  router: { refresh: vi.fn() },
}));
vi.mock("next/navigation", () => ({ useRouter: () => fixture.router }));
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({ auth: { onAuthStateChange: fixture.subscribe } }),
}));

let listener: (event: string, session: Session | null) => void;
let client: QueryClient;
function session(id: string) {
  return { user: { id } } as Session;
}
function Probe() {
  const queryClient = useQueryClient();
  useEffect(() => {
    client = queryClient;
  }, [queryClient]);
  const { data } = useQuery({ queryKey: ["profile"], queryFn: fixture.fetch });
  const [draft, setDraft] = useState("empty");
  return (
    <>
      <span>{data ?? "loading"}</span>
      <button onClick={() => setDraft("private draft")}>{draft}</button>
    </>
  );
}
function mount(userId: string | null = "demo-a") {
  return render(
    <AccountQueryProvider initialUserId={userId}>
      <Probe />
    </AccountQueryProvider>,
  );
}

beforeEach(() => {
  vi.resetAllMocks();
  fixture.fetch.mockResolvedValue("Fictional account A");
  fixture.subscribe.mockImplementation((callback: typeof listener) => {
    listener = callback;
    return { data: { subscription: { unsubscribe: fixture.unsubscribe } } };
  });
});
afterEach(cleanup);

describe("web account query isolation", () => {
  it("retains the current cache and component state for initial session and token refresh", async () => {
    mount();
    await screen.findByText("Fictional account A");
    act(() => screen.getByRole("button").click());
    const original = client;
    act(() => listener("INITIAL_SESSION", session("demo-a")));
    act(() => listener("TOKEN_REFRESHED", session("demo-a")));
    expect(client).toBe(original);
    expect(screen.getByRole("button")).toHaveTextContent("private draft");
    expect(fixture.fetch).toHaveBeenCalledOnce();
    expect(fixture.router.refresh).not.toHaveBeenCalled();
  });

  it("removes previous account data, mutation state and local drafts on account change", async () => {
    mount();
    await screen.findByText("Fictional account A");
    act(() => screen.getByRole("button").click());
    const original = client;
    original.getMutationCache().build(original, { gcTime: 0, mutationKey: ["private-update"] });
    fixture.fetch.mockResolvedValue("Fictional account B");
    act(() => listener("SIGNED_IN", session("demo-b")));
    expect(screen.queryByText("Fictional account A")).toBeNull();
    await screen.findByText("Fictional account B");
    expect(client).not.toBe(original);
    expect(original.getQueryCache().getAll()).toHaveLength(0);
    expect(original.getMutationCache().getAll()).toHaveLength(0);
    expect(screen.getByRole("button")).toHaveTextContent("empty");
    expect(fixture.router.refresh).toHaveBeenCalledOnce();
  });

  it("removes account data on sign-out", async () => {
    mount();
    await screen.findByText("Fictional account A");
    const original = client;
    fixture.fetch.mockResolvedValue("signed out");
    act(() => listener("SIGNED_OUT", null));
    await screen.findByText("signed out");
    expect(original.getQueryCache().getAll()).toHaveLength(0);
    expect(screen.queryByText("Fictional account A")).toBeNull();
  });

  it("cancels an old account's pending query before mounting the new account", async () => {
    let resolve!: (value: string) => void;
    fixture.fetch.mockReturnValueOnce(
      new Promise<string>((done) => {
        resolve = done;
      }),
    );
    mount();
    await waitFor(() => expect(fixture.fetch).toHaveBeenCalledOnce());
    fixture.fetch.mockResolvedValue("Fictional account B");
    act(() => listener("SIGNED_IN", session("demo-b")));
    await screen.findByText("Fictional account B");
    await act(async () => resolve("Fictional account A"));
    expect(screen.queryByText("Fictional account A")).toBeNull();
    expect(client.getQueryData(["profile"])).toBe("Fictional account B");
  });

  it("does not retain signed-out cache when a user signs in", async () => {
    fixture.fetch.mockResolvedValue("signed out");
    mount(null);
    await screen.findByText("signed out");
    fixture.fetch.mockResolvedValue("Fictional account A");
    act(() => listener("SIGNED_IN", session("demo-a")));
    await screen.findByText("Fictional account A");
    expect(screen.queryByText("signed out")).toBeNull();
  });

  it("unsubscribes, clears caches and ignores events after unmount", async () => {
    const view = mount();
    await screen.findByText("Fictional account A");
    const original = client;
    view.unmount();
    expect(fixture.unsubscribe).toHaveBeenCalledOnce();
    expect(original.getQueryCache().getAll()).toHaveLength(0);
    act(() => listener("SIGNED_IN", session("demo-b")));
    expect(client).toBe(original);
  });
});
