"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { createClient } from "./supabase/client";

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { staleTime: 60 * 1000, refetchOnWindowFocus: false, retry: 1 },
    },
  });
}

/** Reset both server-state caches and mounted consumers when the account changes. */
export function AccountQueryProvider({
  initialUserId,
  children,
}: {
  initialUserId: string | null;
  children: ReactNode;
}) {
  const router = useRouter();
  const [cache, setCache] = useState(() => ({
    userId: initialUserId,
    client: createQueryClient(),
  }));
  const activeCache = useRef(cache);

  useEffect(() => {
    let mounted = true;
    const { data } = createClient().auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      const userId = session?.user.id ?? null;
      if (activeCache.current.userId === userId) return;
      activeCache.current.client.clear();
      const nextCache = { userId, client: createQueryClient() };
      activeCache.current = nextCache;
      setCache(nextCache);
      router.refresh();
    });
    return () => {
      mounted = false;
      data.subscription.unsubscribe();
      activeCache.current.client.clear();
    };
  }, [router]);

  return (
    <QueryClientProvider key={cache.userId ?? "signed-out"} client={cache.client}>
      {children}
    </QueryClientProvider>
  );
}
