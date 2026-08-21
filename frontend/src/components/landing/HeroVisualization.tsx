"use client";

import { CheckCircle2, CornerDownRight, FileText, Route } from "lucide-react";

const SOURCES = [
  { title: "refund-policy.pdf", detail: "§ 4.2 — Prorated refunds", match: 94 },
  { title: "billing-faq.md", detail: "Mid-cycle plan changes", match: 88 },
  { title: "terms-of-service.pdf", detail: "§ 11 — Cancellations", match: 71 },
];

export function HeroVisualization() {
  return (
    <div
      id="product-preview"
      className="scroll-mt-24 rounded-xl border border-white/[0.08] bg-[#060B18]"
    >
      {/* Chrome */}
      <div className="flex items-center justify-between gap-4 border-b border-white/[0.07] px-4 py-3 sm:px-5">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400/80" />
          <span className="truncate text-[13px] font-medium text-slate-200">
            Conversation #4821
          </span>
          <span className="hidden text-[12px] text-slate-500 sm:inline">
            Acme Corp · Billing knowledge base
          </span>
        </div>
        <span className="shrink-0 text-[11px] tabular-nums text-slate-500">
          1.9s · 1,204 tokens
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5">
        {/* Thread */}
        <div className="space-y-5 p-5 sm:p-6 lg:col-span-3">
          <div className="space-y-1.5">
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">
              Customer
            </p>
            <p className="text-[14px] leading-relaxed text-slate-300">
              I upgraded to Pro four days ago but I&apos;m being charged the
              Enterprise rate. Can I get the difference back?
            </p>
          </div>

          <div className="space-y-2 border-l border-fuchsia-500/25 pl-4">
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-fuchsia-300/70">
              Support AI · Billing specialist
            </p>
            <p className="text-[14px] leading-relaxed text-slate-200">
              You were billed on the Enterprise price ID during the upgrade
              window. Our policy prorates any mid-cycle change
              <sup className="ml-0.5 text-[10px] text-fuchsia-300/80">1</sup>, so
              the $180 difference is refundable to your original payment method
              within five business days
              <sup className="ml-0.5 text-[10px] text-fuchsia-300/80">2</sup>.
              I&apos;ve issued it — no action needed on your end.
            </p>
            <p className="flex items-center gap-1.5 pt-1 text-[12px] text-emerald-400/90">
              <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={2} />
              Resolved without a human agent
            </p>
          </div>
        </div>

        {/* Decision panel */}
        <div className="border-t border-white/[0.07] p-5 sm:p-6 lg:col-span-2 lg:border-l lg:border-t-0">
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">
            Retrieved context
          </p>
          <ul className="mt-3 space-y-2.5">
            {SOURCES.map((s) => (
              <li key={s.title} className="flex items-start gap-2.5">
                <FileText
                  className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-600"
                  strokeWidth={1.75}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12.5px] text-slate-300">{s.title}</p>
                  <p className="truncate text-[11.5px] text-slate-500">{s.detail}</p>
                </div>
                <span className="shrink-0 text-[11px] tabular-nums text-slate-500">
                  {s.match}%
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-5 space-y-2.5 border-t border-white/[0.07] pt-4">
            <div className="flex items-center gap-2 text-[12.5px]">
              <Route className="h-3.5 w-3.5 shrink-0 text-slate-600" strokeWidth={1.75} />
              <span className="text-slate-500">Routed</span>
              <span className="ml-auto font-medium text-slate-300">BILLING</span>
            </div>
            <div className="flex items-center gap-2 text-[12.5px]">
              <CornerDownRight
                className="h-3.5 w-3.5 shrink-0 text-slate-600"
                strokeWidth={1.75}
              />
              <span className="text-slate-500">Escalation check</span>
              <span className="ml-auto font-medium text-slate-300">ANSWER</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
