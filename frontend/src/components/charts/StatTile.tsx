import * as React from "react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Sparkline } from "./Sparkline";

/**
 * A single headline figure. Not a chart — a one-bar bar chart would be worse.
 * `deltaGood` says whether a rise is good, so the arrow colour tells the truth
 * for metrics like escalation rate where up is bad.
 */
export function StatTile({
  label,
  value,
  unit,
  delta,
  deltaGood = "up",
  caption,
  trend,
  className,
}: {
  label: string;
  value: string | number;
  unit?: string;
  delta?: number | null;
  deltaGood?: "up" | "down";
  caption?: React.ReactNode;
  trend?: number[];
  className?: string;
}) {
  const hasDelta = typeof delta === "number" && Number.isFinite(delta) && delta !== 0;
  const rising = (delta ?? 0) > 0;
  const good = hasDelta ? (deltaGood === "up" ? rising : !rising) : null;

  return (
    <div className={cn("flex flex-col justify-between gap-3 p-4 sm:p-5", className)}>
      <p className="text-[12.5px] font-medium text-muted">{label}</p>
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-baseline gap-1 text-[26px] font-semibold leading-none tracking-[-0.02em] text-fg tnum">
            {value}
            {unit && <span className="text-sm font-medium text-muted">{unit}</span>}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
            {hasDelta && (
              <span
                className={cn(
                  "inline-flex items-center gap-0.5 text-[12px] font-medium tnum",
                  good ? "text-success" : "text-danger",
                )}
              >
                {rising ? (
                  <ArrowUpRight className="size-3.5" />
                ) : (
                  <ArrowDownRight className="size-3.5" />
                )}
                {Math.abs(delta!).toFixed(Math.abs(delta!) < 10 ? 1 : 0)}%
              </span>
            )}
            {caption && <span className="text-[12px] text-subtle">{caption}</span>}
          </div>
        </div>
        {trend && trend.length > 1 && (
          <Sparkline values={trend} className="shrink-0 opacity-80" />
        )}
      </div>
    </div>
  );
}

/** Grid of stat tiles separated by hairlines rather than nested cards. */
export function StatGrid({
  children,
  columns = 4,
  className,
}: {
  children: React.ReactNode;
  columns?: 2 | 3 | 4;
  className?: string;
}) {
  const cols = {
    2: "sm:grid-cols-2",
    3: "sm:grid-cols-2 lg:grid-cols-3",
    4: "sm:grid-cols-2 lg:grid-cols-4",
  } as const;
  return (
    <div
      className={cn(
        "grid grid-cols-1 divide-y divide-line overflow-hidden rounded-panel border border-line bg-surface",
        "sm:divide-y-0 sm:divide-x",
        cols[columns],
        columns === 4 && "sm:[&>*:nth-child(-n+2)]:border-b sm:[&>*:nth-child(3)]:border-l-0 lg:[&>*]:border-b-0 lg:[&>*:nth-child(3)]:border-l",
        columns === 3 && "sm:[&>*:nth-child(-n+2)]:border-b lg:[&>*]:border-b-0",
        className,
      )}
    >
      {children}
    </div>
  );
}
