import { cn } from "@/lib/utils";

/** A single ratio against a limit — a quota bar, never a two-slice pie. */
export function Meter({
  label,
  used,
  limit,
  formatValue = (v: number) => v.toLocaleString(),
  className,
}: {
  label: string;
  used: number;
  limit: number | null;
  formatValue?: (v: number) => string;
  className?: string;
}) {
  const pct = limit ? Math.min((used / limit) * 100, 100) : null;
  const state = pct == null ? "none" : pct >= 90 ? "critical" : pct >= 75 ? "warning" : "ok";

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[13px] text-fg">{label}</span>
        <span className="text-[12.5px] tnum text-muted">
          <span className="font-medium text-fg">{formatValue(used)}</span>
          {limit != null ? ` / ${formatValue(limit)}` : " · no limit"}
        </span>
      </div>
      <div
        className="h-1.5 w-full overflow-hidden rounded-full bg-surface-3"
        role="meter"
        aria-label={label}
        aria-valuenow={used}
        aria-valuemin={0}
        aria-valuemax={limit ?? undefined}
      >
        <div
          className={cn(
            "h-full rounded-full transition-[width] duration-500",
            state === "critical" && "bg-danger",
            state === "warning" && "bg-warning",
            (state === "ok" || state === "none") && "bg-accent",
          )}
          style={{ width: `${pct ?? 4}%` }}
        />
      </div>
    </div>
  );
}
