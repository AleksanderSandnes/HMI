// Account API — profile + password via Supabase Auth + the `profiles` table.
// Ported from mobile src/services/accountApiService.ts.
import type {
  AvatarUpload,
  UpdatePasswordData,
  UpdateProfileData,
  UserProfile,
} from "../types/account";

import type { CoreApiContext } from "./context";

const AVATAR_BUCKET = "avatars";
const PROFILE_COLS = "id, username, email, avatar_url, created_at, updated_at";

interface ProfileRow {
  id: string;
  username: string;
  email: string;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

function mapProfile(row: ProfileRow): UserProfile {
  return {
    id: row.id,
    username: row.username,
    email: row.email,
    avatarUrl: row.avatar_url,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function createAccountApi(ctx: CoreApiContext) {
  const { supabase } = ctx;

  async function requireUserId(): Promise<string> {
    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      throw new Error("Authentication required. Please log in again.");
    }
    return data.user.id;
  }

  /** Get the signed-in user's profile. */
  async function getUserProfile(): Promise<UserProfile> {
    const authId = await requireUserId();
    const { data, error } = await supabase
      .from("profiles")
      .select(PROFILE_COLS)
      .eq("auth_id", authId)
      .single<ProfileRow>();
    if (error) throw new Error(error.message);
    return mapProfile(data);
  }

  /** Update username/email. Email changes also update the auth user. */
  async function updateUserProfile(profileData: UpdateProfileData): Promise<UserProfile> {
    const authId = await requireUserId();

    const { data: current } = await supabase
      .from("profiles")
      .select("email")
      .eq("auth_id", authId)
      .single();

    if (current && profileData.email && profileData.email !== current.email) {
      const { error: authErr } = await supabase.auth.updateUser({
        email: profileData.email,
      });
      if (authErr) throw new Error(authErr.message);
    }

    const { data, error } = await supabase
      .from("profiles")
      .update({ username: profileData.username, email: profileData.email })
      .eq("auth_id", authId)
      .select(PROFILE_COLS)
      .single<ProfileRow>();
    if (error) throw new Error(error.message);
    return mapProfile(data);
  }

  /** Persist a new avatar_url on the profile and return the updated row. */
  async function setAvatarUrl(authId: string, avatarUrl: string | null): Promise<UserProfile> {
    const { data, error } = await supabase
      .from("profiles")
      .update({ avatar_url: avatarUrl })
      .eq("auth_id", authId)
      .select(PROFILE_COLS)
      .single<ProfileRow>();
    if (error) throw new Error(error.message);
    return mapProfile(data);
  }

  /**
   * Upload a picked image to the public `avatars` bucket at
   * `<auth.uid()>/avatar.<ext>` (upserting over any previous one) and persist
   * its public URL to the profile. A cache-busting query param is appended so
   * clients refetch the new image even though the storage path is stable.
   */
  async function uploadAvatar(file: AvatarUpload): Promise<UserProfile> {
    const authId = await requireUserId();
    const path = `${authId}/avatar.${file.extension}`;

    const { error: uploadErr } = await supabase.storage
      .from(AVATAR_BUCKET)
      .upload(path, file.data, { contentType: file.contentType, upsert: true });
    if (uploadErr) throw new Error(uploadErr.message);

    const { data: pub } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path);
    const publicUrl = `${pub.publicUrl}?v=${Date.now()}`;
    return setAvatarUrl(authId, publicUrl);
  }

  /** Remove the avatar: delete the stored object(s) and clear avatar_url. */
  async function removeAvatar(): Promise<UserProfile> {
    const authId = await requireUserId();
    const paths = ["png", "jpg", "jpeg", "webp"].map((ext) => `${authId}/avatar.${ext}`);
    // Best-effort object removal; the column clear below is what the UI reads.
    await supabase.storage.from(AVATAR_BUCKET).remove(paths);
    return setAvatarUrl(authId, null);
  }

  /** Change the signed-in user's password. */
  async function updateUserPassword(passwordData: UpdatePasswordData): Promise<void> {
    const { error } = await supabase.auth.updateUser({
      password: passwordData.newPassword,
    });
    if (error) throw new Error(error.message);
  }

  return { getUserProfile, updateUserProfile, uploadAvatar, removeAvatar, updateUserPassword };
}

export type AccountApi = ReturnType<typeof createAccountApi>;
