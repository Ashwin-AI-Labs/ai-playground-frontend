export type ConnectionStatus = "loading" | "connected" | "error";

type StatusIndicatorProps = {
  status: ConnectionStatus;
  message?: string;
  onRetry: () => void;
};

const statusCopy: Record<ConnectionStatus, { label: string; detail: string }> = {
  loading: {
    label: "Checking connection",
    detail: "Contacting the backend health endpoint…",
  },
  connected: {
    label: "API connected",
    detail: "Backend is reachable and responding.",
  },
  error: {
    label: "API unreachable",
    detail: "The frontend could not reach the backend.",
  },
};

export function StatusIndicator({ status, message, onRetry }: StatusIndicatorProps) {
  const copy = statusCopy[status];
  const dotClass =
    status === "connected"
      ? "bg-[var(--color-accent)] status-dot-live"
      : status === "loading"
        ? "bg-[var(--color-warn)]"
        : "bg-[var(--color-danger)]";

  return (
    <div
      className="flex flex-col gap-3 rounded-xl border border-white/10 bg-[var(--color-surface-850)]/80 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
      role="status"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${dotClass}`} />
        <div>
          <p className="text-sm font-medium text-[var(--color-ink-100)]">{copy.label}</p>
          <p className="mt-0.5 text-sm text-[var(--color-ink-400)]">
            {message ?? copy.detail}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={onRetry}
        disabled={status === "loading"}
        className="inline-flex items-center justify-center rounded-lg border border-white/15 bg-[var(--color-surface-800)] px-3.5 py-2 text-sm font-medium text-[var(--color-ink-100)] transition hover:border-[var(--color-accent)]/50 hover:bg-[var(--color-surface-700)] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {status === "loading" ? "Checking…" : "Retry connection"}
      </button>
    </div>
  );
}
