/** Database BIGINT identity values are serialized as decimal strings. */
export type ChatMessage = {
  id: string;
  conversationId: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: string;
};

export type ChatConversation = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
};

export type ChatResponse = {
  success: boolean;
  conversationId: string;
  conversation: ChatConversation;
  userMessage: ChatMessage;
  assistantMessage: ChatMessage;
};

export type ConversationsResponse = {
  success: boolean;
  conversations: ChatConversation[];
};

export type ConversationDetailResponse = {
  success: boolean;
  conversation: ChatConversation;
  messages: ChatMessage[];
};
