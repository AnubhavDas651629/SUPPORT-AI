"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface BarListItem {
  label: string;
  value: number;
  /** Optional explicit colour; defaults to the accent. */
  color?: string;
  hint?: string;
}

/**
 * Horizontal labelled bars. Every row carries its own text label and value,
 * so the bar is a magnitude cue rather than the only way to read the data.
 * Used for part-to-whole breakdowns with long category names.
 */
export function BarList({
  items,
  formatValue = (v: number) => v.toLocaleString(),
  emptyLabel = "No data for this period",
  className,
}: {
  items: BarListItem[];
  formatValue?: (v: number) => string;
  emptyLabel?: string;
  className?: string;
}) {
  const max = Math.max(...items.map((i) => i.value), 1);

  if (items.length === 0 || items.every((i) => i.value === 0)) {
    return <p className={cn("py-6 text-center text-[13px] text-subtle", className)}>{emptyLabel}</p>;
  }

  return (
    <ul className={cn("space-y-2.5", className)}>
      {items.map((item) => (
        <li key={item.label}>
          <div className="flex items-baseline justify-between gap-3">
            <span className="truncate text-[13px] text-fg">{item.label}</span>
            <span className="shrink-0 text-[13px] tnum font-medium text-fg">
              {formatValue(item.value)}
              {item.hint && (
                <span className="ml-1.5 text-[12px] font-normal text-subtle">{item.hint}</span>
              )}
            </span>
          </div>
          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-surface-3">
            <div
              className="h-full rounded-full transition-[width] duration-500"
              style={{
                width: `${Math.max((item.value / max) * 100, item.value > 0 ? 2 : 0)}%`,
                background: item.color ?? "var(--accent)",
              }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
