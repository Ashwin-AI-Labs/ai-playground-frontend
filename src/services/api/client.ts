const DEFAULT_API_BASE_URL = "http://localhost:3000/api";

function getApiBaseUrl(): string {
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

export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${getApiBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`;

  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      headers: {
        Accept: "application/json",
        ...(init?.body ? { "Content-Type": "application/json" } : {}),
        ...(init?.headers ?? {}),
      },
    });
  } catch {
    throw new ApiError(
      "Unable to reach the backend API. Is the server running?",
    );
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
