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
    // A session may be absent while the user completes email confirmation.
    return toUser(data.session, data.user);
  }

  async function confirmRegistration(email: string, token: string): Promise<AuthUser> {
    if (!token.trim()) throw new CoreError("auth.register.codeRequired");
    const { data, error } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: token.trim(),
      type: "email",
    });
    if (error) throw error;
    if (!data.user || !data.session) throw new CoreError("auth.register.confirmFailed");
    return toUser(data.session, data.user);
  }

  async function resendConfirmation(email: string): Promise<void> {
    const { error } = await supabase.auth.resend({ type: "signup", email: email.trim() });
    if (error) throw error;
  }

  async function logout(): Promise<void> {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  return { loginUser, registerUser, confirmRegistration, resendConfirmation, logout };
}

export type AuthApi = ReturnType<typeof createAuthApi>;
