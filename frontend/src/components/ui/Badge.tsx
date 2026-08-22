import * as React from "react";
import { cn } from "@/lib/utils";

export type BadgeTone =
  | "neutral"
  | "accent"
  | "success"
  | "warning"
  | "danger"
  | "info";

const tones: Record<BadgeTone, string> = {
  neutral: "bg-surface-2 text-muted border-line",
  accent: "bg-accent-soft text-accent border-accent-line",
  success: "bg-success-soft text-success border-success/25",
  warning: "bg-warning-soft text-warning border-warning/25",
  danger: "bg-danger-soft text-danger border-danger/25",
  info: "bg-info-soft text-info border-info/25",
};

export function Badge({
  tone = "neutral",
  dot = false,
  className,
  children,
}: {
  tone?: BadgeTone;
  dot?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5",
        "text-[11.5px] font-medium leading-5 whitespace-nowrap",
        tones[tone],
        className,
      )}
    >
      {dot && (
        <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
      )}
      {children}
    </span>
  );
}

/** Marks UI backed by placeholder data rather than a live backend endpoint. */
export function PreviewDataBadge({ title }: { title?: string }) {
  return (
    <span
      title={
        title ??
        "Preview data — this view is not backed by a live backend endpoint yet."
      }
      className="inline-flex items-center gap-1.5 rounded-full border border-warning/30 bg-warning-soft px-2 py-0.5 text-[11px] font-medium text-warning"
    >
      <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
      Preview data
    </span>
  );
}
