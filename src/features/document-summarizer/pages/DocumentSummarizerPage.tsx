import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type DragEvent,
  type FormEvent,
} from "react";
import { FeatureShell } from "../../../components/layout/FeatureShell";
import { ApiError } from "../../../services/api/client";
import { summarizerApi } from "../api/summarizerApi";
import type {
  SummarizeResult,
  SummaryLength,
  SummaryListItem,
  SummaryStyle,
} from "../types";

const ACCEPTED = ".pdf,.txt,.md,.markdown";
const MAX_MB = 10;

function formatWhen(iso: string): string {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function formatChunkCount(count: number): string {
  return count === 1 ? "1 chunk" : `${count} chunks`;
}

function toMarkdown(result: SummarizeResult): string {
  const summary = result.summary;
  if (!summary) return "";
  const lines = [
    `# ${summary.title}`,
    "",
    `Document: ${result.documentName}`,
    `Length: ${result.length} · Style: ${result.style} · Strategy: ${result.strategy} · ${formatChunkCount(result.chunkCount)}`,
    "",
    "## Executive summary",
    summary.executiveSummary,
    "",
    "## Summary",
    summary.summary,
  ];
  if (summary.keyPoints.length) {
    lines.push(
      "",
      "## Key points",
      ...summary.keyPoints.map((item) => {
        const excerpt = item.sourceExcerpt
          ? `\n  - Source: “${item.sourceExcerpt}”${item.page != null ? ` (page ${item.page})` : ""}`
          : "";
        return `- ${item.text}${excerpt}`;
      }),
    );
  }
  if (summary.decisions.length) {
    lines.push("", "## Decisions", ...summary.decisions.map((item) => `- ${item}`));
  }
  if (summary.actionItems.length) {
    lines.push(
      "",
      "## Action items",
      ...summary.actionItems.map((item) => {
        const bits = [item.text];
        if (item.owner) bits.push(`owner: ${item.owner}`);
        if (item.dueDate) bits.push(`due: ${item.dueDate}`);
        return `- ${bits.join(" · ")}`;
      }),
    );
  }
  if (summary.importantDates.length) {
    lines.push(
      "",
      "## Important dates",
      ...summary.importantDates.map((item) => `- ${item.date}: ${item.label}`),
    );
  }
  if (summary.interpretations?.length) {
    lines.push(
      "",
      "## Interpretations (not explicit source facts)",
      ...summary.interpretations.map((item) => `- ${item}`),
    );
  }
  if (summary.limitations) {
    lines.push("", "## Limitations", summary.limitations);
  }
  return `${lines.join("\n")}\n`;
}

export function DocumentSummarizerPage() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [length, setLength] = useState<SummaryLength>("medium");
  const [style, setStyle] = useState<SummaryStyle>("general");
  const [strategy, setStrategy] = useState<
    "auto" | "direct" | "map_reduce" | "refine"
  >("auto");
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SummarizeResult | null>(null);
  const [history, setHistory] = useState<SummaryListItem[]>([]);
  const [pendingDelete, setPendingDelete] = useState<SummaryListItem | null>(
    null,
  );
  const [deleting, setDeleting] = useState(false);
  const [copyMessage, setCopyMessage] = useState<string | null>(null);

  const loadHistory = useCallback(async () => {
    try {
      const response = await summarizerApi.list(20);
      setHistory(response.summaries);
    } catch {
      // Non-fatal.
    }
  }, []);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  const acceptFile = (next: File | null) => {
    setFile(next);
    setError(null);
  };

  const onDrop = (event: DragEvent) => {
    event.preventDefault();
    setDragOver(false);
    const dropped = event.dataTransfer.files?.[0] ?? null;
    if (dropped) acceptFile(dropped);
  };

  const startNew = () => {
    setResult(null);
    setFile(null);
    setError(null);
    setProgress(null);
    setCopyMessage(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const openSummary = async (id: string) => {
    setError(null);
    try {
      const response = await summarizerApi.get(id);
      setResult(response.data);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Failed to load summary.",
      );
    }
  };

  const onSummarize = async (event?: FormEvent) => {
    event?.preventDefault();
    if (!file || running) return;

    if (file.size > MAX_MB * 1024 * 1024) {
      setError(`File exceeds the maximum size of ${MAX_MB} MB.`);
      return;
    }

    setRunning(true);
    setError(null);
    setResult(null);
    setProgress("Extracting text and running the LangChain summarization pipeline…");

    try {
      const response = await summarizerApi.summarize({
        file,
        length,
        style,
        strategy,
      });
      setResult(response.data);
      setProgress(null);
      await loadHistory();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Summarization failed. Check the backend configuration and try again.",
      );
      setProgress(null);
    } finally {
      setRunning(false);
    }
  };

  const copySummary = async () => {
    if (!result?.summary) return;
    try {
      await navigator.clipboard.writeText(toMarkdown(result));
      setCopyMessage("Copied to clipboard.");
    } catch {
      setCopyMessage("Clipboard copy failed.");
    }
  };

  const downloadSummary = () => {
    if (!result?.summary) return;
    const blob = new Blob([toMarkdown(result)], {
      type: "text/markdown;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${result.documentName.replace(/\.[^.]+$/, "") || "summary"}-summary.md`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await summarizerApi.delete(pendingDelete.id);
      if (result?.id === pendingDelete.id) startNew();
      setPendingDelete(null);
      await loadHistory();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Failed to delete summary.",
      );
    } finally {
      setDeleting(false);
    }
  };

  const summary = result?.summary;

  return (
    <FeatureShell
      title="AI Document Summarizer"
      description="Upload a PDF, TXT, or Markdown file. The backend extracts text, splits it with LangChain, and runs a real direct, map-reduce, or refine summarization pipeline with structured output validation."
      wide={true}
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.25fr)]">
        <aside className="space-y-4">
          <section className="rounded-2xl border border-[var(--color-border)] bg-white p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-display text-lg font-semibold">History</h2>
              <button
                type="button"
                onClick={startNew}
                className="text-xs font-medium text-[var(--color-accent)] hover:underline"
              >
                New summary
              </button>
            </div>
            <ul className="mt-3 max-h-96 space-y-2 overflow-y-auto">
              {history.length === 0 ? (
                <li className="text-sm text-[var(--color-ink-400)]">
                  No saved summaries yet.
                </li>
              ) : (
                history.map((item) => (
                  <li key={item.id} className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => void openSummary(item.id)}
                      className={`min-w-0 flex-1 rounded-lg border px-3 py-2 text-left text-sm ${
                        result?.id === item.id
                          ? "border-[var(--color-accent)]/40 bg-[var(--color-accent)]/10"
                          : "border-[var(--color-border)] hover:border-[var(--color-accent)]/40"
                      }`}
                    >
                      <span className="line-clamp-2 font-medium">
                        {item.documentName}
                      </span>
                      <span className="mt-1 block text-[11px] text-[var(--color-ink-500)]">
                        {item.length}/{item.style} · {item.strategy} ·{" "}
                        {formatWhen(item.updatedAt)}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPendingDelete(item)}
                      className="shrink-0 rounded-lg border border-[var(--color-border)] px-2 text-xs text-[var(--color-ink-400)] hover:border-[var(--color-danger)]/40 hover:text-[var(--color-danger)]"
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
          <section className="rounded-2xl border border-[var(--color-border)] bg-white p-5">
            <h2 className="font-display text-lg font-semibold">Upload</h2>
            <p className="mt-1 text-sm text-[var(--color-ink-400)]">
              Supported: PDF, TXT, Markdown · max {MAX_MB} MB. Does not require
              Semantic Search indexing.
            </p>

            <div
              onDragOver={(event) => {
                event.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              className={`mt-4 rounded-xl border border-dashed px-4 py-8 text-center transition ${
                dragOver
                  ? "border-[var(--color-accent)] bg-[var(--color-accent)]/10"
                  : "border-[var(--color-border)] bg-[var(--color-surface-800)]/40"
              }`}
            >
              <p className="text-sm text-[var(--color-ink-300)]">
                Drag and drop a document here, or browse.
              </p>
              <button
                type="button"
                disabled={running}
                onClick={() => fileInputRef.current?.click()}
                className="mt-3 rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-sm hover:border-[var(--color-accent)]/40 disabled:opacity-50"
              >
                Choose file
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED}
                className="hidden"
                onChange={(event) =>
                  acceptFile(event.target.files?.[0] ?? null)
                }
              />
              {file ? (
                <p className="mt-3 text-xs text-[var(--color-ink-400)]">
                  Selected: {file.name} · {(file.size / 1024).toFixed(1)} KB
                </p>
              ) : null}
            </div>

            <form className="mt-4 space-y-3" onSubmit={(event) => void onSummarize(event)}>
              <div className="flex flex-wrap gap-3">
                <label className="flex items-center gap-2 text-sm text-[var(--color-ink-300)]">
                  Length
                  <select
                    value={length}
                    disabled={running}
                    onChange={(event) =>
                      setLength(event.target.value as SummaryLength)
                    }
                    className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-800)] px-2 py-1.5 text-sm"
                  >
                    <option value="short">Short</option>
                    <option value="medium">Medium</option>
                    <option value="detailed">Detailed</option>
                  </select>
                </label>
                <label className="flex items-center gap-2 text-sm text-[var(--color-ink-300)]">
                  Style
                  <select
                    value={style}
                    disabled={running}
                    onChange={(event) =>
                      setStyle(event.target.value as SummaryStyle)
                    }
                    className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-800)] px-2 py-1.5 text-sm"
                  >
                    <option value="general">General</option>
                    <option value="executive">Executive</option>
                    <option value="technical">Technical</option>
                    <option value="academic">Academic</option>
                    <option value="meeting_notes">Meeting notes</option>
                  </select>
                </label>
                <label className="flex items-center gap-2 text-sm text-[var(--color-ink-300)]">
                  Strategy
                  <select
                    value={strategy}
                    disabled={running}
                    onChange={(event) =>
                      setStrategy(
                        event.target.value as
                          | "auto"
                          | "direct"
                          | "map_reduce"
                          | "refine",
                      )
                    }
                    className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-800)] px-2 py-1.5 text-sm"
                  >
                    <option value="auto">Auto</option>
                    <option value="direct">Direct</option>
                    <option value="map_reduce">Map-reduce</option>
                    <option value="refine">Refine</option>
                  </select>
                </label>
              </div>

              <button
                type="submit"
                disabled={running || !file}
                className="rounded-xl bg-[var(--color-accent)] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--color-accent-hover)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {running ? "Summarizing…" : "Generate Summary"}
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
                  disabled={running || !file}
                  onClick={() => void onSummarize()}
                >
                  Retry
                </button>
              </div>
            ) : null}
          </section>

          {!result && !running && !error ? (
            <section className="rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface-900)] p-6 text-sm text-[var(--color-ink-400)]">
              Upload a document and generate a summary. Completed results are
              saved in History so you can reopen, copy, or download them later.
            </section>
          ) : null}

          {result ? (
            <section className="rounded-2xl border border-[var(--color-border)] bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-display text-lg font-semibold">
                    {summary?.title || "Summary"}
                  </h2>
                  <p className="mt-1 text-sm text-[var(--color-ink-400)]">
                    #{result.id} · {result.documentName} · {result.length}/
                    {result.style} · {result.strategy} ·{" "}
                    {formatChunkCount(result.chunkCount)} · {result.durationMs}{" "}
                    ms
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => void copySummary()}
                    disabled={!summary}
                    className="rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs hover:border-[var(--color-accent)]/40 disabled:opacity-50"
                  >
                    Copy
                  </button>
                  <button
                    type="button"
                    onClick={downloadSummary}
                    disabled={!summary}
                    className="rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs hover:border-[var(--color-accent)]/40 disabled:opacity-50"
                  >
                    Download .md
                  </button>
                  <a
                    href={summarizerApi.exportUrl(result.id)}
                    className="rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs hover:border-[var(--color-accent)]/40"
                  >
                    Server export
                  </a>
                </div>
              </div>

              {copyMessage ? (
                <p className="mt-2 text-xs text-[var(--color-ink-400)]">
                  {copyMessage}
                </p>
              ) : null}

              {result.errorMessage ? (
                <p className="mt-3 text-sm text-[var(--color-danger)]">
                  {result.errorMessage}
                </p>
              ) : null}

              {summary ? (
                <div className="mt-4 space-y-5 text-sm leading-relaxed text-[var(--color-ink-100)]">
                  <Section title="Executive summary">{summary.executiveSummary}</Section>
                  <Section title="Summary">{summary.summary}</Section>
                  {summary.keyPoints.length > 0 ? (
                    <div>
                      <h3 className="font-display text-base font-semibold">
                        Key points
                      </h3>
                      <ul className="mt-2 space-y-3">
                        {summary.keyPoints.map((item, index) => (
                          <li key={`k-${index}`} className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-800)]/50 px-3 py-2">
                            <p>{item.text}</p>
                            {item.sourceExcerpt ? (
                              <p className="mt-1 text-xs text-[var(--color-ink-400)]">
                                Source
                                {item.page != null ? ` · page ${item.page}` : ""}
                                : “{item.sourceExcerpt}”
                              </p>
                            ) : (
                              <p className="mt-1 text-xs text-[var(--color-ink-500)]">
                                No verified source excerpt attached.
                              </p>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  {summary.decisions.length > 0 ? (
                    <ListSection title="Decisions" items={summary.decisions} />
                  ) : null}
                  {summary.actionItems.length > 0 ? (
                    <div>
                      <h3 className="font-display text-base font-semibold">
                        Action items
                      </h3>
                      <ul className="mt-2 list-disc space-y-1 pl-5">
                        {summary.actionItems.map((item, index) => (
                          <li key={`a-${index}`}>
                            {item.text}
                            {item.owner ? ` · owner: ${item.owner}` : ""}
                            {item.dueDate ? ` · due: ${item.dueDate}` : ""}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  {summary.importantDates.length > 0 ? (
                    <div>
                      <h3 className="font-display text-base font-semibold">
                        Important dates
                      </h3>
                      <ul className="mt-2 list-disc space-y-1 pl-5">
                        {summary.importantDates.map((item, index) => (
                          <li key={`d-${index}`}>
                            {item.date}: {item.label}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  {summary.interpretations?.length ? (
                    <div>
                      <h3 className="font-display text-base font-semibold">
                        Interpretations
                      </h3>
                      <p className="mt-1 text-xs text-[var(--color-ink-500)]">
                        Cautious inferences — not explicit source facts.
                      </p>
                      <ul className="mt-2 list-disc space-y-1 pl-5 text-[var(--color-ink-300)]">
                        {summary.interpretations.map((item, index) => (
                          <li key={`i-${index}`}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  {summary.limitations ? (
                    <Section title="Limitations">{summary.limitations}</Section>
                  ) : null}
                  {result.warnings.length > 0 ? (
                    <ListSection title="Warnings" items={result.warnings} />
                  ) : null}
                </div>
              ) : (
                <p className="mt-3 text-sm text-[var(--color-ink-400)]">
                  No structured summary is available for this record.
                </p>
              )}
            </section>
          ) : null}
        </div>
      </div>

      {pendingDelete ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-850)] p-5 shadow-xl">
            <h3 className="font-display text-lg font-semibold">Delete summary?</h3>
            <p className="mt-2 text-sm text-[var(--color-ink-300)]">
              This permanently removes the saved summary for “
              {pendingDelete.documentName}”.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setPendingDelete(null)}
                className="rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm"
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
    </FeatureShell>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: string;
}) {
  if (!children.trim()) return null;
  return (
    <div>
      <h3 className="font-display text-base font-semibold">{title}</h3>
      <p className="mt-2 whitespace-pre-wrap">{children}</p>
    </div>
  );
}

function ListSection({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h3 className="font-display text-base font-semibold">{title}</h3>
      <ul className="mt-2 list-disc space-y-1 pl-5">
        {items.map((item, index) => (
          <li key={`${title}-${index}`}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
