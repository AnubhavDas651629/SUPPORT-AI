import { Section, Tag } from "./Section";

const STEPS = [
  {
    n: "1",
    name: "Understand",
    summary: "Classify the request and load who is asking.",
    points: [
      "A routing model picks the specialist and returns a confidence score",
      "Conversation history is carried forward, compressed once it gets long",
      "Customer identity and account context attach to the thread",
    ],
    io: { in: "raw message", out: "route · confidence · context" },
  },
  {
    n: "2",
    name: "Retrieve",
    summary: "Find evidence in your own documentation.",
    points: [
      "Documents are chunked and embedded on upload",
      "Cosine similarity search over pgvector returns the closest passages",
      "Every passage stays attached to the answer as a citation",
    ],
    io: { in: "question", out: "ranked passages" },
  },
  {
    n: "3",
    name: "Act",
    summary: "Read or change the underlying record.",
    points: [
      "Calls your APIs with scoped, organization-level credentials",
      "Results feed back into the answer rather than being described",
      "Every call is recorded on the conversation",
    ],
    io: { in: "intent", out: "API result" },
  },
  {
    n: "4",
    name: "Resolve",
    summary: "Answer, or hand over cleanly.",
    points: [
      "Routine requests close without a human",
      "Edge cases become an escalation with the full trail attached",
      "Priority sets the SLA clock; webhooks notify your systems",
    ],
    io: { in: "grounded answer", out: "reply or escalation" },
  },
];

export function HowItWorks() {
  return (
    <Section
      id="how"
      index="02"
      eyebrow="How Support-AI works"
      title="Four steps, in the same order, every time."
      lede="Not a black box. Each stage produces something you can inspect — a route, a set of citations, an API response, a resolution."
    >
      <div className="grid gap-px overflow-hidden rounded-panel border border-line bg-line md:grid-cols-2 xl:grid-cols-4">
        {STEPS.map((step) => (
          <article key={step.n} className="flex flex-col bg-bg p-5 sm:p-6">
            <div className="flex items-center gap-2.5">
              <span className="flex size-6 items-center justify-center rounded-full bg-fg font-code text-[11px] font-medium text-bg">
                {step.n}
              </span>
              <h3 className="text-[15px] font-semibold tracking-[-0.01em] text-fg">
                {step.name}
              </h3>
            </div>

            <p className="mt-3 text-[13.5px] leading-relaxed text-muted">
              {step.summary}
            </p>

            <ul className="mt-4 flex-1 space-y-2">
              {step.points.map((point) => (
                <li key={point} className="flex gap-2 text-[13px] leading-relaxed text-muted">
                  <span
                    className="mt-[7px] size-1 shrink-0 rounded-full bg-accent"
                    aria-hidden="true"
                  />
                  {point}
                </li>
              ))}
            </ul>

            <div className="mt-5 flex flex-wrap items-center gap-1.5 border-t border-line pt-4">
              <Tag>{step.io.in}</Tag>
              <span className="font-code text-[11px] text-subtle" aria-hidden="true">
                →
              </span>
              <Tag className="border-accent-line bg-accent-soft text-accent-text">
                {step.io.out}
              </Tag>
            </div>
          </article>
        ))}
      </div>
    </Section>
  );
}
