import { request } from "../../../services/api/client";
import type {
  ChatResponse,
  ConversationDetailResponse,
  ConversationsResponse,
} from "../types";

export const chatApi = {
  listConversations: () =>
    request<ConversationsResponse>("/chat/conversations"),
  getConversation: (id: string) =>
    request<ConversationDetailResponse>(`/chat/conversations/${id}`),
  sendChatMessage: (message: string, conversationId?: string) =>
    request<ChatResponse>("/chat", {
      method: "POST",
      body: JSON.stringify({
        message,
        ...(conversationId ? { conversationId } : {}),
      }),
    }),
};
