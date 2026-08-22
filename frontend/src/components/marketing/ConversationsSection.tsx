import { Section } from "./Section";

const THREAD = [
  { role: "customer", text: "Hi — order #A-4471 was supposed to arrive Tuesday. Still nothing." },
  {
    role: "ai",
    text: "I can see order A-4471 shipped on 2 March and is currently held at the Rotterdam depot with a customs exception. I've requested a re-scan and set a delivery alert on your account.",
    cited: "shipping-exceptions.md",
  },
  { role: "customer", text: "Can I just get it refunded instead?" },
  {
    role: "ai",
    text: "Refunds for in-transit orders need a human to approve. I've escalated this to the logistics team with the full history — you'll hear back within 4 hours.",
    escalated: true,
  },
];

const CONTEXT = [
  { label: "Customer", value: "Priya Raman" },
  { label: "Plan", value: "Scale · 48 seats" },
  { label: "Lifetime value", value: "$28,800" },
  { label: "Open orders", value: "2" },
  { label: "Past escalations", value: "1 in 90 days" },
];

export function ConversationsSection() {
  return (
    <Section
      id="conversations"
      index="05"
      eyebrow="Conversations & customer context"
      title="The agent knows who it's talking to before it answers."
      lede="Conversations carry the customer's account, history and entitlements alongside the message. Context is what separates a useful answer from a plausible one."
    >
      <div className="grid gap-px overflow-hidden rounded-panel border border-line bg-line lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        {/* Thread */}
        <div className="bg-surface p-4 sm:p-6">
          <div className="flex items-center justify-between gap-3 border-b border-line pb-3">
            <span className="text-[13px] font-medium text-fg">
              Order delayed — A-4471
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-warning/25 bg-warning-soft px-2 py-0.5 text-[11px] font-medium text-warning">
              <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
              Escalated
            </span>
          </div>

          <ol className="mt-4 space-y-4">
            {THREAD.map((message, i) => (
              <li
                key={i}
                className={message.role === "ai" ? "flex justify-end" : "flex justify-start"}
              >
                <div
                  className={
                    message.role === "ai"
                      ? "max-w-[85%] rounded-panel rounded-br-sm border border-accent-line bg-accent-soft px-3.5 py-2.5"
                      : "max-w-[85%] rounded-panel rounded-bl-sm border border-line bg-surface-2 px-3.5 py-2.5"
                  }
                >
                  <p className="text-[11px] uppercase tracking-[0.08em] text-subtle">
                    {message.role === "ai" ? "Support-AI" : "Customer"}
                  </p>
                  <p className="mt-1 text-[13.5px] leading-relaxed text-fg">
                    {message.text}
                  </p>
                  {message.cited && (
                    <p className="mt-2 font-mono text-[10.5px] text-subtle">
                      cited {message.cited}
                    </p>
                  )}
                  {message.escalated && (
                    <p className="mt-2 font-mono text-[10.5px] text-warning">
                      → escalation created · priority HIGH
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </div>

        {/* Context rail */}
        <aside className="bg-bg-inset p-4 sm:p-6">
          <p className="font-mono text-[10.5px] uppercase tracking-[0.1em] text-subtle">
            Context loaded
          </p>
          <dl className="mt-3 divide-y divide-line">
            {CONTEXT.map((item) => (
              <div key={item.label} className="flex items-baseline justify-between gap-3 py-2.5">
                <dt className="text-[12.5px] text-muted">{item.label}</dt>
                <dd className="text-right text-[12.5px] font-medium text-fg">
                  {item.value}
                </dd>
              </div>
            ))}
          </dl>
          <p className="mt-4 text-[12.5px] leading-relaxed text-muted">
            Every reply, status change and internal note is written to an immutable
            event log on the escalation.
          </p>
        </aside>
      </div>
    </Section>
  );
}
