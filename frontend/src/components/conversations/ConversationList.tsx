"use client";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/States";
import { MessagesSquare } from "lucide-react";
import type { ConversationSummary, Ticket } from "@/lib/api/types";
import { TICKET_STATUS_META } from "@/lib/domain";
import { getAgent, guessRoute } from "@/lib/agents";
import { formatRelative } from "@/lib/utils";

export interface ConversationRow {
  conversation: ConversationSummary;
  ticket: Ticket | null;
}

export function ConversationList({
  rows,
  selectedId,
  onSelect,
}: {
  rows: ConversationRow[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  if (rows.length === 0) {
    return (
      <EmptyState
        icon={MessagesSquare}
        title="No conversations match"
        description="Adjust the filters, or install the widget to start receiving conversations."
      />
    );
  }

  return (
    <ul className="divide-y divide-line">
      {rows.map(({ conversation, ticket }) => {
        const selected = conversation.id === selectedId;
        const title = conversation.title ?? "Untitled conversation";
        const agent = getAgent(guessRoute(title));

        return (
          <li key={conversation.id}>
            <button
              onClick={() => onSelect(conversation.id)}
              aria-current={selected ? "true" : undefined}
              className={cn(
                "w-full px-4 py-3 text-left transition-colors",
                selected
                  ? "bg-accent-soft/70 border-l-2 border-l-accent pl-[14px]"
                  : "border-l-2 border-l-transparent hover:bg-surface-2",
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="line-clamp-2 min-w-0 flex-1 text-[13.5px] font-medium leading-snug text-fg">
                  {title}
                </p>
                <span className="shrink-0 text-[11.5px] text-subtle">
                  {formatRelative(conversation.updated_at)}
                </span>
              </div>

              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                {ticket ? (
                  <Badge tone={TICKET_STATUS_META[ticket.status].tone} dot>
                    {TICKET_STATUS_META[ticket.status].label}
                  </Badge>
                ) : (
                  <Badge tone="success" dot>
                    Handled by AI
                  </Badge>
                )}
                {agent && (
                  <span className="text-[11.5px] text-subtle">{agent.name}</span>
                )}
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
