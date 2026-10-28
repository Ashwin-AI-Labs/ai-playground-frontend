type BrandMarkProps = {
  className?: string;
};

/** Shared AI Playground brand mark used by landing and feature pages. */
export function BrandMark({ className = "h-8 w-8" }: BrandMarkProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
    >
      <rect width="32" height="32" rx="9" fill="#4F46E5" />
      <path
        d="M10 21.5 14.2 10h3.6L22 21.5h-3.1l-.7-2.1h-4.4l-.7 2.1H10Zm4.7-4.7h3.1l-1.5-4.5h-.1l-1.5 4.5Z"
        fill="white"
      />
      <circle cx="23.5" cy="9.5" r="1.6" fill="#C7D2FE" />
    </svg>
  );
}
