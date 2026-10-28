import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { FeatureShell } from "../../../components/layout/FeatureShell";
import { ApiError } from "../../../services/api/client";
import { ragApi } from "../api/ragApi";
import type { RagCitation, RagDocument, RagMessage, RagSessionSummary } from "../types";

const SUGGESTIONS = [
  "What is the company's remote work policy?",
  "How many remote days are allowed each week?",
  "Who must approve remote work?",
];

type ChatTurn = {
  id: string;
  role: "user" | "assistant";
  content: string;
  insufficientEvidence?: boolean;
  citations?: RagCitation[];
};

function renderAnswerWithCitations(
  answer: string,
  onCite: (id: number) => void,
): ReactNode[] {
  const parts = answer.split(/(\[\d+\])/g);
  return parts.map((part, index) => {
    const match = part.match(/^\[(\d+)\]$/);
    if (!match) {
      return <span key={`t-${index}`}>{part}</span>;
    }
    const citationId = Number(match[1]);
    return (
      <button
        key={`c-${index}-${citationId}`}
        type="button"
        onClick={() => onCite(citationId)}
        className="mx-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded bg-[var(--color-accent)]/20 px-1 text-xs font-semibold text-[var(--color-accent)] hover:bg-[var(--color-accent)]/30"
        aria-label={`Open citation ${citationId}`}
      >
        {citationId}
      </button>
    );
  });
}

function pageLabel(citation: RagCitation): string {
  if (!citation.pageAvailable || citation.pageNumber == null) {
    return "Page unavailable";
  }
  if (
    citation.pageEnd != null &&
    citation.pageEnd !== citation.pageNumber
  ) {
    return `Pages ${citation.pageNumber}–${citation.pageEnd}`;
  }
  return `Page ${citation.pageNumber}`;
}

export function PdfRagPage() {
  const [documents, setDocuments] = useState<RagDocument[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [docsError, setDocsError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const [question, setQuestion] = useState("");
  const [topK, setTopK] = useState(5);
  const [asking, setAsking] = useState(false);
  const [askError, setAskError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [activeCitationId, setActiveCitationId] = useState<number | null>(null);
  const [sessions, setSessions] = useState<RagSessionSummary[]>([]);

  const citationRefs = useRef<Record<number, HTMLElement | null>>({});
  const turnsContainerRef = useRef<HTMLDivElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const latestCitations = useMemo(() => {
    for (let i = turns.length - 1; i >= 0; i -= 1) {
      if (turns[i].role === "assistant" && turns[i].citations?.length) {
        return turns[i].citations ?? [];
      }
    }
    return [] as RagCitation[];
  }, [turns]);

  const loadDocuments = useCallback(async () => {
    setLoadingDocs(true);
    setDocsError(null);
    try {
      const response = await ragApi.listDocuments();
      setDocuments(response.documents);
    } catch (error) {
      setDocsError(
        error instanceof ApiError
          ? error.message
          : "Failed to load indexed documents.",
      );
    } finally {
      setLoadingDocs(false);
    }
  }, []);

  const loadSessions = useCallback(async () => {
    try {
      const response = await ragApi.listSessions(10);
      setSessions(response.sessions);
    } catch {
      // Non-fatal for the main panel.
    }
  }, []);

  useEffect(() => {
    void loadDocuments();
    void loadSessions();
  }, [loadDocuments, loadSessions]);

  useEffect(() => {
    const container = turnsContainerRef.current;
    if (!container) return;
    container.scrollTop = container.scrollHeight;
  }, [turns, asking]);

  const toggleDocument = (id: string) => {
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((value) => value !== id)
        : [...current, id],
    );
  };

  const focusCitation = (id: number) => {
    setActiveCitationId(id);
    citationRefs.current[id]?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
    });
  };

  const startNewSession = () => {
    setSessionId(null);
    setTurns([]);
    setAskError(null);
    setActiveCitationId(null);
  };

  const openSession = async (id: string) => {
    setAskError(null);
    try {
      const detail = await ragApi.getSession(id);
      setSessionId(detail.session.id);
      setTurns(
        detail.messages.map((message: RagMessage) => ({
          id: message.id,
          role: message.role,
          content: message.content,
          insufficientEvidence: message.insufficientEvidence,
          citations: message.citations,
        })),
      );
    } catch (error) {
      setAskError(
        error instanceof ApiError ? error.message : "Failed to open session.",
      );
    }
  };

  const ask = async (event?: FormEvent, preset?: string) => {
    event?.preventDefault();
    const text = (preset ?? question).trim();
    if (!text) {
      setAskError("Enter a question grounded in your indexed documents.");
      return;
    }

    setAsking(true);
    setAskError(null);
    const userTurn: ChatTurn = {
      id: `local-user-${Date.now()}`,
      role: "user",
      content: text,
    };
    setTurns((current) => [...current, userTurn]);
    setQuestion("");

    try {
      const response = await ragApi.ask({
        question: text,
        documentIds: selectedIds,
        sessionId,
        topK,
      });
      setSessionId(response.data.sessionId);
      setTurns((current) => [
        ...current,
        {
          id: `local-assistant-${Date.now()}`,
          role: "assistant",
          content: response.data.answer,
          insufficientEvidence: response.data.insufficientEvidence,
          citations: response.data.citations,
        },
      ]);
      await loadSessions();
    } catch (error) {
      setAskError(
        error instanceof ApiError ? error.message : "Question answering failed.",
      );
    } finally {
      setAsking(false);
    }
  };

  return (
    <FeatureShell
      title="PDF Question Answering"
      description="Ask questions against indexed documents. Answers are grounded in retrieved passages with validated citations — never invented sources."
      wide={true}
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.2fr)]">
        <aside className="space-y-4">
          <section className="rounded-2xl border border-[var(--color-border)] bg-white p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-display text-lg font-semibold">Documents</h2>
              <button
                type="button"
                onClick={() => void loadDocuments()}
                className="text-xs text-[var(--color-ink-400)] hover:text-[var(--color-accent)]"
              >
                Refresh
              </button>
            </div>
            <p className="mt-1 text-sm text-[var(--color-ink-400)]">
              {selectedIds.length === 0
                ? "Searching all completed indexed documents."
                : `Filtering to ${selectedIds.length} selected document(s).`}
            </p>
            <p className="mt-2 text-xs text-[var(--color-ink-500)]">
              Upload/index files in Semantic Document Search first.
            </p>

            {docsError ? (
              <p className="mt-3 text-sm text-[var(--color-danger)]">{docsError}</p>
            ) : null}

            <ul className="mt-4 max-h-72 space-y-2 overflow-y-auto">
              {loadingDocs ? (
                <li className="text-sm text-[var(--color-ink-400)]">Loading…</li>
              ) : documents.length === 0 ? (
                <li className="text-sm text-[var(--color-ink-400)]">
                  No completed documents yet.
                </li>
              ) : (
                documents.map((doc) => {
                  const active = selectedIds.includes(doc.id);
                  return (
                    <li key={doc.id}>
                      <button
                        type="button"
                        onClick={() => toggleDocument(doc.id)}
                        className={`w-full rounded-xl border px-3 py-2 text-left transition ${
                          active
                            ? "border-[var(--color-accent)]/50 bg-[var(--color-accent)]/10"
                            : "border-[var(--color-border)] bg-[var(--color-surface-800)]/70 hover:border-[var(--color-accent)]/40"
                        }`}
                      >
                        <p className="truncate text-sm font-medium">
                          {doc.originalFilename}
                        </p>
                        <p className="mt-1 text-xs text-[var(--color-ink-400)]">
                          #{doc.id} · {doc.chunkCount} chunks
                        </p>
                      </button>
                    </li>
                  );
                })
              )}
            </ul>
          </section>

          <section className="rounded-2xl border border-[var(--color-border)] bg-white p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-display text-lg font-semibold">Sessions</h2>
              <button
                type="button"
                onClick={startNewSession}
                className="text-xs font-medium text-[var(--color-accent)] hover:underline"
              >
                New session
              </button>
            </div>
            <ul className="mt-3 max-h-48 space-y-2 overflow-y-auto">
              {sessions.length === 0 ? (
                <li className="text-sm text-[var(--color-ink-400)]">
                  No saved sessions yet.
                </li>
              ) : (
                sessions.map((session) => (
                  <li key={session.id}>
                    <button
                      type="button"
                      onClick={() => void openSession(session.id)}
                      className={`w-full rounded-lg border px-3 py-2 text-left text-sm ${
                        sessionId === session.id
                          ? "border-[var(--color-accent)]/40 bg-[var(--color-accent)]/10"
                          : "border-[var(--color-border)] hover:border-[var(--color-accent)]/40"
                      }`}
                    >
                      <span className="line-clamp-2">{session.title}</span>
                    </button>
                  </li>
                ))
              )}
            </ul>
          </section>
        </aside>

        <section className="rounded-2xl border border-[var(--color-border)] bg-white p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-lg font-semibold">Q&amp;A</h2>
            <label className="flex items-center gap-2 text-sm text-[var(--color-ink-300)]">
              Top-K
              <select
                value={topK}
                onChange={(event) => setTopK(Number(event.target.value))}
                className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-800)] px-2 py-1.5 text-sm"
              >
                {[3, 5, 8, 10].map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {SUGGESTIONS.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                disabled={asking}
                onClick={() => void ask(undefined, suggestion)}
                className="rounded-lg border border-[var(--color-border)] px-2.5 py-1 text-xs text-[var(--color-ink-300)] hover:border-[var(--color-accent)]/40 disabled:opacity-50"
              >
                {suggestion}
              </button>
            ))}
          </div>

          <div
            ref={turnsContainerRef}
            className="mt-4 max-h-[28rem] space-y-3 overflow-y-auto rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-900)]/40 p-3"
          >
            {turns.length === 0 ? (
              <p className="text-sm text-[var(--color-ink-400)]">
                Ask a question to retrieve passages and generate a cited answer.
              </p>
            ) : (
              turns.map((turn) => (
                <div
                  key={turn.id}
                  className={`rounded-xl px-3 py-2 text-sm leading-relaxed ${
                    turn.role === "user"
                      ? "ml-8 bg-[var(--color-surface-700)]/80"
                      : "mr-4 border border-[var(--color-border)] bg-[var(--color-surface-800)]/80"
                  }`}
                >
                  <p className="mb-1 text-[10px] uppercase tracking-wide text-[var(--color-ink-500)]">
                    {turn.role}
                    {turn.insufficientEvidence ? " · insufficient evidence" : ""}
                  </p>
                  {turn.role === "assistant" ? (
                    <p className="text-[var(--color-ink-100)]">
                      {renderAnswerWithCitations(turn.content, focusCitation)}
                    </p>
                  ) : (
                    <p>{turn.content}</p>
                  )}
                </div>
              ))
            )}
            {asking ? (
              <p className="text-sm text-[var(--color-ink-400)]">
                Retrieving passages and generating an answer…
              </p>
            ) : null}
            <div ref={bottomRef} />
          </div>

          {askError ? (
            <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-[var(--color-danger)]/30 bg-[var(--color-danger)]/10 px-3 py-2">
              <p className="text-sm text-[var(--color-danger)]">{askError}</p>
              <button
                type="button"
                onClick={() => void ask()}
                className="text-xs underline"
              >
                Retry
              </button>
            </div>
          ) : null}

          <form className="mt-4 flex gap-2" onSubmit={(event) => void ask(event)}>
            <input
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="Ask a question about the selected documents…"
              className="min-w-0 flex-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-800)] px-3 py-2 text-sm outline-none ring-[var(--color-accent)] focus:ring-1"
            />
            <button
              type="submit"
              disabled={asking}
              className="rounded-xl bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              Ask
            </button>
          </form>

          <div className="mt-5">
            <h3 className="text-sm font-semibold text-[var(--color-ink-100)]">
              Sources
            </h3>
            {latestCitations.length === 0 ? (
              <p className="mt-2 text-sm text-[var(--color-ink-400)]">
                Validated citations from the latest answer appear here.
              </p>
            ) : (
              <ul className="mt-3 space-y-2">
                {latestCitations.map((citation) => (
                  <li
                    key={`${citation.chunkId}-${citation.id}`}
                    ref={(node) => {
                      citationRefs.current[citation.id] = node;
                    }}
                    className={`rounded-xl border px-3 py-2 ${
                      activeCitationId === citation.id
                        ? "border-[var(--color-accent)]/60 bg-[var(--color-accent)]/10"
                        : "border-[var(--color-border)] bg-[var(--color-surface-800)]/70"
                    }`}
                  >
                    <p className="text-xs font-semibold text-[var(--color-accent)]">
                      [{citation.id}] {citation.filename} · {pageLabel(citation)}
                    </p>
                    <p className="mt-1 text-sm text-[var(--color-ink-200)]">
                      {citation.excerpt}
                    </p>
                    <p className="mt-1 text-xs text-[var(--color-ink-500)]">
                      Doc #{citation.documentId} · Chunk #{citation.chunkId} ·
                      similarity {(citation.similarity * 100).toFixed(1)}%
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>
    </FeatureShell>
  );
}
