import { getAccessToken, setAccessToken } from "../../features/auth/tokenStore";

const DEFAULT_API_BASE_URL = "http://localhost:3000/api";

export function getApiBaseUrl(): string {
  const configured = import.meta.env.VITE_API_BASE_URL?.trim();
  return configured && configured.length > 0
    ? configured.replace(/\/$/, "")
    : DEFAULT_API_BASE_URL;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/** Paths that should NOT trigger a token refresh on 401. */
const NO_REFRESH_PATHS = [
  "/auth/login",
  "/auth/register",
  "/auth/verify-email",
  "/auth/resend-otp",
  "/auth/refresh",
];

/** Shared refresh promise to prevent parallel stampedes. */
let _refreshPromise: Promise<string | null> | null = null;

/** Callback invoked when refresh fails — wired up by AuthContext. */
let _onAuthFailure: (() => void) | null = null;

export function setAuthFailureHandler(handler: () => void): void {
  _onAuthFailure = handler;
}

async function attemptRefresh(): Promise<string | null> {
  if (_refreshPromise) return _refreshPromise;

  _refreshPromise = (async () => {
    try {
      const base = getApiBaseUrl();
      const res = await fetch(`${base}/auth/refresh`, {
        method: "POST",
        credentials: "include",
        headers: { Accept: "application/json" },
      });
      if (!res.ok) return null;
      const data = (await res.json()) as { accessToken?: string };
      return data.accessToken ?? null;
    } catch {
      return null;
    } finally {
      _refreshPromise = null;
    }
  })();

  return _refreshPromise;
}

function buildHeaders(
  init?: RequestInit,
  extra?: Record<string, string>,
): HeadersInit {
  const token = getAccessToken();
  return {
    Accept: "application/json",
    ...(init?.body && !(init.body instanceof FormData)
      ? { "Content-Type": "application/json" }
      : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(init?.headers ?? {}),
    ...(extra ?? {}),
  };
}

export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const base = getApiBaseUrl();
  const url = `${base}${path.startsWith("/") ? path : `/${path}`}`;

  const shouldRefreshOn401 = !NO_REFRESH_PATHS.some((p) => path.startsWith(p));

  async function doFetch(): Promise<Response> {
    return fetch(url, {
      ...init,
      credentials: "include",
      headers: buildHeaders(init),
    });
  }

  let response: Response;
  try {
    response = await doFetch();
  } catch {
    throw new ApiError("Unable to reach the backend API. Is the server running?");
  }

  // Handle 401 with a single coordinated refresh attempt.
  if (response.status === 401 && shouldRefreshOn401) {
    const newToken = await attemptRefresh();
    if (newToken) {
      setAccessToken(newToken);
      try {
        response = await doFetch();
      } catch {
        throw new ApiError("Unable to reach the backend API. Is the server running?");
      }
    } else {
      setAccessToken(null);
      _onAuthFailure?.();
      throw new ApiError("Session expired. Please sign in again.", 401);
    }
  }

  let payload: unknown = null;
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    payload = await response.json();
  }

  if (!response.ok) {
    const message =
      typeof payload === "object" &&
      payload !== null &&
      "error" in payload &&
      typeof (payload as { error: unknown }).error === "string"
        ? (payload as { error: string }).error
        : `Request failed with status ${response.status}`;
    throw new ApiError(message, response.status);
  }

  return payload as T;
}

/**
 * For FormData (file upload) requests — attaches Bearer token + credentials.
 */
export async function requestForm<T>(
  path: string,
  form: FormData,
  method = "POST",
): Promise<T> {
  const base = getApiBaseUrl();
  const url = `${base}${path.startsWith("/") ? path : `/${path}`}`;
  const token = getAccessToken();

  async function doFetch(): Promise<Response> {
    return fetch(url, {
      method,
      body: form,
      credentials: "include",
      headers: {
        Accept: "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
  }

  let response: Response;
  try {
    response = await doFetch();
  } catch {
    throw new ApiError("Unable to reach the backend API. Is the server running?");
  }

  if (response.status === 401) {
    const newToken = await attemptRefresh();
    if (newToken) {
      setAccessToken(newToken);
      try {
        response = await doFetch();
      } catch {
        throw new ApiError("Unable to reach the backend API. Is the server running?");
      }
    } else {
      setAccessToken(null);
      _onAuthFailure?.();
      throw new ApiError("Session expired. Please sign in again.", 401);
    }
  }

  let payload: unknown = null;
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    payload = await response.json();
  }

  if (!response.ok) {
    const message =
      typeof payload === "object" &&
      payload !== null &&
      "error" in payload &&
      typeof (payload as { error: unknown }).error === "string"
        ? (payload as { error: string }).error
        : `Request failed with status ${response.status}`;
    throw new ApiError(message, response.status);
  }

  return payload as T;
}

export type HealthResponse = {
  success: boolean;
  status: string;
  service?: string;
  timestamp: string;
};

export type DbHealthResponse = {
  success: boolean;
  status: string;
  database: string;
  latencyMs: number;
  timestamp: string;
  error?: string;
};

export const apiClient = {
  getBaseUrl: getApiBaseUrl,
  getHealth: () => request<HealthResponse>("/health"),
  getDbHealth: () => request<DbHealthResponse>("/health/db"),
};
