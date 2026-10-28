import { ApiError, request } from "../../../services/api/client";
import type {
  DocumentResponse,
  DocumentsListResponse,
  SearchDocument,
  SearchResponse,
} from "../types";

const DEFAULT_API_BASE_URL = "http://localhost:3000/api";

function getApiBaseUrl(): string {
  const configured = import.meta.env.VITE_API_BASE_URL?.trim();
  return configured && configured.length > 0
    ? configured.replace(/\/$/, "")
    : DEFAULT_API_BASE_URL;
}

export const semanticSearchApi = {
  listDocuments: (params?: { limit?: number; offset?: number }) => {
    const query = new URLSearchParams();
    if (params?.limit) query.set("limit", String(params.limit));
    if (params?.offset) query.set("offset", String(params.offset));
    const suffix = query.toString() ? `?${query.toString()}` : "";
    return request<DocumentsListResponse>(`/semantic-search/documents${suffix}`);
  },

  getDocument: (id: string) =>
    request<DocumentResponse>(`/semantic-search/documents/${id}`),

  deleteDocument: (id: string) =>
    request<{ success: boolean }>(`/semantic-search/documents/${id}`, {
      method: "DELETE",
    }),

  search: (body: {
    query: string;
    limit?: number;
    documentIds?: string[];
  }) =>
    request<SearchResponse>("/semantic-search/query", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  uploadDocument: async (file: File): Promise<DocumentResponse> => {
    const form = new FormData();
    form.append("file", file);

    const url = `${getApiBaseUrl()}/semantic-search/documents`;
    let response: Response;
    try {
      response = await fetch(url, {
        method: "POST",
        body: form,
        headers: {
          Accept: "application/json",
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
          : `Upload failed with status ${response.status}`;
      throw new ApiError(message, response.status);
    }

    return payload as DocumentResponse;
  },
};

export type { SearchDocument };
