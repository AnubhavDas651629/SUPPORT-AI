"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface MenuItemDef {
  label: string;
  onSelect: () => void;
  icon?: React.ComponentType<{ className?: string }>;
  destructive?: boolean;
  disabled?: boolean;
}

/**
 * Lightweight dropdown. Closes on outside click, Escape, or selection;
 * first item receives focus when opened via keyboard.
 */
export function Menu({
  trigger,
  items,
  align = "end",
  label,
}: {
  trigger: React.ReactNode;
  items: MenuItemDef[];
  align?: "start" | "end";
  label: string;
}) {
  const [open, setOpen] = React.useState(false);
  const rootRef = React.useRef<HTMLDivElement>(null);
  const listRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    function onDocDown(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function onListKeyDown(e: React.KeyboardEvent) {
    const buttons = Array.from(
      listRef.current?.querySelectorAll<HTMLButtonElement>("button:not(:disabled)") ?? [],
    );
    const i = buttons.indexOf(document.activeElement as HTMLButtonElement);
    if (e.key === "ArrowDown") {
      e.preventDefault();
      buttons[(i + 1) % buttons.length]?.focus();
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      buttons[(i - 1 + buttons.length) % buttons.length]?.focus();
    }
  }

  return (
    <div ref={rootRef} className="relative">
      {/* The menu's ARIA state has to live on the real trigger control — a
          wrapper <span> carries no role, so aria-haspopup there is invalid. */}
      {React.isValidElement(trigger)
        ? React.cloneElement(trigger as React.ReactElement<Record<string, unknown>>, {
            onClick: () => setOpen((v) => !v),
            "aria-haspopup": "menu",
            "aria-expanded": open,
          })
        : trigger}
      {open && (
        <div
          ref={listRef}
          role="menu"
          aria-label={label}
          onKeyDown={onListKeyDown}
          className={cn(
            "absolute z-50 mt-1.5 min-w-48 rounded-panel border border-line bg-surface p-1 shadow-lg",
            "animate-scale-in",
            align === "end" ? "right-0" : "left-0",
          )}
        >
          {items.map((item) => (
            <button
              key={item.label}
              role="menuitem"
              disabled={item.disabled}
              onClick={() => {
                setOpen(false);
                item.onSelect();
              }}
              className={cn(
                "flex w-full items-center gap-2 rounded-[5px] px-2.5 py-1.5 text-left text-[13px]",
                "transition-colors disabled:opacity-40 disabled:pointer-events-none",
                item.destructive
                  ? "text-danger hover:bg-danger-soft"
                  : "text-fg hover:bg-surface-2",
              )}
            >
              {item.icon && <item.icon className="size-3.5 shrink-0 opacity-70" />}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
