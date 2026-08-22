"use client";

import { Section } from "./Section";
import { TrendChart } from "@/components/charts/TrendChart";
import { BarList } from "@/components/charts/BarList";
import { SERIES, ordinalVar } from "@/components/charts/palette";

/** Illustrative shape of a fortnight's traffic — labelled as such below. */
const VOLUME = [
  { d: "Mar 3", conversations: 148, escalations: 21 },
  { d: "Mar 4", conversations: 162, escalations: 19 },
  { d: "Mar 5", conversations: 155, escalations: 24 },
  { d: "Mar 6", conversations: 171, escalations: 18 },
  { d: "Mar 7", conversations: 139, escalations: 15 },
  { d: "Mar 8", conversations: 84, escalations: 9 },
  { d: "Mar 9", conversations: 71, escalations: 7 },
  { d: "Mar 10", conversations: 178, escalations: 17 },
  { d: "Mar 11", conversations: 186, escalations: 16 },
  { d: "Mar 12", conversations: 194, escalations: 14 },
  { d: "Mar 13", conversations: 188, escalations: 12 },
  { d: "Mar 14", conversations: 201, escalations: 13 },
];

const CATEGORIES = [
  { label: "Billing & refunds", value: 412, color: ordinalVar(4) },
  { label: "Order status", value: 337, color: ordinalVar(3) },
  { label: "Account & access", value: 208, color: ordinalVar(2) },
  { label: "Technical issues", value: 156, color: ordinalVar(1) },
];

const HEADLINES = [
  { label: "Resolved without a human", value: "91.4%" },
  { label: "Median first response", value: "6s" },
  { label: "Escalations breaching SLA", value: "1.2%" },
];

export function AnalyticsSection() {
  return (
    <Section
      id="analytics"
      index="07"
      eyebrow="Analytics"
      title="Whether it's working is a number, not a feeling."
      lede="Volume, deflection, escalation rate and time-to-resolution — the four figures that tell you whether automation is holding, and where it isn't."
    >
      <div className="grid gap-px overflow-hidden rounded-panel border border-line bg-line lg:grid-cols-3">
        {HEADLINES.map((item) => (
          <div key={item.label} className="bg-bg px-5 py-5">
            <p className="text-[12.5px] text-muted">{item.label}</p>
            <p className="mt-1.5 text-[28px] font-semibold leading-none tracking-[-0.02em] text-fg tnum">
              {item.value}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <figure className="overflow-hidden rounded-panel border border-line bg-surface">
          <figcaption className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-line px-4 py-3 sm:px-5">
            <span className="text-[13px] font-medium text-fg">
              Conversations vs escalations
            </span>
            <span className="flex items-center gap-1.5 text-[12px] text-muted">
              <span
                className="size-2 rounded-[2px]"
                style={{ background: SERIES.primary }}
                aria-hidden="true"
              />
              Conversations
            </span>
            <span className="flex items-center gap-1.5 text-[12px] text-muted">
              <span
                className="size-2 rounded-[2px]"
                style={{ background: SERIES.secondary }}
                aria-hidden="true"
              />
              Escalations
            </span>
          </figcaption>
          <div className="p-4 sm:p-5">
            <TrendChart
              height={210}
              points={VOLUME.map((v) => ({
                label: v.d,
                values: { conversations: v.conversations, escalations: v.escalations },
              }))}
              series={[
                { key: "conversations", label: "Conversations", color: SERIES.primary, fill: true },
                { key: "escalations", label: "Escalations", color: SERIES.secondary },
              ]}
            />
          </div>
        </figure>

        <figure className="overflow-hidden rounded-panel border border-line bg-surface">
          <figcaption className="border-b border-line px-4 py-3 text-[13px] font-medium text-fg sm:px-5">
            What people ask about
          </figcaption>
          <div className="p-4 sm:p-5">
            <BarList items={CATEGORIES} />
          </div>
        </figure>
      </div>

      <p className="mt-4 text-[12.5px] text-subtle">
        Figures shown are illustrative. Your dashboard computes the same metrics from
        your own conversations and escalations.
      </p>
    </Section>
  );
}
