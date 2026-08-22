"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Send, Trash2, TicketPlus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Textarea, Select } from "@/components/ui/Field";
import { Tabs, TabPanel } from "@/components/ui/Tabs";
import { ConfirmDialog, Dialog } from "@/components/ui/Dialog";
import { ErrorState, InlineAlert, LoadingRows } from "@/components/ui/States";
import { useToast } from "@/components/ui/Toast";
import { conversationsApi, ticketsApi } from "@/lib/api";
import {
  TICKET_PRIORITIES,
  type ConversationDetail as ConversationDetailData,
  type OrganizationMember,
  type Ticket,
  type TicketPriority,
} from "@/lib/api/types";
import { TICKET_PRIORITY_META, TICKET_STATUS_META, canWorkQueue } from "@/lib/domain";
import { getAgent, guessRoute } from "@/lib/agents";
import { useAsyncAction, useResource } from "@/lib/hooks";
import { useOrganization } from "@/context/OrganizationContext";
import { useAuth } from "@/context/AuthContext";
import { EscalationControls } from "@/components/escalations/EscalationControls";
import { InternalNotes } from "@/components/escalations/InternalNotes";
import { EventTimeline } from "@/components/escalations/EventTimeline";
import { MessageThread } from "./MessageThread";

export function ConversationDetail({
  conversationId,
  ticket,
  members,
  onTicketChange,
  onDeleted,
}: {
  conversationId: string;
  ticket: Ticket | null;
  members: OrganizationMember[];
  onTicketChange: (ticket: Ticket) => void;
  onDeleted: () => void;
}) {
  const toast = useToast();
  const { user } = useAuth();
  const { role } = useOrganization();
  const canEdit = canWorkQueue(role);

  const [reply, setReply] = useState("");
  const [escalateOpen, setEscalateOpen] = useState(false);
  const [priority, setPriority] = useState<TicketPriority>("MEDIUM");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [tab, setTab] = useState("context");

  const detail = useResource<ConversationDetailData>(
    () => conversationsApi.get(conversationId),
    [conversationId],
  );

  const sendReply = useAsyncAction(async () => {
    const message = await conversationsApi.reply(conversationId, reply.trim());
    detail.setData((prev) =>
      prev ? { ...prev, messages: [...prev.messages, message] } : prev,
    );
    setReply("");
    toast("Reply sent to the customer.");
  });

  const escalate = useAsyncAction(async () => {
    const created = await ticketsApi.create(conversationId, priority);
    onTicketChange(created);
    setEscalateOpen(false);
    toast("Escalation created.");
  });

  const remove = useAsyncAction(async () => {
    await conversationsApi.remove(conversationId);
    setDeleteOpen(false);
    toast("Conversation deleted.");
    onDeleted();
  });

  if (detail.error) {
    return <ErrorState message={detail.error} onRetry={detail.refetch} />;
  }
  if (detail.initialLoading || !detail.data) {
    return <LoadingRows rows={6} />;
  }

  const title = detail.data.title ?? "Untitled conversation";
  const agent = getAgent(guessRoute(title));

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-4 py-3 sm:px-5">
        <div className="min-w-0">
          <h2 className="truncate text-[15px] font-semibold text-fg">{title}</h2>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            {ticket ? (
              <>
                <Badge tone={TICKET_STATUS_META[ticket.status].tone} dot>
                  {TICKET_STATUS_META[ticket.status].label}
                </Badge>
                <Badge tone={TICKET_PRIORITY_META[ticket.priority].tone}>
                  {TICKET_PRIORITY_META[ticket.priority].label}
                </Badge>
                <Link
                  href={`/dashboard/escalations/${ticket.id}`}
                  className="inline-flex items-center gap-0.5 rounded text-[12px] font-medium text-accent-text hover:underline"
                >
                  Open escalation
                  <ArrowUpRight className="size-3" />
                </Link>
              </>
            ) : (
              <Badge tone="success" dot>
                Handled by AI
              </Badge>
            )}
            {agent && <span className="text-[12px] text-subtle">{agent.name}</span>}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {!ticket && canEdit && (
            <Button size="sm" onClick={() => setEscalateOpen(true)}>
              <TicketPlus className="size-3.5" />
              Escalate
            </Button>
          )}
          {canEdit && (
            <Button size="sm" variant="ghost" onClick={() => setDeleteOpen(true)}>
              <Trash2 className="size-3.5" />
              <span className="sr-only sm:not-sr-only">Delete</span>
            </Button>
          )}
        </div>
      </div>

      {/* Thread + context */}
      <div className="flex min-h-0 flex-1 flex-col xl:flex-row">
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto">
            <MessageThread messages={detail.data.messages} />
          </div>

          {canEdit && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (reply.trim()) sendReply.run();
              }}
              className="shrink-0 border-t border-line p-3 sm:p-4"
            >
              {sendReply.error && (
                <InlineAlert className="mb-2">{sendReply.error}</InlineAlert>
              )}
              <label htmlFor="reply" className="sr-only">
                Reply to the customer
              </label>
              <Textarea
                id="reply"
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                placeholder="Reply as a human agent…"
                rows={2}
                className="min-h-16"
                onKeyDown={(e) => {
                  if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && reply.trim()) {
                    e.preventDefault();
                    sendReply.run();
                  }
                }}
              />
              <div className="mt-2 flex items-center justify-between gap-3">
                <p className="text-[11.5px] text-subtle">
                  Sent as a human agent, not the AI. ⌘/Ctrl + Enter
                </p>
                <Button
                  type="submit"
                  size="sm"
                  variant="primary"
                  loading={sendReply.pending}
                  disabled={!reply.trim()}
                >
                  <Send className="size-3.5" />
                  Send
                </Button>
              </div>
            </form>
          )}
        </div>

        {/* Context rail */}
        <aside className="shrink-0 border-t border-line bg-bg-inset xl:w-80 xl:border-l xl:border-t-0">
          <Tabs
            items={[
              { id: "context", label: "Context" },
              { id: "notes", label: "Notes" },
              { id: "activity", label: "Activity" },
            ]}
            value={tab}
            onChange={setTab}
            className="px-2"
          />

          <div className="max-h-96 overflow-y-auto p-4 xl:max-h-none">
            <TabPanel id="context" active={tab === "context"}>
              {ticket ? (
                <EscalationControls
                  ticket={ticket}
                  members={members}
                  onChange={onTicketChange}
                  canEdit={canEdit}
                />
              ) : (
                <div className="space-y-3">
                  <p className="text-[13px] leading-relaxed text-muted">
                    This conversation was resolved without a human. Escalate it to
                    open a tracked ticket with an SLA, an assignee and an event log.
                  </p>
                  {agent && (
                    <div className="rounded-control border border-line bg-surface p-3">
                      <p className="text-[11px] uppercase tracking-[0.07em] text-subtle">
                        Likely handled by
                      </p>
                      <p className="mt-1 text-[13px] font-medium text-fg">
                        {agent.name}
                      </p>
                      <p className="mt-1 text-[12px] leading-relaxed text-muted">
                        {agent.summary}
                      </p>
                      <p className="mt-2 text-[11.5px] text-subtle">
                        Inferred from the subject — the router&apos;s decision is made at
                        answer time and isn&apos;t stored on the conversation.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </TabPanel>

            <TabPanel id="notes" active={tab === "notes"}>
              {ticket ? (
                <InternalNotes
                  ticketId={ticket.id}
                  currentUserId={user?.id ?? null}
                  canEdit={canEdit}
                />
              ) : (
                <p className="text-[13px] leading-relaxed text-muted">
                  Internal notes live on an escalation. Escalate this conversation to
                  start a note thread.
                </p>
              )}
            </TabPanel>

            <TabPanel id="activity" active={tab === "activity"}>
              {ticket ? (
                <EventTimeline ticketId={ticket.id} />
              ) : (
                <p className="text-[13px] leading-relaxed text-muted">
                  The event log starts when a conversation is escalated.
                </p>
              )}
            </TabPanel>
          </div>
        </aside>
      </div>

      {/* Escalate */}
      <Dialog
        open={escalateOpen}
        onClose={() => setEscalateOpen(false)}
        title="Escalate to a human"
        description="Creates a tracked escalation with an SLA clock, an assignee and an immutable event log."
        size="sm"
        footer={
          <>
            <Button size="sm" onClick={() => setEscalateOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              variant="primary"
              loading={escalate.pending}
              onClick={() => escalate.run()}
            >
              Create escalation
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          {escalate.error && <InlineAlert>{escalate.error}</InlineAlert>}
          <label className="block">
            <span className="mb-1.5 block text-[13px] font-medium text-fg">Priority</span>
            <Select
              value={priority}
              onChange={(e) => setPriority(e.target.value as TicketPriority)}
            >
              {TICKET_PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {TICKET_PRIORITY_META[p].label}
                </option>
              ))}
            </Select>
          </label>
          <p className="text-[12.5px] leading-relaxed text-subtle">
            Priority sets the response window: urgent 1h, high 4h, medium 24h, low 48h.
          </p>
        </div>
      </Dialog>

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => remove.run()}
        title="Delete this conversation?"
        message="The conversation and all of its messages are permanently removed. This can't be undone."
        confirmLabel="Delete conversation"
        destructive
        loading={remove.pending}
      />
    </div>
  );
}
