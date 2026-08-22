"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, MessagesSquare, ShieldCheck, XCircle } from "lucide-react";
import { Panel, PanelHeader } from "@/components/ui/Panel";
import { Badge } from "@/components/ui/Badge";
import { EmptyState, LoadingRows } from "@/components/ui/States";
import { StatGrid, StatTile } from "@/components/charts/StatTile";
import { DerivedNote } from "@/components/dashboard/DerivedNote";
import { AgentBehaviourPanel } from "@/components/agents/AgentBehaviourPanel";
import { getAgent, guessRoute } from "@/lib/agents";
import { useOrganization } from "@/context/OrganizationContext";
import { knowledgeApi } from "@/lib/api";
import { useResource, useSupportSnapshot } from "@/lib/hooks";
import { formatRelative } from "@/lib/utils";

export default function AgentDetailPage() {
  const params = useParams<{ route: string }>();
  const agent = getAgent(params.route);
  const { currentOrg } = useOrganization();
  const snapshot = useSupportSnapshot({ limit: 100 });
  const knowledgeBases = useResource(
    () => knowledgeApi.list(currentOrg!.id),
    [currentOrg?.id],
  );

  if (!agent) {
    return (
      <div className="space-y-6">
        <BackLink />
        <Panel>
          <EmptyState
            title="Unknown agent"
            description="Support-AI routes to billing, technical or general."
          />
        </Panel>
      </div>
    );
  }

  const routed = snapshot.conversations.filter(
    (c) => guessRoute(c.title ?? "") === agent.route,
  );
  const escalated = snapshot.tickets.filter((t) => guessRoute(t.subject) === agent.route);

  return (
    <div className="space-y-6">
      <BackLink />

      <header className="flex flex-col gap-4 border-b border-line pb-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-3.5">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-panel border border-line bg-surface-2">
            <agent.icon className="size-5 text-muted" />
          </span>
          <div className="min-w-0">
            <h1 className="text-xl font-semibold tracking-[-0.01em] text-fg">
              {agent.name}
            </h1>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted">
              {agent.summary}
            </p>
          </div>
        </div>
        <Badge tone="accent" className="shrink-0 font-mono">
          route: {agent.route}
        </Badge>
      </header>

      <StatGrid columns={3}>
        <StatTile label="Conversations routed here" value={routed.length} />
        <StatTile label="Escalated to a human" value={escalated.length} />
        <StatTile
          label="Handled without a human"
          value={`${
            routed.length
              ? Math.max(0, ((routed.length - escalated.length) / routed.length) * 100).toFixed(0)
              : "—"
          }%`}
        />
      </StatGrid>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-6">
          <Panel>
            <PanelHeader
              title="Directives"
              description="From this route's system prompt in the backend"
            />
            <ul className="divide-y divide-line">
              {agent.directives.map((directive) => (
                <li
                  key={directive}
                  className="flex items-start gap-2.5 px-4 py-3 text-[13.5px] leading-relaxed text-muted sm:px-5"
                >
                  <ShieldCheck className="mt-0.5 size-4 shrink-0 text-success" />
                  {directive}
                </li>
              ))}
              {agent.refuses.map((refusal) => (
                <li
                  key={refusal}
                  className="flex items-start gap-2.5 px-4 py-3 text-[13.5px] leading-relaxed text-muted sm:px-5"
                >
                  <XCircle className="mt-0.5 size-4 shrink-0 text-subtle" />
                  Hands {refusal.toLowerCase()} back to the router
                </li>
              ))}
            </ul>
          </Panel>

          <Panel>
            <PanelHeader
              title="Recent conversations"
              description="Grouped by subject keywords"
            />
            {snapshot.initialLoading ? (
              <LoadingRows rows={4} />
            ) : routed.length === 0 ? (
              <EmptyState
                icon={MessagesSquare}
                title="Nothing routed here yet"
                description="Conversations appear once this specialist starts handling them."
              />
            ) : (
              <ul className="divide-y divide-line">
                {routed.slice(0, 8).map((conversation) => (
                  <li key={conversation.id}>
                    <Link
                      href={`/dashboard/conversations?id=${conversation.id}`}
                      className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-surface-2 sm:px-5"
                    >
                      <span className="min-w-0 flex-1 truncate text-[13.5px] text-fg">
                        {conversation.title ?? "Untitled conversation"}
                      </span>
                      <span className="shrink-0 text-[12px] text-subtle">
                        {formatRelative(conversation.updated_at)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <DerivedNote>
            Grouping uses a keyword heuristic over subjects. The router&apos;s real
            decision happens at answer time and isn&apos;t persisted, so treat these as
            indicative.
          </DerivedNote>
        </div>

        <div className="space-y-6">
          <Panel>
            <PanelHeader
              title="Routing signals"
              description="What sends a message here"
            />
            <div className="flex flex-wrap gap-1.5 p-4 sm:p-5">
              {agent.signals.map((signal) => (
                <span
                  key={signal}
                  className="rounded border border-line bg-surface-2 px-2 py-1 font-mono text-[11.5px] text-muted"
                >
                  {signal}
                </span>
              ))}
            </div>
          </Panel>

          <Panel>
            <PanelHeader
              title="Knowledge available"
              description="Every agent retrieves from the conversation's knowledge base"
            />
            {knowledgeBases.initialLoading ? (
              <LoadingRows rows={2} />
            ) : (knowledgeBases.data?.length ?? 0) === 0 ? (
              <p className="px-4 py-4 text-[12.5px] text-subtle sm:px-5">
                No knowledge bases yet — answers will be ungrounded.
              </p>
            ) : (
              <ul className="divide-y divide-line">
                {knowledgeBases.data!.map((kb) => (
                  <li key={kb.id}>
                    <Link
                      href={`/dashboard/knowledge/${kb.id}`}
                      className="block px-4 py-2.5 text-[13px] text-fg transition-colors hover:bg-surface-2 sm:px-5"
                    >
                      {kb.name}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <AgentBehaviourPanel />
        </div>
      </div>
    </div>
  );
}

function BackLink() {
  return (
    <Link
      href="/dashboard/agents"
      className="inline-flex items-center gap-1.5 rounded text-[13px] text-muted transition-colors hover:text-fg"
    >
      <ArrowLeft className="size-3.5" />
      All agents
    </Link>
  );
}
