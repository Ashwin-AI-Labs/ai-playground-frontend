import { getApiBaseUrl, request } from "../../../services/api/client";
import type {
  LoginPayload,
  LoginResponse,
  MeResponse,
  RefreshResponse,
  RegisterPayload,
  RegisterResponse,
  ResendOtpPayload,
  UpdateMePayload,
  User,
  VerifyEmailPayload,
  VerifyEmailResponse,
} from "../types";

export const authApi = {
  register: (payload: RegisterPayload) =>
    request<RegisterResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  verifyEmail: (payload: VerifyEmailPayload) =>
    request<VerifyEmailResponse>("/auth/verify-email", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  resendOtp: (payload: ResendOtpPayload) =>
    request<{ success: boolean }>("/auth/resend-otp", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  login: (payload: LoginPayload) =>
    request<LoginResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  /** Uses credentials:'include' (cookie). Handled specially in client.ts */
  refresh: async (): Promise<RefreshResponse> => {
    const base = getApiBaseUrl();
    const res = await fetch(`${base}/auth/refresh`, {
      method: "POST",
      credentials: "include",
      headers: { Accept: "application/json" },
    });
    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as {
        error?: string;
      } | null;
      throw new Error(data?.error ?? "Refresh failed");
    }
    return res.json() as Promise<RefreshResponse>;
  },

  /** Invalidates the HttpOnly cookie. */
  logout: async (): Promise<void> => {
    const base = getApiBaseUrl();
    await fetch(`${base}/auth/logout`, {
      method: "POST",
      credentials: "include",
      headers: { Accept: "application/json" },
    }).catch(() => undefined);
  },

  me: () => request<MeResponse>("/auth/me"),

  updateMe: (payload: UpdateMePayload) =>
    request<{ success: boolean; user: User }>("/auth/me", {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
};
