/**
 * Supabase-backed auth context. Replaces the old Redux authSlice — the session
 * is persisted/auto-refreshed by supabase-js (SecureStore), and this provider
 * just mirrors the current session into React state and exposes signOut.
 *
 * Web reads the session from Supabase SSR cookies (no provider); on native we
 * keep this thin context so screens and the auth gate can react to sign-in/out.
 */
import type { Session, User } from "@supabase/supabase-js";
import { useQueryClient } from "@tanstack/react-query";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { supabase } from "./supabase";

interface AuthState {
  session: Session | null;
  user: User | null;
  /** True until the initial getSession() resolves. */
  isLoading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    let receivedAuthEvent = false;
    let currentUserId: string | null = null;

    const applySession = (nextSession: Session | null) => {
      if (!mounted) return;
      const nextUserId = nextSession?.user.id ?? null;
      if (currentUserId !== nextUserId || nextSession === null) {
        queryClient.clear();
      }
      currentUserId = nextUserId;
      setSession(nextSession);
      setIsLoading(false);
    };

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      receivedAuthEvent = true;
      applySession(nextSession);
    });

    void supabase.auth.getSession().then(
      ({ data: initialData, error }) => {
        if (!receivedAuthEvent) applySession(error ? null : initialData.session);
        return undefined;
      },
      () => {
        if (!receivedAuthEvent) applySession(null);
      },
    );

    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, [queryClient]);

  const value = useMemo<AuthState>(
    () => ({
      session,
      user: session?.user ?? null,
      isLoading,
      signOut: async () => {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
      },
    }),
    [session, isLoading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
