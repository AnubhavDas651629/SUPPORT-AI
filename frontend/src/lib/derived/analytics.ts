/**
 * Support metrics computed on the client from live API data.
 *
 * The backend exposes no analytics endpoint — only `/organizations/{id}/usage`
 * (quota counters). Everything here is derived from the tickets and
 * conversations the API already returns, so the numbers are real even though
 * the aggregation is not server-side. Each function documents its assumptions;
 * where an approximation is unavoidable it is named in the return type so the
 * UI can label it honestly.
 */
import type { ConversationSummary, Ticket, TicketPriority, TicketStatus } from "@/lib/api/types";
import { guessRoute, type AgentRoute } from "@/lib/agents";
import { isOpenStatus } from "@/lib/domain";

const DAY = 86_400_000;

export interface DayBucket {
  /** ISO date (yyyy-mm-dd) for the bucket. */
  date: string;
  label: string;
  conversations: number;
  escalations: number;
  resolved: number;
}

export function startOfDay(d: Date): Date {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export function buildDayBuckets(days: number): DayBucket[] {
  const today = startOfDay(new Date());
  return Array.from({ length: days }, (_, i) => {
    const d = new Date(today.getTime() - (days - 1 - i) * DAY);
    return {
      date: d.toISOString().slice(0, 10),
      label: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      conversations: 0,
      escalations: 0,
      resolved: 0,
    };
  });
}

/**
 * Buckets activity by day.
 *
 * Note: `ConversationSummary` only carries `updated_at`, so a conversation is
 * counted on the day of its last activity rather than its creation date.
 */
export function bucketActivity(
  conversations: ConversationSummary[],
  tickets: Ticket[],
  days = 14,
): DayBucket[] {
  const buckets = buildDayBuckets(days);
  const index = new Map(buckets.map((b) => [b.date, b]));

  for (const c of conversations) {
    const key = startOfDay(new Date(c.updated_at)).toISOString().slice(0, 10);
    const bucket = index.get(key);
    if (bucket) bucket.conversations += 1;
  }

  for (const t of tickets) {
    const created = index.get(startOfDay(new Date(t.created_at)).toISOString().slice(0, 10));
    if (created) created.escalations += 1;

    if (!isOpenStatus(t.status)) {
      const done = index.get(startOfDay(new Date(t.updated_at)).toISOString().slice(0, 10));
      if (done) done.resolved += 1;
    }
  }

  return buckets;
}

export interface SupportSummary {
  totalConversations: number;
  totalEscalations: number;
  openEscalations: number;
  resolvedEscalations: number;
  breachedSla: number;
  /** Escalations ÷ conversations. Lower is better. */
  escalationRate: number;
  /** Conversations that never became a ticket. Higher is better. */
  autoResolutionRate: number;
  /** Resolved ÷ total escalations. */
  resolutionRate: number;
  /**
   * Mean minutes between a ticket's creation and its last update, over closed
   * tickets. An approximation: the API exposes no explicit resolved_at, so a
   * later edit to a resolved ticket inflates the figure.
   */
  approxResolutionMinutes: number | null;
}

export function summarize(
  conversations: ConversationSummary[],
  tickets: Ticket[],
): SupportSummary {
  const totalConversations = conversations.length;
  const totalEscalations = tickets.length;
  const open = tickets.filter((t) => isOpenStatus(t.status));
  const closed = tickets.filter((t) => !isOpenStatus(t.status));

  const durations = closed
    .map((t) => new Date(t.updated_at).getTime() - new Date(t.created_at).getTime())
    .filter((ms) => ms > 0);

  return {
    totalConversations,
    totalEscalations,
    openEscalations: open.length,
    resolvedEscalations: closed.length,
    breachedSla: tickets.filter((t) => t.sla_deadline === "Breached").length,
    escalationRate: totalConversations ? (totalEscalations / totalConversations) * 100 : 0,
    autoResolutionRate: totalConversations
      ? Math.max(0, ((totalConversations - totalEscalations) / totalConversations) * 100)
      : 0,
    resolutionRate: totalEscalations ? (closed.length / totalEscalations) * 100 : 0,
    approxResolutionMinutes: durations.length
      ? durations.reduce((a, b) => a + b, 0) / durations.length / 60_000
      : null,
  };
}

export function countBy<T extends string>(
  items: { [k: string]: unknown }[],
  key: string,
  keys: readonly T[],
): Record<T, number> {
  const out = Object.fromEntries(keys.map((k) => [k, 0])) as Record<T, number>;
  for (const item of items) {
    const value = item[key] as T;
    if (value in out) out[value] += 1;
  }
  return out;
}

export function countStatuses(
  tickets: Ticket[],
  keys: readonly TicketStatus[],
): Record<TicketStatus, number> {
  return countBy(tickets as unknown as { [k: string]: unknown }[], "status", keys);
}

export function countPriorities(
  tickets: Ticket[],
  keys: readonly TicketPriority[],
): Record<TicketPriority, number> {
  return countBy(tickets as unknown as { [k: string]: unknown }[], "priority", keys);
}

/**
 * Groups escalations by the specialist that most likely handled them.
 *
 * The router's decision is made at answer time and is not persisted, so this
 * uses the display heuristic in `lib/agents.ts` over the ticket subject.
 */
export function groupByRoute(tickets: Ticket[]): Record<AgentRoute, number> {
  const out: Record<AgentRoute, number> = { billing: 0, technical: 0, general: 0 };
  for (const t of tickets) out[guessRoute(t.subject)] += 1;
  return out;
}

/** Percentage change between the two halves of a series. */
export function trendDelta(values: number[]): number | null {
  if (values.length < 4) return null;
  const mid = Math.floor(values.length / 2);
  const prev = values.slice(0, mid).reduce((a, b) => a + b, 0);
  const curr = values.slice(mid).reduce((a, b) => a + b, 0);
  if (prev === 0) return curr === 0 ? 0 : null;
  return ((curr - prev) / prev) * 100;
}
