"use client";

import { useState } from "react";
import { AlertTriangle, Clock } from "lucide-react";
import { Select } from "@/components/ui/Field";
import { Badge } from "@/components/ui/Badge";
import { InlineAlert } from "@/components/ui/States";
import { useToast } from "@/components/ui/Toast";
import { ticketsApi } from "@/lib/api";
import {
  TICKET_PRIORITIES,
  TICKET_STATUSES,
  type OrganizationMember,
  type Ticket,
  type TicketPriority,
  type TicketStatus,
} from "@/lib/api/types";
import { TICKET_PRIORITY_META, TICKET_STATUS_META } from "@/lib/domain";
import { useAsyncAction } from "@/lib/hooks";
import { formatRelative } from "@/lib/utils";

/**
 * Status, priority and assignment for one escalation. Every change is a
 * separate backend call (`PATCH /tickets/{id}/status|priority|assign`) and is
 * recorded as an immutable ticket event.
 */
export function EscalationControls({
  ticket,
  members,
  onChange,
  canEdit,
}: {
  ticket: Ticket;
  members: OrganizationMember[];
  onChange: (next: Ticket) => void;
  canEdit: boolean;
}) {
  const toast = useToast();
  const [pendingField, setPendingField] = useState<string | null>(null);

  const update = useAsyncAction(
    async (field: "status" | "priority" | "assignee", value: string) => {
      setPendingField(field);
      try {
        let next: Ticket;
        if (field === "status") {
          next = await ticketsApi.updateStatus(ticket.id, value as TicketStatus);
          toast(`Status set to ${TICKET_STATUS_META[value as TicketStatus].label}.`);
        } else if (field === "priority") {
          next = await ticketsApi.updatePriority(ticket.id, value as TicketPriority);
          toast(`Priority set to ${TICKET_PRIORITY_META[value as TicketPriority].label}.`);
        } else {
          next = await ticketsApi.assign(ticket.id, value);
          toast("Escalation reassigned.");
        }
        onChange(next);
        return next;
      } finally {
        setPendingField(null);
      }
    },
  );

  const breached = ticket.sla_deadline === "Breached";

  return (
    <div className="space-y-4">
      {update.error && <InlineAlert>{update.error}</InlineAlert>}

      <div
        className={
          breached
            ? "flex items-center gap-2 rounded-control border border-danger/25 bg-danger-soft px-3 py-2 text-[12.5px] text-danger"
            : "flex items-center gap-2 rounded-control border border-line bg-surface-2 px-3 py-2 text-[12.5px] text-muted"
        }
      >
        {breached ? (
          <AlertTriangle className="size-3.5 shrink-0" />
        ) : (
          <Clock className="size-3.5 shrink-0" />
        )}
        <span>
          {breached ? "SLA breached" : `SLA: ${ticket.sla_deadline}`}
          <span className="ml-1.5 text-subtle">
            · opened {formatRelative(ticket.created_at)}
          </span>
        </span>
      </div>

      <div className="space-y-3">
        <label className="block">
          <span className="mb-1.5 block text-[12.5px] font-medium text-fg">Status</span>
          <Select
            value={ticket.status}
            disabled={!canEdit || pendingField === "status"}
            onChange={(e) => update.run("status", e.target.value)}
          >
            {TICKET_STATUSES.map((status) => (
              <option key={status} value={status}>
                {TICKET_STATUS_META[status].label}
              </option>
            ))}
          </Select>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-[12.5px] font-medium text-fg">Priority</span>
          <Select
            value={ticket.priority}
            disabled={!canEdit || pendingField === "priority"}
            onChange={(e) => update.run("priority", e.target.value)}
          >
            {TICKET_PRIORITIES.map((priority) => (
              <option key={priority} value={priority}>
                {TICKET_PRIORITY_META[priority].label}
              </option>
            ))}
          </Select>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-[12.5px] font-medium text-fg">
            Assigned to
          </span>
          <Select
            value={ticket.assigned_to_user_id ?? ""}
            disabled={!canEdit || pendingField === "assignee" || members.length === 0}
            onChange={(e) => {
              if (e.target.value) update.run("assignee", e.target.value);
            }}
          >
            <option value="">Unassigned</option>
            {members.map((member) => (
              <option key={member.id} value={member.id}>
                {member.full_name}
              </option>
            ))}
          </Select>
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 border-t border-line pt-3">
        <Badge tone={TICKET_STATUS_META[ticket.status].tone} dot>
          {TICKET_STATUS_META[ticket.status].label}
        </Badge>
        <Badge tone={TICKET_PRIORITY_META[ticket.priority].tone}>
          {TICKET_PRIORITY_META[ticket.priority].label}
        </Badge>
        {ticket.created_by_ai && <Badge tone="accent">Escalated by AI</Badge>}
      </div>

      {!canEdit && (
        <p className="text-[12px] leading-relaxed text-subtle">
          Your role can view this escalation but not change it.
        </p>
      )}
    </div>
  );
}
