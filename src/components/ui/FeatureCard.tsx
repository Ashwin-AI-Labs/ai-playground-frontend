import { Link } from "react-router-dom";
import type { Feature } from "../../features/registry";

type FeatureCardProps = {
  feature: Feature;
  index: number;
};

export function FeatureCard({ feature, index }: FeatureCardProps) {
  return (
    <Link
      to={feature.path}
      className={`group slide-up stagger-${index + 1} block rounded-2xl border border-white/10 bg-[var(--color-surface-850)]/70 p-5 transition duration-200 hover:-translate-y-0.5 hover:border-[var(--color-accent)]/40 hover:bg-[var(--color-surface-800)]/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]`}
    >
      <p className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--color-accent)]">
        {feature.tech}
      </p>
      <h2 className="font-display mt-3 text-xl font-semibold tracking-tight text-[var(--color-ink-100)]">
        {feature.title}
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-[var(--color-ink-300)]">
        {feature.description}
      </p>
      <span className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-[var(--color-ink-100)] transition group-hover:text-[var(--color-accent)]">
        Open playground
        <span
          aria-hidden="true"
          className="transition group-hover:translate-x-0.5"
        >
          →
        </span>
      </span>
    </Link>
  );
}
