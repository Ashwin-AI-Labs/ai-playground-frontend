import { Link, useParams } from "react-router-dom";
import { getFeatureById } from "../features/registry";

export function FeaturePlaceholderPage() {
  const { featureId } = useParams<{ featureId: string }>();
  const feature = featureId ? getFeatureById(featureId) : undefined;

  if (!feature) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center px-4 py-16">
        <h1 className="font-display text-3xl font-bold">Feature not found</h1>
        <p className="mt-3 text-[var(--color-ink-300)]">
          That playground route does not exist yet.
        </p>
        <Link
          to="/"
          className="mt-8 inline-flex w-fit rounded-lg border border-white/15 bg-[var(--color-surface-800)] px-4 py-2 text-sm font-medium transition hover:border-[var(--color-accent)]/50"
        >
          Back to dashboard
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col px-4 py-12 sm:px-6">
      <Link
        to="/"
        className="w-fit text-sm text-[var(--color-ink-400)] transition hover:text-[var(--color-accent)]"
      >
        ← Back to dashboard
      </Link>

      <div className="fade-in mt-10 rounded-2xl border border-white/10 bg-[var(--color-surface-850)]/80 p-8">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--color-accent)]">
          {feature.tech}
        </p>
        <h1 className="font-display mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
          {feature.title}
        </h1>
        <p className="mt-4 text-base leading-relaxed text-[var(--color-ink-300)]">
          {feature.description}
        </p>
        <div className="mt-8 border-t border-white/10 pt-6">
          <p className="text-sm font-medium text-[var(--color-ink-100)]">
            Coming in a later phase
          </p>
          <p className="mt-2 text-sm leading-relaxed text-[var(--color-ink-400)]">
            This route is a placeholder. AI integrations for this feature will
            be wired once the shared playground foundation is complete.
          </p>
        </div>
      </div>
    </main>
  );
}
