"use client";

import * as React from "react";
import { Table as TableIcon, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Table, TableWrap, Td, Th, Tr } from "@/components/ui/Table";

export interface SeriesMeta {
  key: string;
  label: string;
  color: string;
}

/**
 * Wraps a chart with its title, legend and an equivalent table view.
 * The table is the accessible fallback: identity is never colour-only.
 */
export function ChartFrame({
  title,
  description,
  series,
  rows,
  rowHeader = "Period",
  formatValue = (v: number) => v.toLocaleString(),
  action,
  children,
  className,
}: {
  title: string;
  description?: string;
  series: SeriesMeta[];
  /** Same data the chart draws, for the table view. */
  rows: { label: string; values: Record<string, number> }[];
  rowHeader?: string;
  formatValue?: (value: number) => string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  const [view, setView] = React.useState<"chart" | "table">("chart");

  return (
    <section
      className={cn(
        "bg-surface border border-line rounded-panel overflow-hidden",
        className,
      )}
      aria-label={title}
    >
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-4 py-3 sm:px-5">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-fg">{title}</h2>
          {description && (
            <p className="mt-0.5 text-[12.5px] text-muted">{description}</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          {action}
          <div
            className="flex items-center rounded-control border border-line p-0.5"
            role="group"
            aria-label={`${title} view`}
          >
            <button
              onClick={() => setView("chart")}
              aria-pressed={view === "chart"}
              aria-label="Chart view"
              title="Chart view"
              className={cn(
                "rounded-[4px] p-1.5 transition-colors",
                view === "chart"
                  ? "bg-surface-2 text-fg"
                  : "text-subtle hover:text-fg",
              )}
            >
              <BarChart3 className="size-3.5" />
            </button>
            <button
              onClick={() => setView("table")}
              aria-pressed={view === "table"}
              aria-label="Table view"
              title="Table view"
              className={cn(
                "rounded-[4px] p-1.5 transition-colors",
                view === "table"
                  ? "bg-surface-2 text-fg"
                  : "text-subtle hover:text-fg",
              )}
            >
              <TableIcon className="size-3.5" />
            </button>
          </div>
        </div>
      </header>

      {series.length > 1 && view === "chart" && (
        <div className="flex flex-wrap items-center gap-4 px-4 pt-3 sm:px-5">
          {series.map((s) => (
            <span key={s.key} className="flex items-center gap-1.5 text-[12px] text-muted">
              <span
                className="size-2 rounded-[2px]"
                style={{ background: s.color }}
                aria-hidden="true"
              />
              {s.label}
            </span>
          ))}
        </div>
      )}

      {view === "chart" ? (
        <div className="p-4 sm:p-5">{children}</div>
      ) : (
        <TableWrap>
          <Table>
            <thead>
              <tr>
                <Th>{rowHeader}</Th>
                {series.map((s) => (
                  <Th key={s.key} className="text-right">
                    {s.label}
                  </Th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <Tr key={row.label}>
                  <Td className="text-[13px] text-muted whitespace-nowrap">{row.label}</Td>
                  {series.map((s) => (
                    <Td key={s.key} className="text-right text-[13px] tnum text-fg">
                      {formatValue(row.values[s.key] ?? 0)}
                    </Td>
                  ))}
                </Tr>
              ))}
            </tbody>
          </Table>
        </TableWrap>
      )}
    </section>
  );
}
