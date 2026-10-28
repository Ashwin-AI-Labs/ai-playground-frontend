import { request } from "../../../services/api/client";
import type {
  ResearchRunResult,
  ResearchSessionSummary,
  ResearchSource,
} from "../types";

export const researchApi = {
  run: (body: {
    question: string;
    maxResults?: number;
    recencyDays?: number | null;
    includeDomains?: string[];
  }) =>
    request<{ success: boolean; data: ResearchRunResult }>("/research/run", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  previewSearch: (body: { query: string; maxResults?: number }) =>
    request<{ success: boolean; results: ResearchSource[] }>(
      "/research/search",
      {
        method: "POST",
        body: JSON.stringify(body),
      },
    ),

  listSessions: (limit = 20, offset = 0) =>
    request<{
      success: boolean;
      sessions: ResearchSessionSummary[];
      total: number;
      limit: number;
      offset: number;
    }>(`/research/sessions?limit=${limit}&offset=${offset}`),

  getSession: (id: string) =>
    request<{ success: boolean; data: ResearchRunResult }>(
      `/research/sessions/${id}`,
    ),

  deleteSession: (id: string) =>
    request<{ success: boolean }>(`/research/sessions/${id}`, {
      method: "DELETE",
    }),
};
