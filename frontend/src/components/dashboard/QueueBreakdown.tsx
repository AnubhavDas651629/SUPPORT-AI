"use client";

import { BarList } from "@/components/charts/BarList";
import { ordinalVar } from "@/components/charts/palette";
import { TICKET_PRIORITIES, TICKET_STATUSES, type Ticket } from "@/lib/api/types";
import { countPriorities, countStatuses } from "@/lib/derived/analytics";
import { TICKET_PRIORITY_META, TICKET_STATUS_META } from "@/lib/domain";

/**
 * Status and priority splits as labelled horizontal bars. Each row carries its
 * own name and count, so the bar is a magnitude cue rather than the only way
 * to read the value.
 */
export function StatusBreakdown({ tickets }: { tickets: Ticket[] }) {
  const counts = countStatuses(tickets, TICKET_STATUSES);
  return (
    <BarList
      emptyLabel="No escalations yet"
      items={TICKET_STATUSES.map((status) => ({
        label: TICKET_STATUS_META[status].label,
        value: counts[status],
      }))}
    />
  );
}

export function PriorityBreakdown({ tickets }: { tickets: Ticket[] }) {
  const counts = countPriorities(tickets, TICKET_PRIORITIES);
  return (
    <BarList
      emptyLabel="No escalations yet"
      items={TICKET_PRIORITIES.map((priority) => ({
        label: TICKET_PRIORITY_META[priority].label,
        value: counts[priority],
        color: ordinalVar(TICKET_PRIORITY_META[priority].rank),
      }))}
    />
  );
}
