/**
 * Account service — user profile + password management via Supabase Auth + the `profiles`
 * table (replaces the Node `/api/user/account` endpoints).
 */
import { supabase } from './supabaseClient';

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateProfileData {
  username: string;
  email: string;
}

export interface UpdatePasswordData {
  currentPassword: string;
  newPassword: string;
}

async function requireUserId(): Promise<string> {
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error('Authentication required. Please log in again.');
  return data.user.id;
}

/** Get the signed-in user's profile. */
export async function getUserProfile(): Promise<UserProfile> {
  const authId = await requireUserId();
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, email, created_at, updated_at')
    .eq('auth_id', authId)
    .single();
  if (error) throw new Error(error.message);
  return {
    id: data.id,
    username: data.username,
    email: data.email,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

/** Update username/email. Email changes also update the auth user. */
export async function updateUserProfile(
  profileData: UpdateProfileData
): Promise<UserProfile> {
  const authId = await requireUserId();

  const { data: current } = await supabase
    .from('profiles')
    .select('email')
    .eq('auth_id', authId)
    .single();

  if (current && profileData.email && profileData.email !== current.email) {
    const { error: authErr } = await supabase.auth.updateUser({
      email: profileData.email,
    });
    if (authErr) throw new Error(authErr.message);
  }

  const { data, error } = await supabase
    .from('profiles')
    .update({ username: profileData.username, email: profileData.email })
    .eq('auth_id', authId)
    .select('id, username, email, created_at, updated_at')
    .single();
  if (error) throw new Error(error.message);
  return {
    id: data.id,
    username: data.username,
    email: data.email,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

/** Change the signed-in user's password. */
export async function updateUserPassword(
  passwordData: UpdatePasswordData
): Promise<void> {
  const { error } = await supabase.auth.updateUser({
    password: passwordData.newPassword,
  });
  if (error) throw new Error(error.message);
}
