import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center px-4 py-16">
      <h1 className="font-display text-3xl font-bold">Page not found</h1>
      <p className="mt-3 text-[var(--color-ink-300)]">
        That route does not exist in the AI Playground.
      </p>
      <Link
        to="/home"
        className="mt-8 inline-flex w-fit rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-800)] px-4 py-2 text-sm font-medium transition hover:border-[var(--color-accent)]/50"
      >
        Back to home
      </Link>
    </main>
  );
}
