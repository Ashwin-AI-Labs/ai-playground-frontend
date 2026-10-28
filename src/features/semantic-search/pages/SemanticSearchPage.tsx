import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { FeatureShell } from "../../../components/layout/FeatureShell";
import { ApiError } from "../../../services/api/client";
import { semanticSearchApi } from "../api/semanticSearchApi";
import type { SearchDocument, SearchResult } from "../types";

const ACCEPTED = ".pdf,.txt,.md,.markdown";
const MAX_MB = 10;

function formatBytes(value: string): string {
  const bytes = Number(value);
  if (!Number.isFinite(bytes)) return value;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function statusLabel(status: SearchDocument["status"]): string {
  if (status === "completed") return "Indexed";
  if (status === "processing") return "Processing";
  return "Failed";
}

export function SemanticSearchPage() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [documents, setDocuments] = useState<SearchDocument[]>([]);
  const [total, setTotal] = useState(0);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [docsError, setDocsError] = useState<string | null>(null);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<SearchDocument | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [query, setQuery] = useState("");
  const [limit, setLimit] = useState(5);
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searchNote, setSearchNote] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const completedDocs = useMemo(
    () => documents.filter((doc) => doc.status === "completed"),
    [documents],
  );

  const loadDocuments = useCallback(async () => {
    setLoadingDocs(true);
    setDocsError(null);
    try {
      const response = await semanticSearchApi.listDocuments({ limit: 50 });
      setDocuments(response.documents);
      setTotal(response.total);
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

  useEffect(() => {
    void loadDocuments();
  }, [loadDocuments]);

  const handleFiles = async (files: FileList | File[]) => {
    const file = Array.from(files)[0];
    if (!file) return;

    setUploading(true);
    setUploadMessage(null);
    setDocsError(null);
    try {
      const response = await semanticSearchApi.uploadDocument(file);
      setUploadMessage(
        response.duplicate
          ? response.message ??
              "Identical content was already indexed; showing the existing document."
          : `Indexed “${response.document.originalFilename}” into ${response.document.chunkCount} chunks.`,
      );
      await loadDocuments();
    } catch (error) {
      setDocsError(
        error instanceof ApiError ? error.message : "Upload failed.",
      );
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const onSearch = async (event?: FormEvent) => {
    event?.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) {
      setSearchError("Enter a natural-language search query.");
      return;
    }

    setSearching(true);
    setSearchError(null);
    setHasSearched(true);
    try {
      const response = await semanticSearchApi.search({
        query: trimmed,
        limit,
        documentIds: selectedDocIds,
      });
      setResults(response.results);
      setSearchNote(response.note ?? null);
    } catch (error) {
      setResults([]);
      setSearchError(
        error instanceof ApiError ? error.message : "Search failed.",
      );
    } finally {
      setSearching(false);
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await semanticSearchApi.deleteDocument(pendingDelete.id);
      setSelectedDocIds((ids) => ids.filter((id) => id !== pendingDelete.id));
      setPendingDelete(null);
      await loadDocuments();
    } catch (error) {
      setDocsError(
        error instanceof ApiError ? error.message : "Delete failed.",
      );
    } finally {
      setDeleting(false);
    }
  };

  const toggleDocFilter = (id: string) => {
    setSelectedDocIds((current) =>
      current.includes(id)
        ? current.filter((value) => value !== id)
        : [...current, id],
    );
  };

  return (
    <FeatureShell
      title="Semantic Document Search"
      description="Upload PDF, TXT, or Markdown files. Passages are embedded and ranked by meaning — not exact keywords."
      wide={true}
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        <section
          className="rounded-2xl border border-[var(--color-border)] bg-white p-5"
          aria-label="Document management"
        >
          <h2 className="font-display text-xl font-semibold">Documents</h2>
          <p className="mt-1 text-sm text-[var(--color-ink-400)]">
            Supported: PDF, TXT, Markdown · max {MAX_MB} MB
          </p>

          <div
            className={`mt-4 rounded-xl border border-dashed px-4 py-8 text-center transition ${
              dragOver
                ? "border-[var(--color-accent)] bg-[var(--color-accent)]/10"
                : "border-[var(--color-border)] bg-[var(--color-surface-800)]/60"
            }`}
            onDragOver={(event) => {
              event.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(event) => {
              event.preventDefault();
              setDragOver(false);
              void handleFiles(event.dataTransfer.files);
            }}
          >
            <p className="text-sm text-[var(--color-ink-200)]">
              Drag and drop a file here
            </p>
            <button
              type="button"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
              className="mt-3 inline-flex rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-700)] px-3.5 py-2 text-sm font-medium transition hover:border-[var(--color-accent)]/50 disabled:opacity-50"
            >
              {uploading ? "Indexing…" : "Browse files"}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED}
              className="hidden"
              onChange={(event) => {
                if (event.target.files) {
                  void handleFiles(event.target.files);
                }
              }}
            />
          </div>

          {uploadMessage ? (
            <p className="mt-3 text-sm text-[var(--color-accent)]">{uploadMessage}</p>
          ) : null}
          {docsError ? (
            <p className="mt-3 text-sm text-[var(--color-danger)]">{docsError}</p>
          ) : null}

          <div className="mt-5 flex items-center justify-between gap-3">
            <h3 className="text-sm font-medium text-[var(--color-ink-100)]">
              Indexed ({total})
            </h3>
            <button
              type="button"
              onClick={() => void loadDocuments()}
              className="text-xs text-[var(--color-ink-400)] hover:text-[var(--color-accent)]"
            >
              Refresh
            </button>
          </div>

          <ul className="mt-3 max-h-[28rem] space-y-2 overflow-y-auto pr-1">
            {loadingDocs ? (
              <li className="text-sm text-[var(--color-ink-400)]">Loading…</li>
            ) : documents.length === 0 ? (
              <li className="text-sm text-[var(--color-ink-400)]">
                No documents yet. Upload one to start searching.
              </li>
            ) : (
              documents.map((doc) => (
                <li
                  key={doc.id}
                  className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-800)]/70 p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-[var(--color-ink-100)]">
                        {doc.originalFilename}
                      </p>
                      <p className="mt-1 text-xs text-[var(--color-ink-400)]">
                        #{doc.id} · {statusLabel(doc.status)} · {doc.chunkCount}{" "}
                        chunks · {formatBytes(doc.fileSizeBytes)}
                      </p>
                      {doc.errorMessage ? (
                        <p className="mt-1 text-xs text-[var(--color-danger)]">
                          {doc.errorMessage}
                        </p>
                      ) : null}
                    </div>
                    <button
                      type="button"
                      onClick={() => setPendingDelete(doc)}
                      className="shrink-0 text-xs text-[var(--color-danger)] hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))
            )}
          </ul>
        </section>

        <section
          className="rounded-2xl border border-[var(--color-border)] bg-white p-5"
          aria-label="Semantic search"
        >
          <h2 className="font-display text-xl font-semibold">Search</h2>
          <p className="mt-1 text-sm text-[var(--color-ink-400)]">
            Ask in plain language. Results are ranked by cosine similarity.
          </p>

          <form className="mt-4 space-y-3" onSubmit={(event) => void onSearch(event)}>
            <label className="block">
              <span className="sr-only">Search query</span>
              <textarea
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                rows={3}
                placeholder='e.g. "What is the company&apos;s work-from-home policy?"'
                className="w-full resize-y rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-800)] px-3 py-2 text-sm text-[var(--color-ink-100)] outline-none ring-[var(--color-accent)] focus:ring-1"
              />
            </label>

            <div className="flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-2 text-sm text-[var(--color-ink-300)]">
                Results
                <select
                  value={limit}
                  onChange={(event) => setLimit(Number(event.target.value))}
                  className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-800)] px-2 py-1.5 text-sm"
                >
                  {[3, 5, 8, 10].map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="submit"
                disabled={searching}
                className="inline-flex rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
              >
                {searching ? "Searching…" : "Search"}
              </button>
            </div>
          </form>

          {completedDocs.length > 0 ? (
            <div className="mt-4">
              <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-ink-400)]">
                Filter by document (optional)
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {completedDocs.map((doc) => {
                  const active = selectedDocIds.includes(doc.id);
                  return (
                    <button
                      key={doc.id}
                      type="button"
                      onClick={() => toggleDocFilter(doc.id)}
                      className={`rounded-lg border px-2.5 py-1 text-xs transition ${
                        active
                          ? "border-[var(--color-accent)]/60 bg-[var(--color-accent)]/15 text-[var(--color-ink-100)]"
                          : "border-[var(--color-border)] text-[var(--color-ink-400)] hover:border-[var(--color-accent)]/40"
                      }`}
                    >
                      {doc.originalFilename}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          {searchError ? (
            <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-[var(--color-danger)]/30 bg-[var(--color-danger)]/10 px-3 py-2">
              <p className="text-sm text-[var(--color-danger)]">{searchError}</p>
              <button
                type="button"
                onClick={() => void onSearch()}
                className="text-xs font-medium text-[var(--color-ink-100)] underline"
              >
                Retry
              </button>
            </div>
          ) : null}

          <div className="mt-5 space-y-3">
            {!hasSearched ? (
              <p className="text-sm text-[var(--color-ink-400)]">
                Run a search to see ranked passages from your indexed documents.
              </p>
            ) : searching ? (
              <p className="text-sm text-[var(--color-ink-400)]">Searching…</p>
            ) : results.length === 0 ? (
              <p className="text-sm text-[var(--color-ink-400)]">
                No matching passages. Try a different query or upload more
                documents.
              </p>
            ) : (
              results.map((result) => (
                <article
                  key={`${result.chunkId}-${result.rank}`}
                  className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-800)]/80 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-accent)]">
                      Rank #{result.rank}
                    </p>
                    <p className="text-xs text-[var(--color-ink-300)]">
                      Similarity {result.similarityPercent.toFixed(1)}%
                    </p>
                  </div>
                  <h3 className="mt-2 text-sm font-semibold text-[var(--color-ink-100)]">
                    {result.originalFilename}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--color-ink-200)]">
                    {result.passage}
                  </p>
                  <p className="mt-3 text-xs text-[var(--color-ink-500)]">
                    Doc #{result.documentId} · Chunk #{result.chunkId} (index{" "}
                    {result.chunkIndex})
                  </p>
                </article>
              ))
            )}
          </div>

          {searchNote ? (
            <p className="mt-4 text-xs leading-relaxed text-[var(--color-ink-500)]">
              {searchNote}
            </p>
          ) : null}
        </section>
      </div>

      {pendingDelete ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-850)] p-5">
            <h2 className="font-display text-lg font-semibold">Delete document?</h2>
            <p className="mt-2 text-sm text-[var(--color-ink-300)]">
              This permanently removes “{pendingDelete.originalFilename}” and all
              of its chunks/embeddings.
            </p>
            <div className="mt-5 flex justify-end gap-2">
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
                className="rounded-lg bg-[var(--color-danger)] px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
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
