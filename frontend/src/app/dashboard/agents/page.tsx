"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PageHeader, Panel, PanelHeader } from "@/components/ui/Panel";
import { Badge } from "@/components/ui/Badge";
import { LoadingRows } from "@/components/ui/States";
import { BarList } from "@/components/charts/BarList";
import { DerivedNote } from "@/components/dashboard/DerivedNote";
import { AgentBehaviourPanel } from "@/components/agents/AgentBehaviourPanel";
import { AGENTS, guessRoute } from "@/lib/agents";
import { groupByRoute } from "@/lib/derived/analytics";
import { useSupportSnapshot } from "@/lib/hooks";

export default function AgentsPage() {
  const snapshot = useSupportSnapshot({ limit: 100 });

  const escalationsByRoute = groupByRoute(snapshot.tickets);
  const conversationsByRoute = snapshot.conversations.reduce<Record<string, number>>(
    (acc, conversation) => {
      const route = guessRoute(conversation.title ?? "");
      acc[route] = (acc[route] ?? 0) + 1;
      return acc;
    },
    {},
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Agents"
        description="Support-AI routes each message to a specialist before answering. Routes and prompts are defined in the backend; the behaviour below is yours to tune."
      />

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-6">
          <div className="grid gap-px overflow-hidden rounded-panel border border-line bg-line">
            {AGENTS.map((agent) => {
              const conversations = conversationsByRoute[agent.route] ?? 0;
              const escalations = escalationsByRoute[agent.route] ?? 0;
              return (
                <article key={agent.route} className="bg-surface p-4 sm:p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-3">
                      <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-panel border border-line bg-surface-2">
                        <agent.icon className="size-4 text-muted" />
                      </span>
                      <div className="min-w-0">
                        <h2 className="text-[15px] font-semibold tracking-[-0.01em] text-fg">
                          {agent.name}
                        </h2>
                        <p className="mt-1 max-w-xl text-[13px] leading-relaxed text-muted">
                          {agent.summary}
                        </p>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-4">
                      <div className="text-right">
                        <p className="text-[11px] uppercase tracking-[0.06em] text-subtle">
                          Conversations
                        </p>
                        <p className="text-[17px] font-semibold tnum text-fg">
                          {conversations}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[11px] uppercase tracking-[0.06em] text-subtle">
                          Escalated
                        </p>
                        <p className="text-[17px] font-semibold tnum text-fg">
                          {escalations}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-1.5">
                    {agent.handles.map((item) => (
                      <Badge key={item}>{item}</Badge>
                    ))}
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-3 border-t border-line pt-3">
                    <span className="font-mono text-[11.5px] text-subtle">
                      route: {agent.route}
                    </span>
                    <Link
                      href={`/dashboard/agents/${agent.route}`}
                      className="inline-flex items-center gap-1 rounded text-[13px] font-medium text-accent-text hover:underline"
                    >
                      Configuration
                      <ArrowRight className="size-3.5" />
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>

          <DerivedNote>
            Volume is grouped by a keyword heuristic over conversation subjects. The
            router&apos;s actual decision is made by the LLM at answer time and is not
            stored on the conversation, so these counts are indicative, not the
            router&apos;s own log.
          </DerivedNote>
        </div>

        <div className="space-y-6">
          <Panel>
            <PanelHeader title="Routing split" description="Escalations by specialist" />
            <div className="p-4 sm:p-5">
              {snapshot.initialLoading ? (
                <LoadingRows rows={3} className="p-0" />
              ) : (
                <BarList
                  emptyLabel="No escalations to group yet"
                  items={AGENTS.map((agent) => ({
                    label: agent.name,
                    value: escalationsByRoute[agent.route] ?? 0,
                  }))}
                />
              )}
            </div>
          </Panel>

          <AgentBehaviourPanel />
        </div>
      </div>
    </div>
  );
}
