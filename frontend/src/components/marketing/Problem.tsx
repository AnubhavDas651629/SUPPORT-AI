import { Section } from "./Section";

const HANDOFFS = [
  { actor: "Customer", text: "\"My March invoice looks wrong.\"", wait: null },
  { actor: "Tier 1", text: "\"Can you send a screenshot and your account email?\"", wait: "4h" },
  { actor: "Customer", text: "Sends screenshot.", wait: "9h" },
  { actor: "Tier 1", text: "\"Escalating to billing — they'll follow up.\"", wait: "6h" },
  { actor: "Billing", text: "Opens Stripe, finds a duplicate charge, refunds it.", wait: "18h" },
];

export function Problem() {
  return (
    <Section
      id="problem"
      index="01"
      eyebrow="The problem"
      title="Most support time is spent gathering context, not solving problems."
      lede="The answer usually exists — in a policy doc, a database row, or an internal API. What costs a day and a half is the relay between the person asking and the systems that know."
    >
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-14">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-subtle">
            One duplicate charge · 37 hours
          </p>
          <ol className="mt-5">
            {HANDOFFS.map((item, i) => (
              <li key={i} className="relative flex gap-4 pb-6 last:pb-0">
                {i < HANDOFFS.length - 1 && (
                  <span
                    className="absolute left-[3px] top-3 h-full w-px bg-line"
                    aria-hidden="true"
                  />
                )}
                <span
                  className="relative z-10 mt-1.5 size-[7px] shrink-0 rounded-full bg-line-strong"
                  aria-hidden="true"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-[12px] font-medium text-fg">{item.actor}</span>
                    {item.wait && (
                      <span className="font-mono text-[11px] text-danger">
                        +{item.wait} waiting
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-[13.5px] leading-relaxed text-muted">
                    {item.text}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <div className="space-y-6 border-t border-line pt-8 lg:border-l lg:border-t-0 lg:pl-14 lg:pt-0">
          {[
            {
              heading: "Knowledge is stranded in documents",
              body: "Policies live in a wiki, a PDF and someone's head. A search box that returns ten links is not an answer.",
            },
            {
              heading: "Context lives in another system",
              body: "The agent needs the customer's plan, their last three orders, their open invoices — each behind a different login.",
            },
            {
              heading: "Nothing can act",
              body: "Even when the answer is obvious, a chatbot can only describe the fix. A human still has to click the button.",
            },
            {
              heading: "Escalations lose the thread",
              body: "By the time it reaches the specialist, the reasoning is gone and the customer repeats themselves.",
            },
          ].map((item) => (
            <div key={item.heading}>
              <h3 className="text-[15px] font-medium tracking-[-0.01em] text-fg">
                {item.heading}
              </h3>
              <p className="mt-1.5 text-[13.5px] leading-relaxed text-muted">
                {item.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}
