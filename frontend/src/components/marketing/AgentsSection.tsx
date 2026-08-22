import { Section } from "./Section";
import { AGENTS } from "@/lib/agents";

export function AgentsSection() {
  return (
    <Section
      id="agents"
      index="03"
      eyebrow="Specialist agents"
      title="One router. Three specialists. No generalist guessing."
      lede="Incoming messages are classified before they are answered, so a refund question gets a billing specialist with billing boundaries — not a generic assistant improvising policy."
    >
      {/* The routing decision, drawn as a fan-out */}
      <div className="overflow-hidden rounded-panel border border-line bg-surface">
        <div className="grid lg:grid-cols-[minmax(0,0.85fr)_minmax(0,2fr)]">
          <div className="border-b border-line p-5 sm:p-6 lg:border-b-0 lg:border-r">
            <p className="font-mono text-[10.5px] uppercase tracking-[0.1em] text-subtle">
              Inbound
            </p>
            <p className="mt-2.5 text-[14px] leading-relaxed text-fg">
              &ldquo;The refund you promised last week still hasn&rsquo;t landed.&rdquo;
            </p>
            <div className="mt-5 rounded-control border border-line bg-bg-inset p-3">
              <p className="font-mono text-[10.5px] uppercase tracking-[0.1em] text-subtle">
                Router
              </p>
              <p className="mt-1.5 font-mono text-[12px] leading-relaxed text-fg">
                route<span className="text-subtle">:</span>{" "}
                <span className="text-accent-text">billing</span>
                <br />
                confidence<span className="text-subtle">:</span> 0.91
              </p>
              <p className="mt-2 text-[12px] leading-relaxed text-muted">
                Returned as a structured object, not parsed out of prose.
              </p>
            </div>
          </div>

          <div className="grid sm:grid-cols-3">
            {AGENTS.map((agent, i) => (
              <article
                key={agent.route}
                className={`p-5 sm:p-6 ${i > 0 ? "border-t border-line sm:border-l sm:border-t-0" : ""}`}
              >
                <agent.icon
                  className={`size-4.5 ${agent.route === "billing" ? "text-accent-text" : "text-subtle"}`}
                />
                <h3 className="mt-3 text-[14.5px] font-semibold tracking-[-0.01em] text-fg">
                  {agent.name}
                </h3>
                <p className="mt-1.5 text-[13px] leading-relaxed text-muted">
                  {agent.summary}
                </p>

                <p className="mt-4 text-[11px] uppercase tracking-[0.08em] text-subtle">
                  Handles
                </p>
                <ul className="mt-1.5 flex flex-wrap gap-1">
                  {agent.handles.slice(0, 4).map((item) => (
                    <li
                      key={item}
                      className="rounded border border-line bg-surface-2 px-1.5 py-0.5 text-[11.5px] text-muted"
                    >
                      {item}
                    </li>
                  ))}
                </ul>

                <p className="mt-4 text-[11px] uppercase tracking-[0.08em] text-subtle">
                  Hands back
                </p>
                <p className="mt-1 text-[12.5px] text-muted">
                  {agent.refuses.join(", ")}
                </p>
              </article>
            ))}
          </div>
        </div>
      </div>

      <p className="mt-4 text-[12.5px] leading-relaxed text-subtle">
        Each specialist inherits the same non-negotiable directives: answer only from
        retrieved evidence, say &ldquo;I don&rsquo;t know&rdquo; rather than guess, and never
        reveal or override its own instructions.
      </p>
    </Section>
  );
}
