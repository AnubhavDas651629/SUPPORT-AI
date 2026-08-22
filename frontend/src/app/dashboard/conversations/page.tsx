"use client";

import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, MessagesSquare } from "lucide-react";
import { PageHeader, Panel } from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";
import { SearchInput } from "@/components/ui/SearchInput";
import { Select } from "@/components/ui/Field";
import { EmptyState, ErrorState, LoadingRows } from "@/components/ui/States";
import {
  ConversationList,
  type ConversationRow,
} from "@/components/conversations/ConversationList";
import { ConversationDetail } from "@/components/conversations/ConversationDetail";
import { useOrganization } from "@/context/OrganizationContext";
import { membersApi } from "@/lib/api";
import type { Ticket } from "@/lib/api/types";
import { useIsDesktop, useResource, useSupportSnapshot } from "@/lib/hooks";
import { AGENTS, guessRoute } from "@/lib/agents";

type StateFilter = "all" | "ai" | "escalated" | "open" | "resolved";

function ConversationsInbox() {
  const router = useRouter();
  const params = useSearchParams();
  const isDesktop = useIsDesktop();
  const { currentOrg } = useOrganization();

  const [query, setQuery] = useState("");
  const [stateFilter, setStateFilter] = useState<StateFilter>("all");
  const [routeFilter, setRouteFilter] = useState<string>("all");

  const snapshot = useSupportSnapshot({ limit: 100 });
  const members = useResource(() => membersApi.list(currentOrg!.id), [currentOrg?.id]);

  const [ticketOverrides, setTicketOverrides] = useState<Record<string, Ticket>>({});

  // Conversations and escalations are separate endpoints — join them here so a
  // row can show whether the AI handled it or a human took over.
  const rows: ConversationRow[] = useMemo(() => {
    const byConversation = new Map<string, Ticket>();
    for (const ticket of snapshot.tickets) byConversation.set(ticket.conversation_id, ticket);
    for (const ticket of Object.values(ticketOverrides)) {
      byConversation.set(ticket.conversation_id, ticket);
    }

    return snapshot.conversations.map((conversation) => ({
      conversation,
      ticket: byConversation.get(conversation.id) ?? null,
    }));
  }, [snapshot.conversations, snapshot.tickets, ticketOverrides]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter(({ conversation, ticket }) => {
      const title = (conversation.title ?? "").toLowerCase();
      if (q && !title.includes(q)) return false;

      if (stateFilter === "ai" && ticket) return false;
      if (stateFilter === "escalated" && !ticket) return false;
      if (stateFilter === "open" && (!ticket || !["OPEN", "IN_PROGRESS", "WAITING_CUSTOMER"].includes(ticket.status)))
        return false;
      if (stateFilter === "resolved" && (!ticket || !["RESOLVED", "CLOSED"].includes(ticket.status)))
        return false;

      if (routeFilter !== "all" && guessRoute(conversation.title ?? "") !== routeFilter)
        return false;

      return true;
    });
  }, [rows, query, stateFilter, routeFilter]);

  const selectedId = params.get("id");
  const selectedRow = filtered.find((r) => r.conversation.id === selectedId)
    ?? rows.find((r) => r.conversation.id === selectedId)
    ?? null;

  function select(id: string | null) {
    const next = new URLSearchParams(params.toString());
    if (id) next.set("id", id);
    else next.delete("id");
    router.replace(`/dashboard/conversations${next.toString() ? `?${next}` : ""}`, {
      scroll: false,
    });
  }

  function applyTicket(ticket: Ticket) {
    setTicketOverrides((prev) => ({ ...prev, [ticket.conversation_id]: ticket }));
  }

  const showList = isDesktop || !selectedRow;
  const showDetail = isDesktop || !!selectedRow;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Conversations"
        description="Every thread Support-AI has handled, and the ones it handed to your team."
      />

      <Panel className="flex h-[calc(100dvh-16rem)] min-h-[34rem] flex-col lg:flex-row">
        {/* List pane */}
        {showList && (
          <div className="flex min-h-0 flex-1 flex-col border-line lg:w-[22rem] lg:flex-none lg:border-r">
            <div className="shrink-0 space-y-2 border-b border-line p-3">
              <SearchInput
                value={query}
                onChange={setQuery}
                placeholder="Search conversations"
                label="Search conversations"
              />
              <div className="flex gap-2">
                <Select
                  value={stateFilter}
                  onChange={(e) => setStateFilter(e.target.value as StateFilter)}
                  aria-label="Filter by state"
                  className="h-8 text-[12.5px]"
                >
                  <option value="all">All states</option>
                  <option value="ai">Handled by AI</option>
                  <option value="escalated">Escalated</option>
                  <option value="open">Open escalations</option>
                  <option value="resolved">Resolved</option>
                </Select>
                <Select
                  value={routeFilter}
                  onChange={(e) => setRouteFilter(e.target.value)}
                  aria-label="Filter by agent"
                  className="h-8 text-[12.5px]"
                >
                  <option value="all">All agents</option>
                  {AGENTS.map((agent) => (
                    <option key={agent.route} value={agent.route}>
                      {agent.name}
                    </option>
                  ))}
                </Select>
              </div>
              <p className="text-[11.5px] text-subtle">
                {filtered.length} of {rows.length} conversations
              </p>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
              {snapshot.error ? (
                <ErrorState message={snapshot.error} onRetry={snapshot.refetch} />
              ) : snapshot.initialLoading ? (
                <LoadingRows rows={7} />
              ) : (
                <ConversationList
                  rows={filtered}
                  selectedId={selectedRow?.conversation.id ?? null}
                  onSelect={select}
                />
              )}
            </div>
          </div>
        )}

        {/* Detail pane */}
        {showDetail && (
          <div className="flex min-h-0 flex-1 flex-col">
            {!isDesktop && selectedRow && (
              <div className="shrink-0 border-b border-line p-2">
                <Button size="sm" variant="ghost" onClick={() => select(null)}>
                  <ArrowLeft className="size-3.5" />
                  All conversations
                </Button>
              </div>
            )}

            {selectedRow ? (
              <ConversationDetail
                key={selectedRow.conversation.id}
                conversationId={selectedRow.conversation.id}
                ticket={selectedRow.ticket}
                members={members.data ?? []}
                onTicketChange={applyTicket}
                onDeleted={() => {
                  select(null);
                  snapshot.refetch();
                }}
              />
            ) : (
              <EmptyState
                icon={MessagesSquare}
                title="Select a conversation"
                description="Pick a thread on the left to read the exchange, reply as a human, or escalate it."
                className="h-full"
              />
            )}
          </div>
        )}
      </Panel>
    </div>
  );
}

export default function ConversationsPage() {
  return (
    <Suspense
      fallback={
        <Panel className="h-[calc(100dvh-16rem)] min-h-[34rem]">
          <LoadingRows rows={8} />
        </Panel>
      }
    >
      <ConversationsInbox />
    </Suspense>
  );
}
