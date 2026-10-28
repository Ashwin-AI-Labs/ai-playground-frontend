import { request } from "../../../services/api/client";
import type {
  RagAskData,
  RagDocument,
  RagMessage,
  RagSessionSummary,
} from "../types";

export const ragApi = {
  listDocuments: () =>
    request<{ success: boolean; documents: RagDocument[]; total: number }>(
      "/rag/documents",
    ),

  ask: (body: {
    question: string;
    documentIds?: string[];
    sessionId?: string | null;
    topK?: number;
  }) =>
    request<{ success: boolean; data: RagAskData }>("/rag/ask", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  listSessions: (limit = 20) =>
    request<{ success: boolean; sessions: RagSessionSummary[] }>(
      `/rag/sessions?limit=${limit}`,
    ),

  getSession: (id: string) =>
    request<{
      success: boolean;
      session: RagSessionSummary;
      messages: RagMessage[];
    }>(`/rag/sessions/${id}`),

  deleteSession: (id: string) =>
    request<{ success: boolean }>(`/rag/sessions/${id}`, {
      method: "DELETE",
    }),
};
