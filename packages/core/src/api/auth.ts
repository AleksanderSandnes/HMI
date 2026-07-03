// Authentication API (Supabase Auth). Ported from mobile src/services/api/api.js.
import type { Session, User } from "@supabase/supabase-js";

import type { AuthUser } from "../types/account";

import type { CoreApiContext } from "./context";
import { CoreError } from "./errors";

/** Build the UI auth payload from a Supabase session + user. */
function toUser(session: Session | null, user: User): AuthUser {
  return {
    id: user.id,
    email: user.email ?? null,
    username:
      (user.user_metadata?.username as string | undefined) ||
      (user.email ? user.email.split("@")[0] : ""),
    token: session?.access_token ?? null,
  };
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  email: string;
  password: string;
}

export function createAuthApi(ctx: CoreApiContext) {
  const { supabase } = ctx;

  async function loginUser({ email, password }: LoginInput): Promise<AuthUser> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) throw error;
    return toUser(data.session, data.user);
  }

  // Registration doesn't collect a username — the auth payload falls back to
  // the email local-part (toUser) and users can set one later in Settings.
  async function registerUser({ email, password }: RegisterInput): Promise<AuthUser> {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
    });
    if (error) throw error;

    if (!data.user) throw new CoreError("error.registrationNoUser");
    // Email confirmation is disabled, so signUp returns a session immediately.
    return toUser(data.session, data.user);
  }

  async function logout(): Promise<void> {
    await supabase.auth.signOut();
  }

  return { loginUser, registerUser, logout };
}

export type AuthApi = ReturnType<typeof createAuthApi>;
