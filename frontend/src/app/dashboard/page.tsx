"use client";

import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  FileText,
  MessagesSquare,
  TicketCheck,
  Upload,
} from "lucide-react";
import { PageHeader, Panel, PanelHeader } from "@/components/ui/Panel";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState, ErrorState, LoadingRows } from "@/components/ui/States";
import { StatGrid, StatTile } from "@/components/charts/StatTile";
import { ChartFrame } from "@/components/charts/ChartFrame";
import { TrendChart } from "@/components/charts/TrendChart";
import { SERIES } from "@/components/charts/palette";
import { DerivedNote } from "@/components/dashboard/DerivedNote";
import {
  PriorityBreakdown,
  StatusBreakdown,
} from "@/components/dashboard/QueueBreakdown";
import { useOrganization } from "@/context/OrganizationContext";
import { useResource, useSupportSnapshot } from "@/lib/hooks";
import { knowledgeApi } from "@/lib/api";
import { trendDelta } from "@/lib/derived/analytics";
import { TICKET_PRIORITY_META, TICKET_STATUS_META } from "@/lib/domain";
import { formatDuration, formatRelative, truncate } from "@/lib/utils";

export default function OverviewPage() {
  const { currentOrg } = useOrganization();
  const snapshot = useSupportSnapshot({ limit: 100, windowDays: 14 });

  const knowledgeBases = useResource(
    () => knowledgeApi.list(currentOrg!.id),
    [currentOrg?.id],
  );

  const { summary, buckets, tickets, conversations } = snapshot;

  const conversationTrend = buckets.map((b) => b.conversations);
  const escalationTrend = buckets.map((b) => b.escalations);
  const today = buckets[buckets.length - 1];

  const openQueue = tickets
    .filter((t) => TICKET_STATUS_META[t.status].open)
    .sort(
      (a, b) =>
        TICKET_PRIORITY_META[b.priority].rank - TICKET_PRIORITY_META[a.priority].rank ||
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    )
    .slice(0, 6);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Overview"
        description={
          currentOrg
            ? `How ${currentOrg.name}'s support operation is running right now.`
            : undefined
        }
        actions={
          <>
            <ButtonLink href="/dashboard/knowledge" size="sm">
              <Upload className="size-3.5" />
              Add documents
            </ButtonLink>
            <ButtonLink href="/dashboard/escalations" size="sm" variant="primary">
              Open the queue
              <ArrowRight className="size-3.5" />
            </ButtonLink>
          </>
        }
      />

      {snapshot.error ? (
        <Panel>
          <ErrorState message={snapshot.error} onRetry={snapshot.refetch} />
        </Panel>
      ) : snapshot.initialLoading ? (
        <Panel>
          <LoadingRows rows={4} />
        </Panel>
      ) : (
        <>
          <StatGrid columns={4}>
            <StatTile
              label="Conversations today"
              value={today?.conversations ?? 0}
              delta={trendDelta(conversationTrend)}
              deltaGood="up"
              caption="vs previous week"
              trend={conversationTrend}
            />
            <StatTile
              label="Resolved without a human"
              value={summary.autoResolutionRate.toFixed(1)}
              unit="%"
              caption={`${summary.totalConversations} conversations · ${summary.totalEscalations} escalated`}
            />
            <StatTile
              label="Escalation rate"
              value={summary.escalationRate.toFixed(1)}
              unit="%"
              delta={trendDelta(escalationTrend)}
              deltaGood="down"
              caption="lower is better"
              trend={escalationTrend}
            />
            <StatTile
              label="Median time to close"
              value={
                summary.approxResolutionMinutes
                  ? formatDuration(summary.approxResolutionMinutes)
                  : "—"
              }
              caption={`${summary.resolvedEscalations} closed`}
            />
          </StatGrid>

          <DerivedNote>
            Computed in the browser from your most recent {summary.totalConversations}{" "}
            conversations and {summary.totalEscalations} escalations. The backend has no
            analytics endpoint yet, and time-to-close uses each escalation&apos;s last
            update as its close time.
          </DerivedNote>

          <ChartFrame
            title="Volume and escalations"
            description="Last 14 days"
            series={[
              { key: "conversations", label: "Conversations", color: SERIES.primary },
              { key: "escalations", label: "Escalations", color: SERIES.secondary },
            ]}
            rows={buckets.map((b) => ({
              label: b.label,
              values: { conversations: b.conversations, escalations: b.escalations },
            }))}
            rowHeader="Day"
          >
            <TrendChart
              height={220}
              points={buckets.map((b) => ({
                label: b.label,
                values: { conversations: b.conversations, escalations: b.escalations },
              }))}
              series={[
                {
                  key: "conversations",
                  label: "Conversations",
                  color: SERIES.primary,
                  fill: true,
                },
                { key: "escalations", label: "Escalations", color: SERIES.secondary },
              ]}
            />
          </ChartFrame>

          <div className="grid gap-6 lg:grid-cols-3">
            <Panel className="lg:col-span-2">
              <PanelHeader
                title="Queue"
                description={`${summary.openEscalations} open · ${summary.breachedSla} past SLA`}
                action={
                  <Link
                    href="/dashboard/escalations"
                    className="rounded text-[13px] font-medium text-accent hover:underline"
                  >
                    View all
                  </Link>
                }
              />
              {openQueue.length === 0 ? (
                <EmptyState
                  icon={TicketCheck}
                  title="Nothing waiting"
                  description="Support-AI is handling everything on its own right now."
                />
              ) : (
                <ul className="divide-y divide-line">
                  {openQueue.map((ticket) => (
                    <li key={ticket.id}>
                      <Link
                        href={`/dashboard/escalations/${ticket.id}`}
                        className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-surface-2 sm:px-5"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[13.5px] font-medium text-fg">
                            {truncate(ticket.subject, 80)}
                          </p>
                          <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[12px] text-subtle">
                            <span>{formatRelative(ticket.created_at)}</span>
                            <span aria-hidden="true">·</span>
                            <span
                              className={
                                ticket.sla_deadline === "Breached"
                                  ? "text-danger"
                                  : undefined
                              }
                            >
                              {ticket.sla_deadline}
                            </span>
                            {ticket.created_by_ai && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span>escalated by Support-AI</span>
                              </>
                            )}
                          </p>
                        </div>
                        <Badge tone={TICKET_PRIORITY_META[ticket.priority].tone}>
                          {TICKET_PRIORITY_META[ticket.priority].label}
                        </Badge>
                        <Badge tone={TICKET_STATUS_META[ticket.status].tone} dot>
                          {TICKET_STATUS_META[ticket.status].label}
                        </Badge>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>

            <div className="space-y-6">
              <Panel>
                <PanelHeader title="By status" />
                <div className="p-4 sm:p-5">
                  <StatusBreakdown tickets={tickets} />
                </div>
              </Panel>
              <Panel>
                <PanelHeader title="By priority" />
                <div className="p-4 sm:p-5">
                  <PriorityBreakdown tickets={tickets} />
                </div>
              </Panel>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Panel>
              <PanelHeader
                title="Recent conversations"
                action={
                  <Link
                    href="/dashboard/conversations"
                    className="rounded text-[13px] font-medium text-accent hover:underline"
                  >
                    View all
                  </Link>
                }
              />
              {conversations.length === 0 ? (
                <EmptyState
                  icon={MessagesSquare}
                  title="No conversations yet"
                  description="Install the widget or call the chat API to start a conversation."
                />
              ) : (
                <ul className="divide-y divide-line">
                  {conversations.slice(0, 6).map((conversation) => (
                    <li key={conversation.id}>
                      <Link
                        href={`/dashboard/conversations?id=${conversation.id}`}
                        className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-surface-2 sm:px-5"
                      >
                        <MessagesSquare className="size-4 shrink-0 text-subtle" />
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

            <Panel>
              <PanelHeader
                title="Knowledge coverage"
                description="What your agents can answer from"
                action={
                  <Link
                    href="/dashboard/knowledge"
                    className="rounded text-[13px] font-medium text-accent hover:underline"
                  >
                    Manage
                  </Link>
                }
              />
              {knowledgeBases.initialLoading ? (
                <LoadingRows rows={3} />
              ) : (knowledgeBases.data?.length ?? 0) === 0 ? (
                <EmptyState
                  icon={BookOpen}
                  title="No knowledge base yet"
                  description="Answers stay ungrounded until you upload documentation."
                  action={
                    <ButtonLink href="/dashboard/knowledge" size="sm" variant="primary">
                      Create one
                    </ButtonLink>
                  }
                />
              ) : (
                <ul className="divide-y divide-line">
                  {knowledgeBases.data!.map((kb) => (
                    <li key={kb.id}>
                      <Link
                        href={`/dashboard/knowledge/${kb.id}`}
                        className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-surface-2 sm:px-5"
                      >
                        <FileText className="mt-0.5 size-4 shrink-0 text-subtle" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[13.5px] font-medium text-fg">
                            {kb.name}
                          </span>
                          {kb.description && (
                            <span className="mt-0.5 block truncate text-[12.5px] text-muted">
                              {kb.description}
                            </span>
                          )}
                        </span>
                        <ArrowRight className="mt-0.5 size-3.5 shrink-0 text-subtle" />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </div>
        </>
      )}
    </div>
  );
}
