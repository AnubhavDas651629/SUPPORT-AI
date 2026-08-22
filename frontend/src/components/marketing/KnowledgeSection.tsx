import { FileText, Layers, Search, Quote } from "lucide-react";
import { Section } from "./Section";

const PIPELINE = [
  { icon: FileText, label: "Upload", detail: "PDF, Markdown, text — stored per knowledge base" },
  { icon: Layers, label: "Chunk & embed", detail: "Split, embedded, written back with a status" },
  { icon: Search, label: "Retrieve", detail: "Cosine similarity over pgvector at query time" },
  { icon: Quote, label: "Cite", detail: "Passages travel with the answer as citations" },
];

const RESULTS = [
  { score: 0.91, doc: "refund-policy.md", chunk: 4, text: "Duplicate charges are refunded in full without requiring the customer to return goods. Refunds settle to the original payment method within 5–10 business days." },
  { score: 0.84, doc: "billing-faq.pdf", chunk: 12, text: "If an invoice is charged twice in the same billing period, the second charge is always the erroneous one." },
  { score: 0.72, doc: "escalation-sop.md", chunk: 2, text: "Refunds above $500 require a human approver before they are issued." },
];

export function KnowledgeSection() {
  return (
    <Section
      id="knowledge"
      index="04"
      eyebrow="Knowledge base"
      title="Answers that can be traced back to a paragraph you wrote."
      lede="Upload the documentation you already maintain. Support-AI indexes it, retrieves against it, and shows which passage produced each answer — so a wrong answer is a fixable document, not a mystery."
    >
      {/* Ingestion pipeline as a horizontal strip */}
      <ol className="grid gap-px overflow-hidden rounded-panel border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
        {PIPELINE.map((stage, i) => (
          <li key={stage.label} className="bg-bg p-5">
            <div className="flex items-center gap-2">
              <stage.icon className="size-4 text-subtle" />
              <span className="font-mono text-[10.5px] text-subtle">
                0{i + 1}
              </span>
            </div>
            <p className="mt-2.5 text-[14px] font-medium text-fg">{stage.label}</p>
            <p className="mt-1 text-[12.5px] leading-relaxed text-muted">
              {stage.detail}
            </p>
          </li>
        ))}
      </ol>

      {/* A real retrieval result set */}
      <div className="mt-8 overflow-hidden rounded-panel border border-line bg-surface">
        <div className="flex flex-wrap items-center gap-2 border-b border-line px-4 py-3 sm:px-5">
          <Search className="size-3.5 text-subtle" aria-hidden="true" />
          <span className="font-mono text-[12.5px] text-fg">
            &ldquo;charged twice for the same invoice&rdquo;
          </span>
          <span className="ml-auto font-mono text-[11px] text-subtle">3 passages</span>
        </div>

        <ul>
          {RESULTS.map((result) => (
            <li
              key={result.doc}
              className="border-b border-line px-4 py-4 last:border-b-0 sm:px-5"
            >
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="font-mono text-[12px] text-fg">{result.doc}</span>
                <span className="font-mono text-[11px] text-subtle">
                  chunk {result.chunk}
                </span>
                <span className="ml-auto flex items-center gap-2">
                  <span
                    className="h-1 w-14 overflow-hidden rounded-full bg-surface-3"
                    aria-hidden="true"
                  >
                    <span
                      className="block h-full rounded-full bg-accent"
                      style={{ width: `${result.score * 100}%` }}
                    />
                  </span>
                  <span className="font-mono text-[11px] tnum text-muted">
                    {result.score.toFixed(2)}
                  </span>
                </span>
              </div>
              <p className="mt-2 text-[13px] leading-relaxed text-muted">
                {result.text}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </Section>
  );
}
