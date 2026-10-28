import type { ReactNode } from "react";

/** Split report text into plain spans and citation buttons for known IDs only. */
export function renderCitedText(
  text: string,
  validIds: Set<number>,
  onCite: (id: number) => void,
): ReactNode[] {
  if (!text) return [];
  const parts = text.split(/(\[\d+\])/g);
  return parts.map((part, index) => {
    const match = part.match(/^\[(\d+)\]$/);
    if (!match) {
      return <span key={`t-${index}`}>{part}</span>;
    }
    const citationId = Number(match[1]);
    if (!validIds.has(citationId)) {
      return <span key={`u-${index}`}>{part}</span>;
    }
    return (
      <button
        key={`c-${index}-${citationId}`}
        type="button"
        onClick={() => onCite(citationId)}
        className="mx-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded bg-[var(--color-accent)]/20 px-1 text-xs font-semibold text-[var(--color-accent)] hover:bg-[var(--color-accent)]/30"
        aria-label={`Open source ${citationId}`}
      >
        {citationId}
      </button>
    );
  });
}

export function collectValidSourceIds(
  sources: Array<{ id: number }>,
): Set<number> {
  return new Set(sources.map((source) => source.id));
}
