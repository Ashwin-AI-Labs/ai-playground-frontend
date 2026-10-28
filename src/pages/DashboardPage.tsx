import { useCallback, useEffect, useState } from "react";
import { FeatureCard } from "../components/ui/FeatureCard";
import {
  StatusIndicator,
  type ConnectionStatus,
} from "../components/status/StatusIndicator";
import { features } from "../features/registry";
import { ApiError, apiClient } from "../services/api/client";

export function DashboardPage() {
  const [status, setStatus] = useState<ConnectionStatus>("loading");
  const [message, setMessage] = useState<string | undefined>();

  const checkConnection = useCallback(async () => {
    setStatus("loading");
    setMessage(undefined);

    try {
      const health = await apiClient.getHealth();
      if (!health.success) {
        throw new ApiError("Backend reported an unhealthy status");
      }

      setStatus("connected");
      setMessage(`Connected to ${apiClient.getBaseUrl()}`);
    } catch (error) {
      setStatus("error");
      setMessage(
        error instanceof ApiError
          ? error.message
          : "Unexpected error while checking the backend.",
      );
    }
  }, []);

  useEffect(() => {
    void checkConnection();
  }, [checkConnection]);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-10 sm:px-6 lg:px-8">
      <header className="fade-in max-w-3xl">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-[var(--color-accent)]">
          Unified demo workspace
        </p>
        <h1 className="font-display mt-3 text-4xl font-bold tracking-tight text-[var(--color-ink-100)] sm:text-5xl">
          AI Playground
        </h1>
        <p className="mt-4 text-base leading-relaxed text-[var(--color-ink-300)] sm:text-lg">
          A single application that demonstrates six AI technologies — chat,
          tool use, semantic search, RAG, summarization, and research agents —
          behind one shared frontend and API foundation.
        </p>
      </header>

      <section className="slide-up mt-8" aria-label="Backend connection status">
        <StatusIndicator
          status={status}
          message={message}
          onRetry={() => {
            void checkConnection();
          }}
        />
      </section>

      <section className="mt-10" aria-label="AI feature playgrounds">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-semibold tracking-tight">
              Feature playgrounds
            </h2>
            <p className="mt-1 text-sm text-[var(--color-ink-400)]">
              Placeholder routes for upcoming AI capabilities.
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {features.map((feature, index) => (
            <FeatureCard key={feature.id} feature={feature} index={index} />
          ))}
        </div>
      </section>
    </main>
  );
}
