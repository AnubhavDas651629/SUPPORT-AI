"use client";

import { useMemo } from "react";
import { conversationsApi, ticketsApi } from "@/lib/api";
import type { ConversationSummary, Ticket } from "@/lib/api/types";
import {
  bucketActivity,
  summarize,
  type DayBucket,
  type SupportSummary,
} from "@/lib/derived/analytics";
import { useOrganization } from "@/context/OrganizationContext";
import { useResource } from "./useResource";

export interface SupportSnapshot {
  conversations: ConversationSummary[];
  tickets: Ticket[];
  summary: SupportSummary;
  buckets: DayBucket[];
  loading: boolean;
  initialLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * The organization's recent conversations and escalations, plus the metrics
 * derived from them. Several routes need the same two lists, so they are
 * fetched here rather than duplicated per component.
 *
 * `windowDays` only affects the returned day buckets — the list endpoints have
 * no date filter, so the data is the most recent `limit` rows.
 */
export function useSupportSnapshot({
  limit = 100,
  windowDays = 14,
}: { limit?: number; windowDays?: number } = {}): SupportSnapshot {
  const { currentOrg } = useOrganization();
  const orgId = currentOrg?.id ?? null;

  const conversations = useResource(
    () => conversationsApi.list(orgId!, { limit }),
    [orgId, limit],
  );

  const tickets = useResource(
    () => ticketsApi.list(orgId!, { limit: Math.min(limit, 100) }),
    [orgId, limit],
  );

  const conversationList = useMemo(
    () => conversations.data ?? [],
    [conversations.data],
  );
  const ticketList = useMemo(() => tickets.data?.items ?? [], [tickets.data]);

  const summary = useMemo(
    () => summarize(conversationList, ticketList),
    [conversationList, ticketList],
  );

  const buckets = useMemo(
    () => bucketActivity(conversationList, ticketList, windowDays),
    [conversationList, ticketList, windowDays],
  );

  return {
    conversations: conversationList,
    tickets: ticketList,
    summary,
    buckets,
    loading: conversations.loading || tickets.loading,
    initialLoading: conversations.initialLoading || tickets.initialLoading,
    error: tickets.error ?? conversations.error,
    refetch: async () => {
      await Promise.all([conversations.refetch(), tickets.refetch()]);
    },
  };
}
