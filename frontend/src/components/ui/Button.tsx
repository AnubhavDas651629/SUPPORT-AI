"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Spinner } from "./Spinner";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "danger"
  | "link";
export type ButtonSize = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 font-medium whitespace-nowrap " +
  "transition-colors duration-150 select-none " +
  "disabled:opacity-50 disabled:pointer-events-none " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-accent text-accent-fg hover:bg-accent-hover shadow-[0_1px_2px_rgba(0,0,0,0.08)]",
  secondary:
    "bg-surface text-fg border border-line-strong hover:bg-surface-2",
  ghost: "text-muted hover:text-fg hover:bg-surface-2",
  danger: "bg-danger text-white hover:opacity-90 dark:text-[#1a0a0a]",
  link: "text-accent hover:underline underline-offset-4 px-0 h-auto",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-[13px] rounded-control",
  md: "h-9.5 px-4 text-sm rounded-control",
  lg: "h-11 px-5 text-[15px] rounded-control",
};

interface CommonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export type ButtonProps = CommonProps &
  Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "children">;

export function Button({
  variant = "secondary",
  size = "md",
  loading = false,
  fullWidth = false,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        base,
        variants[variant],
        variant !== "link" && sizes[size],
        fullWidth && "w-full",
        className,
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Spinner className="size-4" />}
      {children}
    </button>
  );
}

export type ButtonLinkProps = CommonProps &
  Omit<React.ComponentProps<typeof Link>, "children">;

export function ButtonLink({
  variant = "secondary",
  size = "md",
  fullWidth = false,
  className,
  children,
  ...props
}: ButtonLinkProps) {
  return (
    <Link
      className={cn(
        base,
        variants[variant],
        variant !== "link" && sizes[size],
        fullWidth && "w-full",
        className,
      )}
      {...props}
    >
      {children}
    </Link>
  );
}

/** Square icon-only button. `label` is required — it becomes the accessible name. */
export function IconButton({
  label,
  variant = "ghost",
  size = "md",
  className,
  children,
  ...props
}: Omit<ButtonProps, "fullWidth"> & { label: string }) {
  return (
    <button
      aria-label={label}
      title={label}
      className={cn(
        base,
        variants[variant],
        "rounded-control shrink-0",
        size === "sm" ? "size-8" : size === "lg" ? "size-11" : "size-9.5",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
