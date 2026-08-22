import * as React from "react";
import { cn } from "@/lib/utils";

/** Consistent page gutter. Every marketing section uses this — nothing else. */
export function Container({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("mx-auto w-full max-w-[1180px] px-5 sm:px-8", className)}>
      {children}
    </div>
  );
}

/**
 * One rhythm for the whole page: a numbered eyebrow, a heading, an optional
 * lede, then the section's own content — which varies in form so the page
 * doesn't read as fourteen identical card grids.
 */
export function Section({
  id,
  index,
  eyebrow,
  title,
  lede,
  children,
  className,
  bordered = true,
}: {
  id?: string;
  index?: string;
  eyebrow?: string;
  title?: React.ReactNode;
  lede?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bordered?: boolean;
}) {
  return (
    <section
      id={id}
      className={cn(
        "py-16 sm:py-20 lg:py-24",
        bordered && "border-t border-line",
        className,
      )}
    >
      <Container>
        {(eyebrow || title) && (
          <div className="max-w-2xl">
            {eyebrow && (
              <p className="flex items-center gap-2.5 font-code text-[11px] uppercase tracking-[0.14em] text-subtle">
                {index && <span className="text-accent-text">{index}</span>}
                {eyebrow}
              </p>
            )}
            {title && (
              <h2 className="mt-4 text-[26px] font-semibold leading-[1.15] tracking-[-0.02em] text-fg sm:text-[34px]">
                {title}
              </h2>
            )}
            {lede && (
              <p className="mt-4 text-[15px] leading-relaxed text-muted sm:text-base">
                {lede}
              </p>
            )}
          </div>
        )}
        <div className={cn(eyebrow || title ? "mt-10 sm:mt-14" : "")}>{children}</div>
      </Container>
    </section>
  );
}

/** Small monospaced label used to annotate diagrams and product surfaces. */
export function Tag({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded border border-line bg-surface-2 px-1.5 py-0.5",
        "font-code text-[10.5px] uppercase tracking-[0.08em] text-muted",
        className,
      )}
    >
      {children}
    </span>
  );
}
