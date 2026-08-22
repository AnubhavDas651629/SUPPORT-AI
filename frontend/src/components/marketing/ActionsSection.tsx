import { Section } from "./Section";

const CALLS = [
  {
    verb: "GET",
    path: "/v1/orders/A-4471",
    purpose: "Read the order before answering",
    result: "status: in_transit · exception: customs",
    ok: true,
  },
  {
    verb: "POST",
    path: "/v1/refunds",
    purpose: "Issue a refund inside policy limits",
    result: "blocked · requires human approval over $500",
    ok: false,
  },
  {
    verb: "PATCH",
    path: "/v1/subscriptions/sub_92f",
    purpose: "Change a plan on request",
    result: "plan: growth → scale",
    ok: true,
  },
];

const EVENTS = [
  "ticket.created",
  "ticket.assigned",
  "ticket.resolved",
  "conversation.created",
  "message.created",
  "feedback.submitted",
];

export function ActionsSection() {
  return (
    <Section
      id="actions"
      index="06"
      eyebrow="Actions & integrations"
      title="Answering is table stakes. Doing is the product."
      lede="Support-AI calls your business APIs to inspect and change real records — inside limits you define. When an action is out of bounds, it stops and escalates rather than improvising."
    >
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:gap-12">
        <div className="overflow-hidden rounded-panel border border-line bg-surface">
          <div className="border-b border-line px-4 py-2.5 sm:px-5">
            <p className="font-mono text-[10.5px] uppercase tracking-[0.1em] text-subtle">
              Tool calls on one conversation
            </p>
          </div>
          <ul>
            {CALLS.map((call) => (
              <li
                key={call.path}
                className="border-b border-line px-4 py-4 last:border-b-0 sm:px-5"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded px-1.5 py-0.5 font-mono text-[10.5px] font-medium ${
                      call.verb === "GET"
                        ? "bg-info-soft text-info"
                        : "bg-accent-soft text-accent"
                    }`}
                  >
                    {call.verb}
                  </span>
                  <code className="font-mono text-[12.5px] text-fg">{call.path}</code>
                </div>
                <p className="mt-1.5 text-[12.5px] text-muted">{call.purpose}</p>
                <p
                  className={`mt-1.5 font-mono text-[11.5px] ${
                    call.ok ? "text-success" : "text-warning"
                  }`}
                >
                  → {call.result}
                </p>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-[15px] font-medium tracking-[-0.01em] text-fg">
            Your systems find out immediately
          </h3>
          <p className="mt-2 text-[13.5px] leading-relaxed text-muted">
            Outbound webhooks fire on every meaningful state change, signed with
            HMAC-SHA256 so you can verify they came from Support-AI. Each attempt is
            recorded with its status code, duration and retry count.
          </p>

          <ul className="mt-5 flex flex-wrap gap-1.5">
            {EVENTS.map((event) => (
              <li
                key={event}
                className="rounded border border-line bg-surface-2 px-2 py-1 font-mono text-[11.5px] text-muted"
              >
                {event}
              </li>
            ))}
          </ul>

          <div className="mt-6 overflow-hidden rounded-panel border border-line bg-bg-inset">
            <div className="border-b border-line px-3 py-2">
              <p className="font-mono text-[10.5px] text-subtle">
                x-supportai-signature
              </p>
            </div>
            <pre className="overflow-x-auto px-3 py-3 font-mono text-[11.5px] leading-relaxed text-muted">
{`sha256=9f2b1c...e04a
timestamp=1755840000`}
            </pre>
          </div>
        </div>
      </div>
    </Section>
  );
}
