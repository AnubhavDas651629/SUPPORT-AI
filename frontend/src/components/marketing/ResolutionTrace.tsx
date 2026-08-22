import { cn } from "@/lib/utils";

/**
 * The hero's product visual: one real request walking the four-step loop.
 *
 * Deliberately a trace, not a mock dashboard — it shows what the system
 * actually did (route, retrieve, call, reply) rather than decorative metrics.
 */

interface TraceStep {
  step: string;
  title: string;
  detail: string;
  meta?: string;
}

const STEPS: TraceStep[] = [
  {
    step: "understand",
    title: "Routed to Billing Agent",
    detail: "Classified as a duplicate-charge dispute",
    meta: "confidence 0.94",
  },
  {
    step: "retrieve",
    title: "3 passages from your knowledge base",
    detail: "billing-policy.md · refunds-sop.pdf",
    meta: "cosine 0.88",
  },
  {
    step: "act",
    title: "GET /v1/charges?customer=cus_8Fq2",
    detail: "2 charges found — one duplicate on 3 Mar",
    meta: "212 ms",
  },
  {
    step: "resolve",
    title: "Refund issued, customer notified",
    detail: "No human touched this conversation",
    meta: "resolved",
  },
];

export function ResolutionTrace() {
  return (
    <figure className="relative">
      <div className="overflow-hidden rounded-panel border border-line bg-surface shadow-[0_1px_2px_rgba(0,0,0,0.04),0_12px_40px_-12px_rgba(0,0,0,0.12)]">
        {/* Window chrome */}
        <div className="flex items-center gap-2 border-b border-line bg-surface-2/60 px-4 py-2.5">
          <span className="flex gap-1.5" aria-hidden="true">
            <span className="size-2 rounded-full bg-line-strong" />
            <span className="size-2 rounded-full bg-line-strong" />
            <span className="size-2 rounded-full bg-line-strong" />
          </span>
          <span className="ml-1 font-code text-[11px] text-subtle">
            conversation_4821
          </span>
          <span className="ml-auto inline-flex items-center gap-1.5 font-code text-[10.5px] text-success">
            <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
            live
          </span>
        </div>

        {/* Inbound message */}
        <div className="border-b border-line px-4 py-4 sm:px-5">
          <p className="text-[11px] uppercase tracking-[0.08em] text-subtle">Customer</p>
          <p className="mt-1.5 text-[14px] leading-relaxed text-fg">
            &ldquo;I think I was charged twice for my March invoice. Can you check?&rdquo;
          </p>
        </div>

        {/* The loop */}
        <ol className="px-4 py-4 sm:px-5">
          {STEPS.map((item, i) => (
            <li
              key={item.step}
              className="relative flex animate-fade-up gap-3.5 pb-5 last:pb-0"
              style={{ animationDelay: `${320 + i * 130}ms` }}
            >
              {i < STEPS.length - 1 && (
                <span
                  className="absolute left-[7px] top-4 h-full w-px bg-line"
                  aria-hidden="true"
                />
              )}
              <span
                className={cn(
                  "relative z-10 mt-1 size-3.5 shrink-0 rounded-full border-2 bg-surface",
                  i === STEPS.length - 1 ? "border-success" : "border-accent",
                )}
                aria-hidden="true"
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                  <span className="font-code text-[10.5px] uppercase tracking-[0.1em] text-subtle">
                    {item.step}
                  </span>
                  {item.meta && (
                    <span className="font-code text-[10.5px] text-subtle">
                      {item.meta}
                    </span>
                  )}
                </div>
                <p className="mt-0.5 truncate text-[13.5px] font-medium text-fg">
                  {item.title}
                </p>
                <p className="mt-0.5 text-[12.5px] leading-relaxed text-muted">
                  {item.detail}
                </p>
              </div>
            </li>
          ))}
        </ol>

        {/* Outbound reply */}
        <div
          className="animate-fade-up border-t border-line bg-bg-inset px-4 py-4 sm:px-5"
          style={{ animationDelay: "880ms" }}
        >
          <p className="text-[11px] uppercase tracking-[0.08em] text-subtle">Support-AI</p>
          <p className="mt-1.5 text-[14px] leading-relaxed text-fg">
            You were charged twice on 3 March. I&rsquo;ve refunded the duplicate
            &mdash; $49.00 back to your card in 5&ndash;10 days.
          </p>
          <p className="mt-2.5 font-code text-[10.5px] text-subtle">
            cited billing-policy.md · refunds-sop.pdf
          </p>
        </div>
      </div>

      <figcaption className="mt-3 text-center text-[12px] text-subtle">
        An illustrative trace of the four steps every request runs.
      </figcaption>
    </figure>
  );
}
