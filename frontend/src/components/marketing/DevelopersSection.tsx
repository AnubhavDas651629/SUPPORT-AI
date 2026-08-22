"use client";

import { useState } from "react";
import { Section } from "./Section";
import { CopyButton } from "@/components/ui/CopyButton";
import { cn } from "@/lib/utils";

const SNIPPETS: { id: string; label: string; language: string; code: string }[] = [
  {
    id: "widget",
    label: "Widget",
    language: "html",
    code: `<script
  src="https://your-host/static/widget.js"
  data-api-key="sk_live_your_key"
  defer
></script>`,
  },
  {
    id: "ask",
    label: "Ask",
    language: "bash",
    code: `curl -X POST https://your-host/api/v1/widget/chat/stream \\
  -H "X-API-Key: $SUPPORTAI_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"question": "Why was I charged twice?"}'`,
  },
  {
    id: "escalations",
    label: "Escalations",
    language: "bash",
    code: `curl https://your-host/api/v1/tickets \\
  -H "Authorization: Bearer $TOKEN" \\
  -G --data-urlencode "organization_id=$ORG_ID" \\
     --data-urlencode "status=OPEN" \\
     --data-urlencode "priority=URGENT"`,
  },
  {
    id: "webhook",
    label: "Webhook",
    language: "json",
    code: `{
  "event": "ticket.created",
  "data": {
    "id": "7c2f...",
    "subject": "Duplicate charge on March invoice",
    "status": "OPEN",
    "priority": "HIGH",
    "created_by_ai": true
  }
}`,
  },
];

const SURFACES = [
  {
    title: "Two ways in",
    body: "A JWT session for your dashboard users, or an organization-scoped API key for machines. Keys are SHA-256 hashed at rest and shown exactly once.",
  },
  {
    title: "Streaming by default",
    body: "Chat responses stream over Server-Sent Events, so the first token lands in milliseconds rather than after the full answer.",
  },
  {
    title: "OpenAPI out of the box",
    body: "Every route is typed and documented. Interactive docs ship with the server at /docs.",
  },
];

export function DevelopersSection() {
  const [active, setActive] = useState(SNIPPETS[0].id);
  const snippet = SNIPPETS.find((s) => s.id === active)!;

  return (
    <Section
      id="developers"
      index="08"
      eyebrow="For developers"
      title="A REST API, not a widget with a settings page."
      lede="Everything the dashboard does is a documented endpoint. Drop in the script tag, or drive the whole thing from your own backend."
    >
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:gap-12">
        <div className="overflow-hidden rounded-panel border border-line bg-surface">
          <div
            role="tablist"
            aria-label="Integration examples"
            className="flex overflow-x-auto border-b border-line [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {SNIPPETS.map((item) => (
              <button
                key={item.id}
                role="tab"
                aria-selected={item.id === active}
                onClick={() => setActive(item.id)}
                className={cn(
                  "relative shrink-0 px-4 py-2.5 text-[12.5px] font-medium transition-colors",
                  "after:absolute after:inset-x-3 after:-bottom-px after:h-0.5",
                  item.id === active
                    ? "text-fg after:bg-accent"
                    : "text-muted hover:text-fg after:bg-transparent",
                )}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="relative">
            <div className="absolute right-3 top-3 z-10">
              <CopyButton value={snippet.code} label="Copy" />
            </div>
            <pre className="overflow-x-auto px-4 py-4 pr-24 font-mono text-[12px] leading-relaxed text-muted sm:px-5">
              <code>{snippet.code}</code>
            </pre>
          </div>

          <div className="border-t border-line px-4 py-2.5 sm:px-5">
            <span className="font-mono text-[10.5px] uppercase tracking-[0.1em] text-subtle">
              {snippet.language}
            </span>
          </div>
        </div>

        <div className="space-y-6">
          {SURFACES.map((item) => (
            <div key={item.title} className="border-l-2 border-line pl-4">
              <h3 className="text-[14.5px] font-medium tracking-[-0.01em] text-fg">
                {item.title}
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
