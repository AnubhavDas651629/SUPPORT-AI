"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ScrollText } from "lucide-react";
import { PageHeader, Panel } from "@/components/ui/Panel";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Select } from "@/components/ui/Field";
import { SearchInput } from "@/components/ui/SearchInput";
import { Table, TableWrap, Td, Th, Tr } from "@/components/ui/Table";
import { EmptyState, ErrorState, LoadingRows } from "@/components/ui/States";
import { DerivedNote } from "@/components/dashboard/DerivedNote";
import { membersApi } from "@/lib/api";
import { TICKET_EVENT_TYPES, type TicketEventType } from "@/lib/api/types";
import { AUDIT_EVENT_LABELS, loadAuditLog, type AuditEntry } from "@/lib/derived/auditLog";
import { useOrganization } from "@/context/OrganizationContext";
import { useResource, useSupportSnapshot } from "@/lib/hooks";
import { formatDateTime, truncate } from "@/lib/utils";

export default function AuditLogsPage() {
  const { currentOrg } = useOrganization();
  const snapshot = useSupportSnapshot({ limit: 100 });

  const [query, setQuery] = useState("");
  const [eventType, setEventType] = useState<TicketEventType | "">("");

  const members = useResource(() => membersApi.list(currentOrg!.id), [currentOrg?.id]);
  const memberById = useMemo(
    () => new Map((members.data ?? []).map((m) => [m.id, m])),
    [members.data],
  );

  // One request per escalation — the backend has no bulk event endpoint — so
  // this is keyed on the ticket ids and only runs once they have loaded.
  const tickets = snapshot.tickets;
  const ticketKey = tickets.map((t) => t.id).join(",");
  const log = useResource<AuditEntry[]>(
    () => loadAuditLog(tickets),
    [ticketKey],
    { enabled: !snapshot.initialLoading },
  );

  const entries = log.data;
  const loading = log.loading;
  const error = log.error;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (entries ?? []).filter((entry) => {
      if (eventType && entry.eventType !== eventType) return false;
      if (!q) return true;
      const actor = entry.actorId ? memberById.get(entry.actorId)?.full_name ?? "" : "";
      return [entry.description, entry.ticketSubject, actor].some((field) =>
        field.toLowerCase().includes(q),
      );
    });
  }, [entries, query, eventType, memberById]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit log"
        description="Who changed what on which escalation, and when."
      />

      <Panel>
        <div className="flex flex-col gap-2 border-b border-line p-3 sm:flex-row sm:items-center">
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Search actor, action or subject"
            label="Search the audit log"
            className="sm:max-w-sm"
          />
          <Select
            value={eventType}
            onChange={(e) => setEventType(e.target.value as TicketEventType | "")}
            aria-label="Filter by action"
            className="h-9 text-[13px] sm:ml-auto sm:w-52"
          >
            <option value="">All actions</option>
            {TICKET_EVENT_TYPES.map((type) => (
              <option key={type} value={type}>
                {AUDIT_EVENT_LABELS[type]}
              </option>
            ))}
          </Select>
        </div>

        {error || snapshot.error ? (
          <ErrorState
            message={error ?? snapshot.error ?? undefined}
            onRetry={snapshot.refetch}
          />
        ) : loading || snapshot.initialLoading ? (
          <LoadingRows rows={8} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={ScrollText}
            title={entries?.length ? "No entries match" : "Nothing recorded yet"}
            description={
              entries?.length
                ? "Try a different search or action filter."
                : "Events are written when an escalation is created, assigned, replied to or closed."
            }
          />
        ) : (
          <TableWrap>
            <Table>
              <thead>
                <tr>
                  <Th>When</Th>
                  <Th>Actor</Th>
                  <Th>Action</Th>
                  <Th>Detail</Th>
                  <Th>Resource</Th>
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0, 300).map((entry) => {
                  const actor = entry.actorId ? memberById.get(entry.actorId) : null;
                  return (
                    <Tr key={entry.id}>
                      <Td className="whitespace-nowrap text-[12.5px] text-muted">
                        {formatDateTime(entry.createdAt)}
                      </Td>
                      <Td>
                        {actor ? (
                          <span className="flex items-center gap-2">
                            <Avatar name={actor.full_name} size="xs" />
                            <span className="text-[13px] text-fg">{actor.full_name}</span>
                          </span>
                        ) : (
                          <span className="flex items-center gap-2">
                            <span
                              aria-hidden="true"
                              className="flex size-5 items-center justify-center rounded-full bg-accent-soft text-[9px] font-semibold text-accent-text"
                            >
                              AI
                            </span>
                            <span className="text-[13px] text-muted">Support-AI</span>
                          </span>
                        )}
                      </Td>
                      <Td>
                        <Badge>{AUDIT_EVENT_LABELS[entry.eventType] ?? entry.eventType}</Badge>
                      </Td>
                      <Td className="max-w-sm text-[13px] text-muted">
                        <span className="block truncate">{entry.description}</span>
                      </Td>
                      <Td className="max-w-xs">
                        <Link
                          href={`/dashboard/escalations/${entry.ticketId}`}
                          className="block truncate rounded text-[13px] text-accent-text hover:underline"
                        >
                          {truncate(entry.ticketSubject, 40)}
                        </Link>
                      </Td>
                    </Tr>
                  );
                })}
              </tbody>
            </Table>
          </TableWrap>
        )}
      </Panel>

      <DerivedNote>
        Assembled from <code className="font-mono">GET /tickets/{"{id}"}/events</code>{" "}
        across your most recent escalations (capped at 40 to keep the request count
        sane — there is no bulk event endpoint). Organization-level actions such as
        inviting a member, creating an API key or changing settings are not recorded
        server-side today, so they don&apos;t appear here.
      </DerivedNote>
    </div>
  );
}
