import { cn } from "@/lib/utils";

/**
 * The mark is a routing glyph: a request enters on the left, is diverted at a
 * decision point, and terminates in a resolved node — the product's core loop.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 28 28"
      className={cn("size-7", className)}
      aria-hidden="true"
      fill="none"
    >
      <rect width="28" height="28" rx="7" className="fill-fg" />
      <path
        d="M6 10.5h5.5c1.6 0 2.4 1 3.1 2s1.5 2 3.1 2H22"
        stroke="var(--bg)"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6 18.5h5.5c1.6 0 2.4-1 3.1-2"
        stroke="var(--bg)"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.45"
      />
      <circle cx="21.6" cy="14.5" r="2.6" className="fill-accent" />
    </svg>
  );
}

export function Logo({
  className,
  showWordmark = true,
}: {
  className?: string;
  showWordmark?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <LogoMark />
      {showWordmark && (
        <span className="text-[15px] font-semibold tracking-[-0.01em] text-fg">
          Support<span className="text-muted">-AI</span>
        </span>
      )}
    </span>
  );
}
