import { Container } from "./Section";

/**
 * Credibility through engineering substance rather than invented logos or
 * testimonials — every claim below maps to something in the codebase.
 */
const FACTS = [
  {
    value: "Row-level",
    label: "tenant isolation",
    detail: "Every query filtered by organization, twice — repository and service.",
  },
  {
    value: "HMAC-SHA256",
    label: "signed webhooks",
    detail: "Every delivery attempt logged with status, duration and retry count.",
  },
  {
    value: "pgvector",
    label: "retrieval",
    detail: "Cosine similarity over chunked, embedded documents in Postgres.",
  },
  {
    value: "Immutable",
    label: "event trail",
    detail: "Assignment, status, priority and reply recorded per escalation.",
  },
];

export function Credibility() {
  return (
    <section className="border-t border-line bg-bg-inset py-12 sm:py-14">
      <Container>
        <p className="text-center font-mono text-[11px] uppercase tracking-[0.14em] text-subtle">
          Built for teams that have to answer for their support data
        </p>
        <dl className="mt-8 grid gap-px overflow-hidden rounded-panel border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
          {FACTS.map((fact) => (
            <div key={fact.label} className="bg-bg-inset px-5 py-5">
              <dt className="text-[15px] font-semibold tracking-[-0.01em] text-fg">
                {fact.value}{" "}
                <span className="font-normal text-muted">{fact.label}</span>
              </dt>
              <dd className="mt-1.5 text-[12.5px] leading-relaxed text-subtle">
                {fact.detail}
              </dd>
            </div>
          ))}
        </dl>
      </Container>
    </section>
  );
}
