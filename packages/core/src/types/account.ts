// Account / profile shapes (ported from mobile accountApiService.ts).

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

/** Auth payload exposed to the UI after sign-in/sign-up. */
export interface AuthUser {
  id: string;
  email: string | null;
  username: string;
  token: string | null;
}
