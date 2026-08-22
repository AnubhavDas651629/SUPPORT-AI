"use client";

import { LoadingRows } from "@/components/ui/States";
import { ticketsApi } from "@/lib/api";
import type { TicketEvent } from "@/lib/api/types";
import { AUDIT_EVENT_LABELS } from "@/lib/derived/auditLog";
import { useResource } from "@/lib/hooks";
import { formatRelative } from "@/lib/utils";

/** The immutable event stream the backend keeps for each escalation. */
export function EventTimeline({ ticketId }: { ticketId: string }) {
  const events = useResource<TicketEvent[]>(
    () => ticketsApi.events(ticketId),
    [ticketId],
  );

  if (events.initialLoading) return <LoadingRows rows={3} className="p-0" />;

  if (events.error) {
    return <p className="text-[12.5px] text-subtle">Couldn&apos;t load the event log.</p>;
  }

  if (!events.data || events.data.length === 0) {
    return <p className="text-[12.5px] text-subtle">No events recorded yet.</p>;
  }

  return (
    <ol className="space-y-0">
      {events.data.map((event, i) => (
        <li key={event.id} className="relative flex gap-3 pb-4 last:pb-0">
          {i < events.data!.length - 1 && (
            <span
              className="absolute left-[3px] top-2.5 h-full w-px bg-line"
              aria-hidden="true"
            />
          )}
          <span
            className="relative z-10 mt-1.5 size-[7px] shrink-0 rounded-full bg-line-strong"
            aria-hidden="true"
          />
          <div className="min-w-0 flex-1">
            <p className="text-[12.5px] font-medium text-fg">
              {AUDIT_EVENT_LABELS[event.event_type] ?? event.event_type}
            </p>
            <p className="mt-0.5 text-[12.5px] leading-relaxed text-muted">
              {event.description}
            </p>
            <p className="mt-0.5 text-[11.5px] text-subtle">
              {formatRelative(event.created_at)}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}
