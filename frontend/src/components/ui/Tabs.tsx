"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface TabItem {
  id: string;
  label: string;
  count?: number;
}

/** Roving-tabindex tablist: arrow keys move between tabs, as WAI-ARIA expects. */
export function Tabs({
  items,
  value,
  onChange,
  className,
}: {
  items: TabItem[];
  value: string;
  onChange: (id: string) => void;
  className?: string;
}) {
  const refs = React.useRef<(HTMLButtonElement | null)[]>([]);

  function onKeyDown(e: React.KeyboardEvent) {
    const i = items.findIndex((t) => t.id === value);
    let next = -1;
    if (e.key === "ArrowRight") next = (i + 1) % items.length;
    if (e.key === "ArrowLeft") next = (i - 1 + items.length) % items.length;
    if (e.key === "Home") next = 0;
    if (e.key === "End") next = items.length - 1;
    if (next >= 0) {
      e.preventDefault();
      onChange(items[next].id);
      refs.current[next]?.focus();
    }
  }

  return (
    <div
      role="tablist"
      onKeyDown={onKeyDown}
      className={cn(
        "flex gap-1 overflow-x-auto border-b border-line",
        "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        className,
      )}
    >
      {items.map((tab, i) => {
        const active = tab.id === value;
        return (
          <button
            key={tab.id}
            ref={(el) => {
              refs.current[i] = el;
            }}
            role="tab"
            id={`tab-${tab.id}`}
            aria-selected={active}
            aria-controls={`panel-${tab.id}`}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(tab.id)}
            className={cn(
              "relative shrink-0 px-3 py-2.5 text-[13px] font-medium transition-colors",
              "after:absolute after:inset-x-2 after:-bottom-px after:h-0.5 after:rounded-full",
              active
                ? "text-fg after:bg-accent"
                : "text-muted hover:text-fg after:bg-transparent",
            )}
          >
            {tab.label}
            {typeof tab.count === "number" && (
              <span
                className={cn(
                  "ml-1.5 rounded-full px-1.5 py-0.5 text-[11px] tnum",
                  active ? "bg-accent-soft text-accent-text" : "bg-surface-2 text-subtle",
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export function TabPanel({
  id,
  active,
  children,
  className,
}: {
  id: string;
  active: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  if (!active) return null;
  return (
    // tabIndex 0 keeps the panel reachable when its content scrolls; the
    // global focus ring stays visible rather than being suppressed.
    <div
      role="tabpanel"
      id={`panel-${id}`}
      aria-labelledby={`tab-${id}`}
      tabIndex={0}
      className={className}
    >
      {children}
    </div>
  );
}
