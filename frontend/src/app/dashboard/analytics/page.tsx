"use client";

import { useMemo, useState } from "react";
import { PageHeader, Panel, PanelHeader } from "@/components/ui/Panel";
import { ErrorState, LoadingRows } from "@/components/ui/States";
import { Avatar } from "@/components/ui/Avatar";
import { StatGrid, StatTile } from "@/components/charts/StatTile";
import { ChartFrame } from "@/components/charts/ChartFrame";
import { TrendChart } from "@/components/charts/TrendChart";
import { BarList } from "@/components/charts/BarList";
import { Meter } from "@/components/charts/Meter";
import { SERIES, ordinalVar } from "@/components/charts/palette";
import { DerivedNote } from "@/components/dashboard/DerivedNote";
import {
  PriorityBreakdown,
  StatusBreakdown,
} from "@/components/dashboard/QueueBreakdown";
import { documentsApi, knowledgeApi, membersApi } from "@/lib/api";
import { AGENTS } from "@/lib/agents";
import { groupByRoute, trendDelta } from "@/lib/derived/analytics";
import { useOrganization } from "@/context/OrganizationContext";
import { useResource, useSupportSnapshot } from "@/lib/hooks";
import { cn, formatBytes, formatDuration } from "@/lib/utils";

const RANGES = [
  { days: 7, label: "7 days" },
  { days: 14, label: "14 days" },
  { days: 30, label: "30 days" },
] as const;

export default function AnalyticsPage() {
  const [days, setDays] = useState<number>(14);
  const { currentOrg, usage, subscription } = useOrganization();
  const orgId = currentOrg?.id ?? null;

  const snapshot = useSupportSnapshot({ limit: 100, windowDays: days });
  const members = useResource(() => membersApi.list(orgId!), [orgId]);

  // Knowledge coverage: one document request per base (no aggregate endpoint).
  const knowledge = useResource(
    async () => {
      const bases = await knowledgeApi.list(orgId!);
      const detail = await Promise.all(
        bases.map(async (kb) => ({
          kb,
          documents: await documentsApi.list(orgId!, kb.id),
        })),
      );
      return detail;
    },
    [orgId],
  );

  const { summary, buckets, tickets } = snapshot;

  const byRoute = groupByRoute(tickets);
  const conversationTrend = buckets.map((b) => b.conversations);
  const escalationTrend = buckets.map((b) => b.escalations);

  const workload = useMemo(() => {
    const counts = new Map<string, number>();
    let unassigned = 0;
    for (const ticket of tickets) {
      if (!ticket.assigned_to_user_id) {
        unassigned += 1;
        continue;
      }
      counts.set(
        ticket.assigned_to_user_id,
        (counts.get(ticket.assigned_to_user_id) ?? 0) + 1,
      );
    }
    const rows = (members.data ?? [])
      .map((member) => ({
        member,
        value: counts.get(member.id) ?? 0,
      }))
      .filter((row) => row.value > 0)
      .sort((a, b) => b.value - a.value);
    return { rows, unassigned };
  }, [tickets, members.data]);

  const totalDocs = (knowledge.data ?? []).reduce(
    (sum, entry) => sum + entry.documents.length,
    0,
  );
  const readyDocs = (knowledge.data ?? []).reduce(
    (sum, entry) => sum + entry.documents.filter((d) => d.status === "READY").length,
    0,
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        description="Whether automation is holding, and where it isn't."
        actions={
          <div
            className="flex items-center rounded-control border border-line p-0.5"
            role="group"
            aria-label="Time range"
          >
            {RANGES.map((range) => (
              <button
                key={range.days}
                onClick={() => setDays(range.days)}
                aria-pressed={days === range.days}
                className={cn(
                  "rounded-[4px] px-2.5 py-1 text-[12.5px] transition-colors",
                  days === range.days
                    ? "bg-surface-2 font-medium text-fg"
                    : "text-muted hover:text-fg",
                )}
              >
                {range.label}
              </button>
            ))}
          </div>
        }
      />

      {snapshot.error ? (
        <Panel>
          <ErrorState message={snapshot.error} onRetry={snapshot.refetch} />
        </Panel>
      ) : snapshot.initialLoading ? (
        <Panel>
          <LoadingRows rows={5} />
        </Panel>
      ) : (
        <>
          <StatGrid columns={4}>
            <StatTile
              label="Deflection rate"
              value={summary.autoResolutionRate.toFixed(1)}
              unit="%"
              caption="closed without a human"
              trend={conversationTrend}
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
              label="Resolution rate"
              value={summary.resolutionRate.toFixed(1)}
              unit="%"
              caption={`${summary.resolvedEscalations} of ${summary.totalEscalations} closed`}
            />
            <StatTile
              label="Median time to close"
              value={
                summary.approxResolutionMinutes
                  ? formatDuration(summary.approxResolutionMinutes)
                  : "—"
              }
              caption={`${summary.breachedSla} past SLA`}
            />
          </StatGrid>

          <ChartFrame
            title="Conversation volume"
            description={`Last ${days} days`}
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
              height={240}
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

          <ChartFrame
            title="Escalations closed"
            description="Escalations reaching resolved or closed each day"
            series={[{ key: "resolved", label: "Closed", color: SERIES.primary }]}
            rows={buckets.map((b) => ({
              label: b.label,
              values: { resolved: b.resolved },
            }))}
            rowHeader="Day"
          >
            <TrendChart
              height={180}
              points={buckets.map((b) => ({
                label: b.label,
                values: { resolved: b.resolved },
              }))}
              series={[
                { key: "resolved", label: "Closed", color: SERIES.primary, fill: true },
              ]}
            />
          </ChartFrame>

          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
            <Panel>
              <PanelHeader title="Queue by status" />
              <div className="p-4 sm:p-5">
                <StatusBreakdown tickets={tickets} />
              </div>
            </Panel>
            <Panel>
              <PanelHeader title="Queue by priority" />
              <div className="p-4 sm:p-5">
                <PriorityBreakdown tickets={tickets} />
              </div>
            </Panel>
            <Panel>
              <PanelHeader
                title="What people ask about"
                description="Grouped by specialist"
              />
              <div className="p-4 sm:p-5">
                <BarList
                  emptyLabel="No escalations to group yet"
                  items={AGENTS.map((agent, i) => ({
                    label: agent.name.replace(" Agent", ""),
                    value: byRoute[agent.route] ?? 0,
                    color: ordinalVar(4 - i),
                  }))}
                />
              </div>
            </Panel>
          </div>

          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
            <Panel>
              <PanelHeader
                title="Team workload"
                description="Open and closed escalations by assignee"
              />
              <div className="p-4 sm:p-5">
                {members.initialLoading ? (
                  <LoadingRows rows={3} className="p-0" />
                ) : workload.rows.length === 0 ? (
                  <p className="py-6 text-center text-[13px] text-subtle">
                    Nothing assigned yet — {workload.unassigned} escalation
                    {workload.unassigned === 1 ? "" : "s"} unassigned.
                  </p>
                ) : (
                  <>
                    <ul className="space-y-3">
                      {workload.rows.map(({ member, value }) => {
                        const max = workload.rows[0].value || 1;
                        return (
                          <li key={member.id}>
                            <div className="flex items-center gap-2.5">
                              <Avatar name={member.full_name} size="xs" />
                              <span className="min-w-0 flex-1 truncate text-[13px] text-fg">
                                {member.full_name}
                              </span>
                              <span className="text-[13px] tnum font-medium text-fg">
                                {value}
                              </span>
                            </div>
                            <div className="mt-1.5 ml-7 h-1.5 overflow-hidden rounded-full bg-surface-3">
                              <div
                                className="h-full rounded-full bg-accent"
                                style={{ width: `${(value / max) * 100}%` }}
                              />
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                    {workload.unassigned > 0 && (
                      <p className="mt-4 border-t border-line pt-3 text-[12.5px] text-subtle">
                        {workload.unassigned} escalation
                        {workload.unassigned === 1 ? "" : "s"} unassigned.
                      </p>
                    )}
                  </>
                )}
              </div>
            </Panel>

            <Panel>
              <PanelHeader
                title="Knowledge & capacity"
                description="What answers are grounded in, and headroom left"
              />
              <div className="space-y-4 p-4 sm:p-5">
                {knowledge.initialLoading ? (
                  <LoadingRows rows={3} className="p-0" />
                ) : (
                  <>
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="text-[13px] text-muted">Indexed documents</span>
                      <span className="text-[13px] tnum text-fg">
                        <span className="font-medium">{readyDocs}</span> of {totalDocs}{" "}
                        ready
                      </span>
                    </div>
                    <BarList
                      emptyLabel="No knowledge bases yet"
                      formatValue={(v) => `${v} doc${v === 1 ? "" : "s"}`}
                      items={(knowledge.data ?? []).map((entry) => ({
                        label: entry.kb.name,
                        value: entry.documents.length,
                      }))}
                    />
                  </>
                )}

                {usage && (
                  <div className="space-y-3 border-t border-line pt-4">
                    <Meter
                      label="AI responses this period"
                      used={usage.ai_responses.used}
                      limit={usage.ai_responses.limit}
                    />
                    <Meter
                      label="Document storage"
                      used={usage.storage_bytes.used}
                      limit={usage.storage_bytes.limit}
                      formatValue={formatBytes}
                    />
                    <Meter
                      label="Conversations"
                      used={usage.conversations.used}
                      limit={usage.conversations.limit}
                    />
                    {subscription && (
                      <p className="text-[12px] text-subtle">
                        Billing period ends{" "}
                        {new Date(subscription.current_period_end).toLocaleDateString()}.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </Panel>
          </div>

          <DerivedNote>
            Every figure on this page is aggregated in the browser from the most recent{" "}
            {summary.totalConversations} conversations and {summary.totalEscalations}{" "}
            escalations — the backend has no analytics endpoint. Two consequences worth
            knowing: conversations are bucketed by last activity rather than creation
            (the list response carries only <code className="font-mono">updated_at</code>
            ), and first-response time is not shown because no endpoint exposes it
            without fetching every thread. Quota figures come from the real usage
            endpoint.
          </DerivedNote>
        </>
      )}
    </div>
  );
}
