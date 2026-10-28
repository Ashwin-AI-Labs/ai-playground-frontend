export { ChatAssistantPage } from "./pages/ChatAssistantPage";
export { chatApi } from "./api/chatApi";
export type {
  ChatConversation,
  ChatMessage,
  ChatResponse,
} from "./types";

export const chatAssistantFeature = {
  id: "chat-assistant",
  title: "AI Chat Assistant",
  description:
    "Conversational interface powered by large language model APIs for guided Q&A.",
  tech: "OpenAI Responses API",
  path: "/features/chat-assistant",
} as const;
