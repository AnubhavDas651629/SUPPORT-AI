import * as React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./Button";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton rounded-control", className)} aria-hidden="true" />;
}

export function LoadingRows({
  rows = 5,
  className,
}: {
  rows?: number;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2 p-4 sm:p-5", className)} aria-busy="true">
      <span className="sr-only">Loading…</span>
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-10 w-full" />
      ))}
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center px-6 py-14 text-center",
        className,
      )}
    >
      {Icon && (
        <div className="mb-3 flex size-10 items-center justify-center rounded-panel border border-line bg-surface-2">
          <Icon className="size-4.5 text-subtle" />
        </div>
      )}
      <p className="text-sm font-medium text-fg">{title}</p>
      {description && (
        <p className="mt-1 max-w-sm text-[13px] leading-relaxed text-muted">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorState({
  title = "Couldn't load this",
  message,
  onRetry,
  className,
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center px-6 py-12 text-center",
        className,
      )}
    >
      <div className="mb-3 flex size-10 items-center justify-center rounded-panel border border-danger/25 bg-danger-soft">
        <AlertTriangle className="size-4.5 text-danger" />
      </div>
      <p className="text-sm font-medium text-fg">{title}</p>
      {message && (
        <p className="mt-1 max-w-sm text-[13px] leading-relaxed text-muted">
          {message}
        </p>
      )}
      {onRetry && (
        <Button size="sm" className="mt-4" onClick={onRetry}>
          <RefreshCw className="size-3.5" />
          Try again
        </Button>
      )}
    </div>
  );
}

/** Inline banner for form-level or action-level failures. */
export function InlineAlert({
  tone = "danger",
  children,
  className,
}: {
  tone?: "danger" | "warning" | "info" | "success";
  children: React.ReactNode;
  className?: string;
}) {
  const tones = {
    danger: "border-danger/25 bg-danger-soft text-danger",
    warning: "border-warning/25 bg-warning-soft text-warning",
    info: "border-info/25 bg-info-soft text-info",
    success: "border-success/25 bg-success-soft text-success",
  } as const;
  return (
    <div
      role={tone === "danger" ? "alert" : "status"}
      className={cn(
        "rounded-control border px-3 py-2 text-[13px] leading-relaxed",
        tones[tone],
        className,
      )}
    >
      {children}
    </div>
  );
}
