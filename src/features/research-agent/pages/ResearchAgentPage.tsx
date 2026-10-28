import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { Link } from "react-router-dom";
import { ApiError } from "../../../services/api/client";
import { researchApi } from "../api/researchApi";
import { collectValidSourceIds, renderCitedText } from "../lib/citations";
import type {
  ResearchRunResult,
  ResearchSessionSummary,
  ResearchSource,
} from "../types";

const SUGGESTIONS = [
  "Compare React and Angular for a new enterprise application.",
  "Research the current adoption of RAG in enterprise AI applications.",
  "Compare PostgreSQL and MongoDB for a document-management system.",
  "Research the latest developments in AI agents and tool calling.",
  "Find official documentation about the OpenAI Responses API.",
  "Investigate the advantages and limitations of vector databases.",
];

function formatWhen(iso: string): string {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function fetchStatusLabel(status: ResearchSource["fetchStatus"]): string {
  if (status === "fetched") return "Page retrieved";
  if (status === "snippet_only") return "Snippet only";
  if (status === "blocked") return "Fetch blocked";
  return "Fetch failed";
}

export function ResearchAgentPage() {
  const [question, setQuestion] = useState("");
  const [maxResults, setMaxResults] = useState(6);
  const [recencyDays, setRecencyDays] = useState<number | "">("");
  const [includeDomains, setIncludeDomains] = useState("");
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ResearchRunResult | null>(null);
  const [sessions, setSessions] = useState<ResearchSessionSummary[]>([]);
  const [activeSourceId, setActiveSourceId] = useState<number | null>(null);
  const [pendingDelete, setPendingDelete] = useState<ResearchSessionSummary | null>(
    null,
  );
  const [deleting, setDeleting] = useState(false);

  const sourceRefs = useRef<Record<number, HTMLElement | null>>({});

  const validIds = useMemo(
    () => collectValidSourceIds(result?.sources ?? []),
    [result],
  );

  const loadSessions = useCallback(async () => {
    try {
      const response = await researchApi.listSessions(20);
      setSessions(response.sessions);
    } catch {
      // Non-fatal for the main panel.
    }
  }, []);

  useEffect(() => {
    void loadSessions();
  }, [loadSessions]);

  const focusSource = (id: number) => {
    setActiveSourceId(id);
    sourceRefs.current[id]?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
    });
  };

  const startNew = () => {
    setResult(null);
    setQuestion("");
    setError(null);
    setProgress(null);
    setActiveSourceId(null);
  };

  const openSession = async (id: string) => {
    setError(null);
    setProgress(null);
    try {
      const response = await researchApi.getSession(id);
      setResult(response.data);
      setQuestion(response.data.question);
      setActiveSourceId(null);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Failed to load research session.",
      );
    }
  };

  const runResearch = async (event?: FormEvent, preset?: string) => {
    event?.preventDefault();
    const nextQuestion = (preset ?? question).trim();
    if (nextQuestion.length < 3 || running) return;

    setQuestion(nextQuestion);
    setRunning(true);
    setError(null);
    setResult(null);
    setActiveSourceId(null);
    setProgress("Searching the web and gathering sources…");

    const domains = includeDomains
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 10);

    try {
      const response = await researchApi.run({
        question: nextQuestion,
        maxResults,
        recencyDays: recencyDays === "" ? null : recencyDays,
        includeDomains: domains.length > 0 ? domains : undefined,
      });
      setResult(response.data);
      setProgress(null);
      await loadSessions();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Research failed. Check backend configuration and try again.",
      );
      setProgress(null);
    } finally {
      setRunning(false);
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await researchApi.deleteSession(pendingDelete.id);
      if (result?.sessionId === pendingDelete.id) {
        startNew();
      }
      setPendingDelete(null);
      await loadSessions();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Failed to delete session.",
      );
    } finally {
      setDeleting(false);
    }
  };

  const report = result?.report;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-8 sm:px-6 lg:px-8">
      <Link
        to="/"
        className="w-fit text-sm text-[var(--color-ink-400)] transition hover:text-[var(--color-accent)]"
      >
        ← Back to dashboard
      </Link>

      <header className="fade-in mt-6 max-w-3xl">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--color-accent)]">
          Project 5
        </p>
        <h1 className="font-display mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
          AI Research Assistant
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-[var(--color-ink-300)] sm:text-base">
          Ask a research question. The backend searches the live web, retrieves
          public pages when safe, synthesizes a structured report, and validates
          every citation against real sources.
        </p>
      </header>

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.25fr)]">
        <aside className="space-y-4">
          <section className="rounded-2xl border border-white/10 bg-[var(--color-surface-850)]/80 p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-display text-lg font-semibold">History</h2>
              <button
                type="button"
                onClick={startNew}
                className="text-xs font-medium text-[var(--color-accent)] hover:underline"
              >
                New research
              </button>
            </div>
            <ul className="mt-3 max-h-80 space-y-2 overflow-y-auto">
              {sessions.length === 0 ? (
                <li className="text-sm text-[var(--color-ink-400)]">
                  No saved research sessions yet.
                </li>
              ) : (
                sessions.map((session) => (
                  <li key={session.id} className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => void openSession(session.id)}
                      className={`min-w-0 flex-1 rounded-lg border px-3 py-2 text-left text-sm ${
                        result?.sessionId === session.id
                          ? "border-[var(--color-accent)]/40 bg-[var(--color-accent)]/10"
                          : "border-white/10 hover:border-white/25"
                      }`}
                    >
                      <span className="line-clamp-2 font-medium">
                        {session.title}
                      </span>
                      <span className="mt-1 block text-[11px] text-[var(--color-ink-500)]">
                        {session.status} · {session.sourceCount} sources ·{" "}
                        {formatWhen(session.updatedAt)}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPendingDelete(session)}
                      className="shrink-0 rounded-lg border border-white/10 px-2 text-xs text-[var(--color-ink-400)] hover:border-[var(--color-danger)]/40 hover:text-[var(--color-danger)]"
                      aria-label={`Delete session ${session.title}`}
                    >
                      Delete
                    </button>
                  </li>
                ))
              )}
            </ul>
          </section>
        </aside>

        <div className="space-y-4">
          <section className="rounded-2xl border border-white/10 bg-[var(--color-surface-850)]/80 p-5">
            <h2 className="font-display text-lg font-semibold">Research question</h2>
            <p className="mt-1 text-sm text-[var(--color-ink-400)]">
              Example prompts seed the form. Live search requires{" "}
              <code className="text-[var(--color-ink-200)]">TAVILY_API_KEY</code>{" "}
              on the backend.
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              {SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  disabled={running}
                  onClick={() => void runResearch(undefined, suggestion)}
                  className="rounded-lg border border-white/10 px-2.5 py-1 text-left text-xs text-[var(--color-ink-300)] hover:border-[var(--color-accent)]/40 disabled:opacity-50"
                >
                  {suggestion}
                </button>
              ))}
            </div>

            <form className="mt-4 space-y-3" onSubmit={(event) => void runResearch(event)}>
              <textarea
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                rows={4}
                placeholder="What should we research?"
                disabled={running}
                className="w-full rounded-xl border border-white/10 bg-[var(--color-surface-800)] px-3 py-2 text-sm text-[var(--color-ink-100)] outline-none ring-[var(--color-accent)] focus:ring-1 disabled:opacity-60"
              />

              <div className="flex flex-wrap gap-3">
                <label className="flex items-center gap-2 text-sm text-[var(--color-ink-300)]">
                  Max sources
                  <select
                    value={maxResults}
                    onChange={(event) => setMaxResults(Number(event.target.value))}
                    disabled={running}
                    className="rounded-lg border border-white/10 bg-[var(--color-surface-800)] px-2 py-1.5 text-sm"
                  >
                    {[3, 4, 5, 6, 8, 10].map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex items-center gap-2 text-sm text-[var(--color-ink-300)]">
                  Recency (days)
                  <input
                    type="number"
                    min={1}
                    max={365}
                    value={recencyDays}
                    onChange={(event) => {
                      const value = event.target.value;
                      setRecencyDays(value === "" ? "" : Number(value));
                    }}
                    disabled={running}
                    placeholder="any"
                    className="w-20 rounded-lg border border-white/10 bg-[var(--color-surface-800)] px-2 py-1.5 text-sm"
                  />
                </label>
              </div>

              <label className="block text-sm text-[var(--color-ink-300)]">
                Prefer domains (comma-separated, optional)
                <input
                  type="text"
                  value={includeDomains}
                  onChange={(event) => setIncludeDomains(event.target.value)}
                  disabled={running}
                  placeholder="react.dev, angular.dev"
                  className="mt-1 w-full rounded-lg border border-white/10 bg-[var(--color-surface-800)] px-3 py-2 text-sm"
                />
              </label>

              <button
                type="submit"
                disabled={running || question.trim().length < 3}
                className="rounded-xl bg-[var(--color-accent)] px-4 py-2.5 text-sm font-semibold text-[var(--color-surface-950)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {running ? "Researching…" : "Run Research"}
              </button>
            </form>

            {progress ? (
              <p className="mt-3 text-sm text-[var(--color-accent)]" role="status">
                {progress}
              </p>
            ) : null}
            {error ? (
              <div className="mt-3 rounded-xl border border-[var(--color-danger)]/30 bg-[var(--color-danger)]/10 px-3 py-2 text-sm text-[var(--color-danger)]">
                <p>{error}</p>
                <button
                  type="button"
                  className="mt-2 text-xs font-medium underline"
                  onClick={() => void runResearch()}
                  disabled={running || question.trim().length < 3}
                >
                  Retry
                </button>
              </div>
            ) : null}
          </section>

          {!result && !running && !error ? (
            <section className="rounded-2xl border border-dashed border-white/15 bg-[var(--color-surface-850)]/40 p-6 text-sm text-[var(--color-ink-400)]">
              Run a research question to generate a cited report. Results and
              sources are saved so you can reopen them from History.
            </section>
          ) : null}

          {result ? (
            <>
              <section className="rounded-2xl border border-white/10 bg-[var(--color-surface-850)]/80 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="font-display text-lg font-semibold">Report</h2>
                    <p className="mt-1 text-sm text-[var(--color-ink-400)]">
                      Session #{result.sessionId} · {result.status} ·{" "}
                      {result.sources.length} sources · {result.durationMs} ms
                      {result.insufficientEvidence
                        ? " · insufficient evidence"
                        : ""}
                    </p>
                  </div>
                </div>

                {result.errorMessage ? (
                  <p className="mt-3 text-sm text-[var(--color-danger)]">
                    {result.errorMessage}
                  </p>
                ) : null}

                {report ? (
                  <div className="mt-4 space-y-5 text-sm leading-relaxed text-[var(--color-ink-100)]">
                    <ReportBlock title="Executive summary">
                      {renderCitedText(
                        report.executiveSummary,
                        validIds,
                        focusSource,
                      )}
                    </ReportBlock>

                    {report.keyFindings.length > 0 ? (
                      <div>
                        <h3 className="font-display text-base font-semibold">
                          Key findings
                        </h3>
                        <ul className="mt-2 list-disc space-y-1 pl-5">
                          {report.keyFindings.map((finding, index) => (
                            <li key={`f-${index}`}>
                              {renderCitedText(finding, validIds, focusSource)}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}

                    <ReportBlock title="Detailed analysis">
                      {renderCitedText(
                        report.detailedAnalysis,
                        validIds,
                        focusSource,
                      )}
                    </ReportBlock>

                    <ReportBlock title="Areas of agreement">
                      {renderCitedText(report.agreements, validIds, focusSource)}
                    </ReportBlock>

                    <ReportBlock title="Conflicting evidence">
                      {renderCitedText(report.conflicts, validIds, focusSource)}
                    </ReportBlock>

                    <ReportBlock title="Limitations">
                      {renderCitedText(report.limitations, validIds, focusSource)}
                    </ReportBlock>

                    <ReportBlock title="Conclusions">
                      {renderCitedText(report.conclusions, validIds, focusSource)}
                    </ReportBlock>

                    {result.searchQueries.length > 0 ? (
                      <div>
                        <h3 className="font-display text-base font-semibold">
                          Search queries used
                        </h3>
                        <ul className="mt-2 list-disc pl-5 text-[var(--color-ink-300)]">
                          {result.searchQueries.map((query) => (
                            <li key={query}>{query}</li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-[var(--color-ink-400)]">
                    No report available for this session.
                  </p>
                )}
              </section>

              <section className="rounded-2xl border border-white/10 bg-[var(--color-surface-850)]/80 p-5">
                <h2 className="font-display text-lg font-semibold">Sources</h2>
                <p className="mt-1 text-sm text-[var(--color-ink-400)]">
                  Citation markers open the matching source. Links open
                  externally with safe attributes.
                </p>
                <ul className="mt-4 space-y-3">
                  {result.sources.length === 0 ? (
                    <li className="text-sm text-[var(--color-ink-400)]">
                      No sources were retained for this run.
                    </li>
                  ) : (
                    result.sources.map((source) => (
                      <li
                        key={source.id}
                        ref={(node) => {
                          sourceRefs.current[source.id] = node;
                        }}
                        className={`rounded-xl border px-4 py-3 ${
                          activeSourceId === source.id
                            ? "border-[var(--color-accent)]/50 bg-[var(--color-accent)]/10"
                            : "border-white/10 bg-[var(--color-surface-800)]/60"
                        }`}
                      >
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                          <p className="text-sm font-semibold">
                            [{source.id}] {source.title}
                          </p>
                          <span className="text-[11px] uppercase tracking-wide text-[var(--color-ink-500)]">
                            {fetchStatusLabel(source.fetchStatus)}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-[var(--color-ink-400)]">
                          {source.domain}
                          {source.publishedAt
                            ? ` · published ${source.publishedAt}`
                            : ""}{" "}
                          · retrieved {formatWhen(source.retrievedAt)}
                        </p>
                        <p className="mt-2 text-sm text-[var(--color-ink-300)]">
                          {source.snippet || source.excerpt.slice(0, 280)}
                        </p>
                        <a
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 inline-block break-all text-xs text-[var(--color-accent)] hover:underline"
                        >
                          {source.url}
                        </a>
                      </li>
                    ))
                  )}
                </ul>
              </section>
            </>
          ) : null}
        </div>
      </div>

      {pendingDelete ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[var(--color-surface-850)] p-5 shadow-xl">
            <h3 className="font-display text-lg font-semibold">Delete research?</h3>
            <p className="mt-2 text-sm text-[var(--color-ink-300)]">
              This permanently removes “{pendingDelete.title}” and its sources.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setPendingDelete(null)}
                className="rounded-lg border border-white/10 px-3 py-2 text-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={() => void confirmDelete()}
                className="rounded-lg bg-[var(--color-danger)] px-3 py-2 text-sm font-semibold text-white"
              >
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}

function ReportBlock({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  if (typeof children === "string" && !children.trim()) return null;
  if (Array.isArray(children) && children.length === 0) return null;

  return (
    <div>
      <h3 className="font-display text-base font-semibold">{title}</h3>
      <p className="mt-2 whitespace-pre-wrap">{children}</p>
    </div>
  );
}
