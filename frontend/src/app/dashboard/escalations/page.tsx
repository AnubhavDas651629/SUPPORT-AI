"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { TicketCheck } from "lucide-react";
import { PageHeader, Panel } from "@/components/ui/Panel";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Field";
import { SearchInput } from "@/components/ui/SearchInput";
import { Table, TableWrap, Td, Th, Tr } from "@/components/ui/Table";
import { EmptyState, ErrorState, LoadingRows } from "@/components/ui/States";
import { Avatar } from "@/components/ui/Avatar";
import { membersApi, ticketsApi, apiErrorMessage } from "@/lib/api";
import {
  TICKET_PRIORITIES,
  TICKET_STATUSES,
  type Ticket,
  type TicketPriority,
  type TicketStatus,
} from "@/lib/api/types";
import { TICKET_PRIORITY_META, TICKET_STATUS_META } from "@/lib/domain";
import { useOrganization } from "@/context/OrganizationContext";
import { useResource } from "@/lib/hooks";
import { formatRelative, truncate } from "@/lib/utils";

export default function EscalationsPage() {
  const router = useRouter();
  const { currentOrg } = useOrganization();
  const orgId = currentOrg?.id ?? null;

  const [status, setStatus] = useState<TicketStatus | "">("");
  const [priority, setPriority] = useState<TicketPriority | "">("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // The list endpoint takes `search` server-side, so debounce keystrokes.
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const queryKey = `${status}|${priority}|${debouncedSearch}`;

  /**
   * Pages loaded past the first are keyed by the query that produced them, so
   * changing a filter discards them without an effect-driven reset.
   */
  const [accumulated, setAccumulated] = useState<{
    queryKey: string;
    items: Ticket[];
    cursor: string | null;
    hasMore: boolean;
  } | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState<string | null>(null);

  const page = useResource(
    () =>
      ticketsApi.list(orgId!, {
        status: status || undefined,
        priority: priority || undefined,
        search: debouncedSearch || undefined,
        limit: 25,
      }),
    [orgId, status, priority, debouncedSearch],
  );

  const current = accumulated?.queryKey === queryKey ? accumulated : null;
  const cursor = current?.cursor ?? page.data?.next_cursor ?? null;
  const hasMore = current?.hasMore ?? page.data?.has_more ?? false;

  const members = useResource(() => membersApi.list(orgId!), [orgId]);
  const memberById = useMemo(
    () => new Map((members.data ?? []).map((m) => [m.id, m])),
    [members.data],
  );

  const tickets = useMemo(
    () => [...(page.data?.items ?? []), ...(current?.items ?? [])],
    [page.data, current],
  );

  const loadMore = useCallback(async () => {
    if (!orgId || !cursor) return;
    setLoadingMore(true);
    setLoadMoreError(null);
    try {
      const next = await ticketsApi.list(orgId, {
        status: status || undefined,
        priority: priority || undefined,
        search: debouncedSearch || undefined,
        cursor,
        limit: 25,
      });
      setAccumulated((prev) => ({
        queryKey,
        items: [...(prev?.queryKey === queryKey ? prev.items : []), ...next.items],
        cursor: next.next_cursor,
        hasMore: next.has_more,
      }));
    } catch (err) {
      setLoadMoreError(apiErrorMessage(err));
    } finally {
      setLoadingMore(false);
    }
  }, [orgId, cursor, status, priority, debouncedSearch, queryKey]);

  const activeFilters = Boolean(status || priority || debouncedSearch);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Escalations"
        description="Conversations Support-AI handed to your team, with an SLA clock on each one."
      />

      <Panel>
        <div className="flex flex-col gap-2 border-b border-line p-3 sm:flex-row sm:items-center">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search subjects"
            label="Search escalations"
            className="sm:max-w-xs"
          />
          <div className="flex gap-2 sm:ml-auto">
            <Select
              value={status}
              onChange={(e) => setStatus(e.target.value as TicketStatus | "")}
              aria-label="Filter by status"
              className="h-9 text-[13px]"
            >
              <option value="">All statuses</option>
              {TICKET_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {TICKET_STATUS_META[s].label}
                </option>
              ))}
            </Select>
            <Select
              value={priority}
              onChange={(e) => setPriority(e.target.value as TicketPriority | "")}
              aria-label="Filter by priority"
              className="h-9 text-[13px]"
            >
              <option value="">All priorities</option>
              {TICKET_PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {TICKET_PRIORITY_META[p].label}
                </option>
              ))}
            </Select>
          </div>
        </div>

        {page.error ? (
          <ErrorState message={page.error} onRetry={page.refetch} />
        ) : page.initialLoading ? (
          <LoadingRows rows={8} />
        ) : tickets.length === 0 ? (
          <EmptyState
            icon={TicketCheck}
            title={activeFilters ? "No escalations match" : "No escalations yet"}
            description={
              activeFilters
                ? "Try clearing the filters."
                : "Support-AI escalates automatically when it can't answer with confidence."
            }
            action={
              activeFilters ? (
                <Button
                  size="sm"
                  onClick={() => {
                    setStatus("");
                    setPriority("");
                    setSearch("");
                  }}
                >
                  Clear filters
                </Button>
              ) : undefined
            }
          />
        ) : (
          <>
            <TableWrap>
              <Table>
                <thead>
                  <tr>
                    <Th>Subject</Th>
                    <Th>Status</Th>
                    <Th>Priority</Th>
                    <Th>Assignee</Th>
                    <Th>SLA</Th>
                    <Th className="text-right">Opened</Th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((ticket) => {
                    const assignee = ticket.assigned_to_user_id
                      ? memberById.get(ticket.assigned_to_user_id)
                      : null;
                    return (
                      <Tr
                        key={ticket.id}
                        interactive
                        tabIndex={0}
                        role="link"
                        onClick={() => router.push(`/dashboard/escalations/${ticket.id}`)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            router.push(`/dashboard/escalations/${ticket.id}`);
                          }
                        }}
                      >
                        <Td className="max-w-md">
                          <span className="block truncate font-medium text-fg">
                            {truncate(ticket.subject, 70)}
                          </span>
                          {ticket.created_by_ai && (
                            <span className="mt-0.5 block text-[11.5px] text-subtle">
                              Escalated by Support-AI
                            </span>
                          )}
                        </Td>
                        <Td>
                          <Badge tone={TICKET_STATUS_META[ticket.status].tone} dot>
                            {TICKET_STATUS_META[ticket.status].label}
                          </Badge>
                        </Td>
                        <Td>
                          <Badge tone={TICKET_PRIORITY_META[ticket.priority].tone}>
                            {TICKET_PRIORITY_META[ticket.priority].label}
                          </Badge>
                        </Td>
                        <Td>
                          {assignee ? (
                            <span className="flex items-center gap-2">
                              <Avatar name={assignee.full_name} size="xs" />
                              <span className="text-[13px] text-fg">
                                {assignee.full_name}
                              </span>
                            </span>
                          ) : (
                            <span className="text-[13px] text-subtle">Unassigned</span>
                          )}
                        </Td>
                        <Td>
                          <span
                            className={
                              ticket.sla_deadline === "Breached"
                                ? "text-[13px] font-medium text-danger"
                                : "text-[13px] text-muted"
                            }
                          >
                            {ticket.sla_deadline}
                          </span>
                        </Td>
                        <Td className="text-right text-[13px] text-subtle whitespace-nowrap">
                          {formatRelative(ticket.created_at)}
                        </Td>
                      </Tr>
                    );
                  })}
                </tbody>
              </Table>
            </TableWrap>

            <div className="flex items-center justify-between gap-3 border-t border-line px-4 py-3">
              <p className="text-[12.5px] text-subtle">
                Showing {tickets.length} escalation{tickets.length === 1 ? "" : "s"}
              </p>
              {hasMore && (
                <Button size="sm" loading={loadingMore} onClick={loadMore}>
                  Load more
                </Button>
              )}
            </div>
            {loadMoreError && (
              <p className="px-4 pb-3 text-[12.5px] text-danger" role="alert">
                {loadMoreError}
              </p>
            )}
          </>
        )}
      </Panel>
    </div>
  );
}
