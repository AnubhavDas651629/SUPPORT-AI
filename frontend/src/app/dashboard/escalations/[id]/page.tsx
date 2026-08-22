"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, MessagesSquare, Send, Trash2 } from "lucide-react";
import { Panel, PanelHeader } from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Field";
import { ConfirmDialog } from "@/components/ui/Dialog";
import { ErrorState, InlineAlert, LoadingRows } from "@/components/ui/States";
import { useToast } from "@/components/ui/Toast";
import { MessageThread } from "@/components/conversations/MessageThread";
import { EscalationControls } from "@/components/escalations/EscalationControls";
import { InternalNotes } from "@/components/escalations/InternalNotes";
import { EventTimeline } from "@/components/escalations/EventTimeline";
import { conversationsApi, membersApi, ticketsApi } from "@/lib/api";
import type { ConversationDetail, Ticket } from "@/lib/api/types";
import { canWorkQueue } from "@/lib/domain";
import { getAgent, guessRoute } from "@/lib/agents";
import { useAsyncAction, useResource } from "@/lib/hooks";
import { useAuth } from "@/context/AuthContext";
import { useOrganization } from "@/context/OrganizationContext";

export default function EscalationDetailPage() {
  const params = useParams<{ id: string }>();
  const ticketId = params.id;
  const router = useRouter();
  const toast = useToast();
  const { user } = useAuth();
  const { currentOrg, role } = useOrganization();
  const canEdit = canWorkQueue(role);

  const [reply, setReply] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);

  const ticket = useResource<Ticket>(() => ticketsApi.get(ticketId), [ticketId]);

  const conversation = useResource<ConversationDetail>(
    () => conversationsApi.get(ticket.data!.conversation_id),
    [ticket.data?.conversation_id],
  );

  const members = useResource(() => membersApi.list(currentOrg!.id), [currentOrg?.id]);

  const sendReply = useAsyncAction(async () => {
    const message = await ticketsApi.reply(ticketId, reply.trim());
    conversation.setData((prev) =>
      prev ? { ...prev, messages: [...prev.messages, message] } : prev,
    );
    setReply("");
    toast("Reply sent to the customer.");
  });

  const remove = useAsyncAction(async () => {
    await ticketsApi.remove(ticketId);
    toast("Escalation deleted.");
    router.push("/dashboard/escalations");
  });

  if (ticket.error) {
    return (
      <div className="space-y-6">
        <BackLink />
        <Panel>
          <ErrorState message={ticket.error} onRetry={ticket.refetch} />
        </Panel>
      </div>
    );
  }

  if (ticket.initialLoading || !ticket.data) {
    return (
      <div className="space-y-6">
        <BackLink />
        <Panel>
          <LoadingRows rows={6} />
        </Panel>
      </div>
    );
  }

  const agent = getAgent(guessRoute(ticket.data.subject));

  return (
    <div className="space-y-6">
      <BackLink />

      <header className="flex flex-col gap-3 border-b border-line pb-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-[-0.01em] text-fg">
            {ticket.data.subject}
          </h1>
          <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12.5px] text-subtle">
            <span className="font-mono">{ticket.data.id.slice(0, 8)}</span>
            <span aria-hidden="true">·</span>
            <Link
              href={`/dashboard/conversations?id=${ticket.data.conversation_id}`}
              className="inline-flex items-center gap-1 rounded font-medium text-accent hover:underline"
            >
              <MessagesSquare className="size-3" />
              View conversation
            </Link>
            {agent && (
              <>
                <span aria-hidden="true">·</span>
                <span>{agent.name}</span>
              </>
            )}
          </p>
        </div>
        {canEdit && (
          <Button size="sm" variant="ghost" onClick={() => setDeleteOpen(true)}>
            <Trash2 className="size-3.5" />
            Delete
          </Button>
        )}
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-6">
          <Panel>
            <PanelHeader title="Conversation" />
            {conversation.error ? (
              <ErrorState message={conversation.error} onRetry={conversation.refetch} />
            ) : conversation.initialLoading || !conversation.data ? (
              <LoadingRows rows={4} />
            ) : (
              <div className="max-h-[32rem] overflow-y-auto">
                <MessageThread messages={conversation.data.messages} />
              </div>
            )}

            {canEdit && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (reply.trim()) sendReply.run();
                }}
                className="border-t border-line p-3 sm:p-4"
              >
                {sendReply.error && (
                  <InlineAlert className="mb-2">{sendReply.error}</InlineAlert>
                )}
                <label htmlFor="escalation-reply" className="sr-only">
                  Reply to the customer
                </label>
                <Textarea
                  id="escalation-reply"
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  placeholder="Reply as a human agent…"
                  rows={3}
                />
                <div className="mt-2 flex items-center justify-between gap-3">
                  <p className="text-[11.5px] text-subtle">
                    Recorded on the escalation&apos;s event log.
                  </p>
                  <Button
                    type="submit"
                    size="sm"
                    variant="primary"
                    loading={sendReply.pending}
                    disabled={!reply.trim()}
                  >
                    <Send className="size-3.5" />
                    Send reply
                  </Button>
                </div>
              </form>
            )}
          </Panel>

          <Panel>
            <PanelHeader
              title="Internal notes"
              description="Visible to your team only"
            />
            <div className="p-4 sm:p-5">
              <InternalNotes
                ticketId={ticketId}
                currentUserId={user?.id ?? null}
                canEdit={canEdit}
              />
            </div>
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel>
            <PanelHeader title="Details" />
            <div className="p-4 sm:p-5">
              <EscalationControls
                ticket={ticket.data}
                members={members.data ?? []}
                onChange={(next) => ticket.setData(next)}
                canEdit={canEdit}
              />
            </div>
          </Panel>

          <Panel>
            <PanelHeader title="Activity" description="Immutable event log" />
            <div className="p-4 sm:p-5">
              <EventTimeline ticketId={ticketId} />
            </div>
          </Panel>
        </div>
      </div>

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => remove.run()}
        title="Delete this escalation?"
        message="The escalation, its notes and its event log are permanently removed. The underlying conversation is kept."
        confirmLabel="Delete escalation"
        destructive
        loading={remove.pending}
      />
    </div>
  );
}

function BackLink() {
  return (
    <Link
      href="/dashboard/escalations"
      className="inline-flex items-center gap-1.5 rounded text-[13px] text-muted transition-colors hover:text-fg"
    >
      <ArrowLeft className="size-3.5" />
      All escalations
    </Link>
  );
}
