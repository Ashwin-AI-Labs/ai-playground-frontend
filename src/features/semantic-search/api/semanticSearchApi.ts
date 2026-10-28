import { request, requestForm } from "../../../services/api/client";
import type {
  DocumentResponse,
  DocumentsListResponse,
  SearchDocument,
  SearchResponse,
} from "../types";

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
    return requestForm<DocumentResponse>("/semantic-search/documents", form);
  },
};

export type { SearchDocument };
