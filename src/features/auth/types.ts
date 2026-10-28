export type Gender =
  | "female"
  | "male"
  | "non_binary"
  | "prefer_not_to_say"
  | "other";

export type User = {
  id: string;
  name: string;
  gender: Gender | null;
  email: string;
  emailVerifiedAt: string | null;
};

export type RegisterPayload = {
  name: string;
  gender?: Gender;
  email: string;
  password: string;
};

export type RegisterResponse = {
  success: boolean;
  email: string;
  expiresAt: string;
  resendAvailableAt: string;
};

export type VerifyEmailPayload = {
  email: string;
  otp: string;
};

export type VerifyEmailResponse = {
  success: boolean;
  user: User;
  accessToken: string;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type LoginResponse = {
  success: boolean;
  user: User;
  accessToken: string;
};

export type ResendOtpPayload = {
  email: string;
};

export type RefreshResponse = {
  success: boolean;
  user: User;
  accessToken: string;
};

export type MeResponse = {
  success: boolean;
  user: User;
};

export type UpdateMePayload = {
  name: string;
};
