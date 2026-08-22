/**
 * The audit log.
 *
 * `GET /tickets/{id}/events` is the only immutable event stream the backend
 * keeps (`app/models/ticket_event.py`): who did what to which escalation, and
 * when. The audit view fans out over the organization's escalations and merges
 * those streams into one chronological log.
 *
 * Organization-level events (member invited, API key created, settings changed)
 * are not recorded server-side today, so they do not appear here. That gap is
 * stated in the UI rather than filled with invented rows.
 */
import { ticketsApi } from "@/lib/api";
import type { Ticket, TicketEvent, TicketEventType } from "@/lib/api/types";

export interface AuditEntry {
  id: string;
  createdAt: string;
  eventType: TicketEventType;
  description: string;
  actorId: string | null;
  ticketId: string;
  ticketSubject: string;
}

export const AUDIT_EVENT_LABELS: Record<TicketEventType, string> = {
  CREATED: "Escalation created",
  ASSIGNED: "Assigned",
  STATUS_CHANGED: "Status changed",
  PRIORITY_CHANGED: "Priority changed",
  REPLIED: "Reply sent",
  NOTE_ADDED: "Internal note added",
  CLOSED: "Closed",
};

/**
 * Fetches events for the given escalations in parallel and flattens them.
 * Capped because each ticket costs one request — the backend has no bulk
 * event endpoint.
 */
export async function loadAuditLog(tickets: Ticket[], maxTickets = 40): Promise<AuditEntry[]> {
  const scoped = tickets.slice(0, maxTickets);

  const results = await Promise.allSettled(
    scoped.map(async (t) => ({ ticket: t, events: await ticketsApi.events(t.id) })),
  );

  const entries: AuditEntry[] = [];
  for (const result of results) {
    if (result.status !== "fulfilled") continue;
    const { ticket, events } = result.value;
    for (const event of events as TicketEvent[]) {
      entries.push({
        id: event.id,
        createdAt: event.created_at,
        eventType: event.event_type,
        description: event.description,
        actorId: event.user_id,
        ticketId: ticket.id,
        ticketSubject: ticket.subject,
      });
    }
  }

  return entries.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}
