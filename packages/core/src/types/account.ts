// Account / profile shapes (ported from mobile accountApiService.ts).

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  /** Public URL of the profile picture in Supabase Storage, or null if unset. */
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * A picked image ready to upload, produced by each platform: web passes a
 * `File`/`Blob` from an <input type="file">, mobile converts an
 * expo-image-picker URI to a `Blob`/`ArrayBuffer`.
 */
export interface AvatarUpload {
  data: Blob | ArrayBuffer | Uint8Array | File;
  /** MIME type, e.g. "image/jpeg". */
  contentType: string;
  /** File extension without the dot, e.g. "jpg". */
  extension: string;
}

export interface UpdateProfileData {
  username: string;
  email: string;
}

export interface UpdatePasswordData {
  currentPassword: string;
  newPassword: string;
}

/** Auth payload exposed to the UI after sign-in/sign-up. */
export interface AuthUser {
  id: string;
  email: string | null;
  username: string;
  token: string | null;
}
