import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { ApiError } from "../../../services/api/client";
import { chatApi } from "../api/chatApi";
import type { ChatConversation, ChatMessage } from "../types";

export function ChatAssistantPage() {
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(
    null,
  );
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const loadConversations = useCallback(async () => {
    setLoadingConversations(true);
    setError(null);
    try {
      const response = await chatApi.listConversations();
      setConversations(response.conversations);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Failed to load conversation history.",
      );
    } finally {
      setLoadingConversations(false);
    }
  }, []);

  const loadConversation = useCallback(async (conversationId: string) => {
    setLoadingMessages(true);
    setError(null);
    setActiveConversationId(conversationId);
    try {
      const response = await chatApi.getConversation(conversationId);
      setMessages(response.messages);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Failed to load this conversation.",
      );
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  useEffect(() => {
    void loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, sending, scrollToBottom]);

  function startNewChat() {
    setActiveConversationId(null);
    setMessages([]);
    setDraft("");
    setError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const message = draft.trim();
    if (!message || sending) {
      return;
    }

    setSending(true);
    setError(null);
    setDraft("");

    const optimisticId = `local-${Date.now()}`;
    setMessages((current) => [
      ...current,
      {
        id: optimisticId,
        conversationId: activeConversationId ?? "pending",
        role: "user",
        content: message,
        createdAt: new Date().toISOString(),
      },
    ]);

    try {
      const response = await chatApi.sendChatMessage(
        message,
        activeConversationId ?? undefined,
      );

      setActiveConversationId(response.conversationId);
      setMessages((current) => {
        const withoutOptimistic = current.filter((item) => item.id !== optimisticId);
        return [
          ...withoutOptimistic,
          response.userMessage,
          response.assistantMessage,
        ];
      });
      await loadConversations();
    } catch (err) {
      setMessages((current) => current.filter((item) => item.id !== optimisticId));
      setDraft(message);
      setError(
        err instanceof ApiError
          ? err.message
          : "Failed to send message. Please try again.",
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link
            to="/"
            className="text-sm text-[var(--color-ink-400)] transition hover:text-[var(--color-accent)]"
          >
            ← Back to dashboard
          </Link>
          <h1 className="font-display mt-2 text-3xl font-bold tracking-tight">
            AI Chat Assistant
          </h1>
          <p className="mt-1 text-sm text-[var(--color-ink-400)]">
            GPT-powered chat with conversation history. API keys stay on the backend.
          </p>
        </div>
        <button
          type="button"
          onClick={startNewChat}
          className="rounded-lg border border-white/15 bg-[var(--color-surface-800)] px-4 py-2 text-sm font-medium transition hover:border-[var(--color-accent)]/50 hover:bg-[var(--color-surface-700)]"
        >
          New Chat
        </button>
      </div>

      <div className="grid min-h-[70vh] flex-1 gap-4 lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="rounded-2xl border border-white/10 bg-[var(--color-surface-850)]/80 p-3">
          <p className="px-2 text-xs font-medium uppercase tracking-[0.14em] text-[var(--color-ink-400)]">
            History
          </p>
          <div className="mt-3 space-y-1">
            {loadingConversations ? (
              <p className="px-2 py-3 text-sm text-[var(--color-ink-400)]">
                Loading conversations…
              </p>
            ) : conversations.length === 0 ? (
              <p className="px-2 py-3 text-sm text-[var(--color-ink-400)]">
                No conversations yet.
              </p>
            ) : (
              conversations.map((conversation) => {
                const active = conversation.id === activeConversationId;
                return (
                  <button
                    key={conversation.id}
                    type="button"
                    onClick={() => {
                      void loadConversation(conversation.id);
                    }}
                    className={`w-full rounded-lg px-3 py-2 text-left text-sm transition ${
                      active
                        ? "bg-[var(--color-accent-soft)]/40 text-[var(--color-ink-100)]"
                        : "text-[var(--color-ink-300)] hover:bg-[var(--color-surface-800)]"
                    }`}
                  >
                    <span className="line-clamp-2">{conversation.title}</span>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        <section className="flex min-h-[60vh] flex-col rounded-2xl border border-white/10 bg-[var(--color-surface-850)]/80">
          <div className="flex-1 space-y-4 overflow-y-auto px-4 py-5 sm:px-6">
            {loadingMessages ? (
              <p className="text-sm text-[var(--color-ink-400)]">Loading messages…</p>
            ) : messages.length === 0 && !sending ? (
              <div className="flex h-full min-h-[240px] flex-col items-center justify-center text-center">
                <p className="font-display text-xl font-semibold">Start a conversation</p>
                <p className="mt-2 max-w-md text-sm text-[var(--color-ink-400)]">
                  Ask a question to create a new chat. Previous threads appear in the
                  history panel.
                </p>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      message.role === "user"
                        ? "bg-[var(--color-accent-soft)] text-[var(--color-ink-100)]"
                        : "border border-white/10 bg-[var(--color-surface-800)] text-[var(--color-ink-100)]"
                    }`}
                  >
                    <p className="mb-1 text-[10px] font-medium uppercase tracking-[0.12em] text-[var(--color-ink-400)]">
                      {message.role === "user" ? "You" : "Assistant"}
                    </p>
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  </div>
                </div>
              ))
            )}

            {sending ? (
              <div className="flex justify-start">
                <div className="rounded-2xl border border-white/10 bg-[var(--color-surface-800)] px-4 py-3 text-sm text-[var(--color-ink-400)]">
                  Assistant is thinking…
                </div>
              </div>
            ) : null}

            <div ref={bottomRef} />
          </div>

          {error ? (
            <div className="mx-4 mb-3 rounded-xl border border-[var(--color-danger)]/40 bg-[var(--color-danger)]/10 px-4 py-3 text-sm text-[var(--color-ink-100)] sm:mx-6">
              <p>{error}</p>
              <button
                type="button"
                className="mt-2 text-sm font-medium text-[var(--color-accent)] underline-offset-2 hover:underline"
                onClick={() => {
                  setError(null);
                  void loadConversations();
                  if (activeConversationId) {
                    void loadConversation(activeConversationId);
                  }
                }}
              >
                Retry
              </button>
            </div>
          ) : null}

          <form
            onSubmit={handleSubmit}
            className="border-t border-white/10 p-4 sm:p-5"
          >
            <div className="flex flex-col gap-3 sm:flex-row">
              <label className="sr-only" htmlFor="chat-message">
                Message
              </label>
              <textarea
                id="chat-message"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                rows={2}
                placeholder="Type a message…"
                disabled={sending}
                className="min-h-[52px] flex-1 resize-y rounded-xl border border-white/10 bg-[var(--color-surface-900)] px-3 py-2 text-sm text-[var(--color-ink-100)] outline-none ring-[var(--color-accent)] placeholder:text-[var(--color-ink-400)] focus:ring-1 disabled:opacity-60"
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    event.currentTarget.form?.requestSubmit();
                  }
                }}
              />
              <button
                type="submit"
                disabled={sending || !draft.trim()}
                className="rounded-xl bg-[var(--color-accent)] px-5 py-2.5 text-sm font-semibold text-[var(--color-surface-950)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {sending ? "Sending…" : "Send"}
              </button>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}
