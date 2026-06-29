// Authentication API (Supabase Auth). Ported from mobile src/services/api/api.js.
import type { Session, User } from '@supabase/supabase-js';
import type { AuthUser } from '../types/account';
import type { CoreApiContext } from './context';

/** Build the UI auth payload from a Supabase session + user. */
function toUser(session: Session | null, user: User): AuthUser {
  return {
    id: user.id,
    email: user.email ?? null,
    username:
      (user.user_metadata?.username as string | undefined) ||
      (user.email ? user.email.split('@')[0] : ''),
    token: session?.access_token ?? null,
  };
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  email: string;
  username?: string;
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

  async function registerUser({
    email,
    username,
    password,
  }: RegisterInput): Promise<AuthUser> {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { username: username?.trim() } },
    });
    if (error) throw error;

    // With email confirmation disabled, signUp returns a session immediately.
    // If it doesn't (confirmation enabled), try an immediate sign-in.
    let session = data.session;
    if (!session) {
      const signIn = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (signIn.error) {
        throw new Error(
          'Account created. Please confirm your email, then sign in.'
        );
      }
      session = signIn.data.session;
    }
    if (!data.user) throw new Error('Registration failed: no user returned.');
    return toUser(session, data.user);
  }

  async function logout(): Promise<void> {
    await supabase.auth.signOut();
  }

  return { loginUser, registerUser, logout };
}

export type AuthApi = ReturnType<typeof createAuthApi>;
