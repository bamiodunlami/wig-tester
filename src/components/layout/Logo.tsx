import { site } from "@/lib/site";

/** Placeholder logo: a monogram with a flowing strand, plus the wordmark. */
export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <svg viewBox="0 0 40 40" className="h-9 w-9" aria-hidden="true">
        <circle cx="20" cy="20" r="19" fill="var(--color-blush-400)" />
        <path d="M12 12h16M20 12v17" stroke="var(--color-ink)" strokeWidth="2.6" strokeLinecap="round" />
        <path
          d="M27 15c-4 3 3 6-1 10s-3 6 1 8"
          fill="none"
          stroke="var(--color-ink)"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
      <span className="font-display text-2xl tracking-wide">{site.name}</span>
    </span>
  );
}
