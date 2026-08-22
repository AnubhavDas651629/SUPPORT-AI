"use client";

import * as React from "react";
import { useElementWidth } from "@/lib/hooks/useElementWidth";
import { cn } from "@/lib/utils";

export interface TrendSeries {
  key: string;
  label: string;
  color: string;
  /** Filled area under the line. Only ever set on a single-series chart. */
  fill?: boolean;
}

export interface TrendPoint {
  label: string;
  values: Record<string, number>;
}

/**
 * Line / area chart with a crosshair + tooltip. Single y-axis by design —
 * two measures of different scale belong in two charts.
 */
export function TrendChart({
  points,
  series,
  height = 200,
  formatValue = (v: number) => v.toLocaleString(),
  className,
}: {
  points: TrendPoint[];
  series: TrendSeries[];
  height?: number;
  formatValue?: (v: number) => string;
  className?: string;
}) {
  const { ref, width } = useElementWidth<HTMLDivElement>(680);
  const [hover, setHover] = React.useState<number | null>(null);

  const pad = { top: 12, right: 12, bottom: 24, left: 38 };
  const innerW = Math.max(width - pad.left - pad.right, 10);
  const innerH = height - pad.top - pad.bottom;

  const allValues = points.flatMap((p) => series.map((s) => p.values[s.key] ?? 0));
  const rawMax = Math.max(...allValues, 1);
  const max = niceCeil(rawMax);
  const ticks = [0, max / 2, max];

  const x = (i: number) =>
    points.length <= 1 ? innerW / 2 : (i / (points.length - 1)) * innerW;
  const y = (v: number) => innerH - (v / max) * innerH;

  function linePath(key: string) {
    return points
      .map((p, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(2)},${y(p.values[key] ?? 0).toFixed(2)}`)
      .join(" ");
  }

  function areaPath(key: string) {
    if (points.length === 0) return "";
    return `${linePath(key)} L${x(points.length - 1).toFixed(2)},${innerH} L${x(0).toFixed(2)},${innerH} Z`;
  }

  // Label every point when they fit, otherwise thin them out evenly.
  const labelEvery = Math.max(1, Math.ceil(points.length / Math.max(2, Math.floor(innerW / 68))));

  function pointerToIndex(clientX: number, rect: DOMRect) {
    const rel = clientX - rect.left - pad.left;
    const step = points.length <= 1 ? innerW : innerW / (points.length - 1);
    return Math.min(points.length - 1, Math.max(0, Math.round(rel / step)));
  }

  const active = hover != null ? points[hover] : null;

  return (
    <div ref={ref} className={cn("relative w-full", className)}>
      <svg
        width={width}
        height={height}
        role="img"
        aria-label={`${series.map((s) => s.label).join(" and ")} over ${points.length} periods`}
        className="block touch-pan-y"
        onMouseMove={(e) =>
          setHover(pointerToIndex(e.clientX, e.currentTarget.getBoundingClientRect()))
        }
        onMouseLeave={() => setHover(null)}
      >
        <g transform={`translate(${pad.left},${pad.top})`}>
          {/* Recessive gridlines + y labels */}
          {ticks.map((t) => (
            <g key={t}>
              <line
                x1={0}
                x2={innerW}
                y1={y(t)}
                y2={y(t)}
                stroke="var(--chart-grid)"
                strokeWidth={1}
              />
              <text
                x={-8}
                y={y(t)}
                dy="0.32em"
                textAnchor="end"
                className="fill-[var(--fg-subtle)] text-[10px] tnum"
              >
                {formatCompact(t)}
              </text>
            </g>
          ))}

          {series.map((s) => (
            <g key={s.key}>
              {s.fill && (
                <>
                  <defs>
                    <linearGradient id={`grad-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={s.color} stopOpacity="0.18" />
                      <stop offset="100%" stopColor={s.color} stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path d={areaPath(s.key)} fill={`url(#grad-${s.key})`} />
                </>
              )}
              <path
                d={linePath(s.key)}
                fill="none"
                stroke={s.color}
                strokeWidth={2}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            </g>
          ))}

          {/* Crosshair */}
          {hover != null && (
            <g>
              <line
                x1={x(hover)}
                x2={x(hover)}
                y1={0}
                y2={innerH}
                stroke="var(--line-strong)"
                strokeWidth={1}
                strokeDasharray="3 3"
              />
              {series.map((s) => (
                <circle
                  key={s.key}
                  cx={x(hover)}
                  cy={y(points[hover].values[s.key] ?? 0)}
                  r={4}
                  fill={s.color}
                  stroke="var(--surface)"
                  strokeWidth={2}
                />
              ))}
            </g>
          )}

          {/* x labels */}
          {points.map((p, i) =>
            i % labelEvery === 0 || i === points.length - 1 ? (
              <text
                key={p.label + i}
                x={x(i)}
                y={innerH + 16}
                textAnchor={i === 0 ? "start" : i === points.length - 1 ? "end" : "middle"}
                className="fill-[var(--fg-subtle)] text-[10px]"
              >
                {p.label}
              </text>
            ) : null,
          )}
        </g>
      </svg>

      {active && hover != null && (
        <div
          className="pointer-events-none absolute z-10 min-w-32 -translate-x-1/2 rounded-control border border-line bg-surface px-2.5 py-2 text-[12px] shadow-lg"
          style={{
            left: Math.min(Math.max(pad.left + x(hover), 64), width - 64),
            top: 4,
          }}
        >
          <p className="font-medium text-fg">{active.label}</p>
          {series.map((s) => (
            <p key={s.key} className="mt-1 flex items-center gap-1.5 text-muted">
              <span
                className="size-1.5 rounded-[1px]"
                style={{ background: s.color }}
                aria-hidden="true"
              />
              {s.label}
              <span className="ml-auto pl-3 tnum font-medium text-fg">
                {formatValue(active.values[s.key] ?? 0)}
              </span>
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

function niceCeil(n: number) {
  if (n <= 5) return 5;
  const mag = 10 ** Math.floor(Math.log10(n));
  return Math.ceil(n / mag) * mag;
}

function formatCompact(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k`;
  return String(Math.round(n));
}
