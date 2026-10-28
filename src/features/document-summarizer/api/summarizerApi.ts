import { request, requestForm } from "../../../services/api/client";
import type {
  SummarizeResult,
  SummaryLength,
  SummaryListItem,
  SummaryStyle,
} from "../types";

export const summarizerApi = {
  summarize: async (input: {
    file: File;
    length: SummaryLength;
    style: SummaryStyle;
    strategy: "auto" | "direct" | "map_reduce" | "refine";
  }) => {
    const form = new FormData();
    form.append("file", input.file);
    form.append("length", input.length);
    form.append("style", input.style);
    form.append("strategy", input.strategy);

    const result = await requestForm<{
      success: boolean;
      data: SummarizeResult;
    }>("/document-summarizer/summarize", form);

    if (!result.data) {
      throw new Error("Summarizer returned an empty response");
    }

    return { success: true as const, data: result.data };
  },

  list: (limit = 20, offset = 0) =>
    request<{
      success: boolean;
      summaries: SummaryListItem[];
      total: number;
      limit: number;
      offset: number;
    }>(`/document-summarizer/summaries?limit=${limit}&offset=${offset}`),

  get: (id: string) =>
    request<{ success: boolean; data: SummarizeResult }>(
      `/document-summarizer/summaries/${id}`,
    ),

  delete: (id: string) =>
    request<{ success: boolean }>(`/document-summarizer/summaries/${id}`, {
      method: "DELETE",
    }),

  exportUrl: (id: string) =>
    `${import.meta.env.VITE_API_BASE_URL?.trim().replace(/\/$/, "") ?? "http://localhost:3000/api"}/document-summarizer/summaries/${id}/export`,
};
