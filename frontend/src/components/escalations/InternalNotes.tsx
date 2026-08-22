"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button, IconButton } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Field";
import { EmptyState, InlineAlert, LoadingRows } from "@/components/ui/States";
import { Avatar } from "@/components/ui/Avatar";
import { useToast } from "@/components/ui/Toast";
import { ticketsApi } from "@/lib/api";
import type { TicketNote } from "@/lib/api/types";
import { useAsyncAction, useResource } from "@/lib/hooks";
import { formatRelative } from "@/lib/utils";
import { StickyNote } from "lucide-react";

/** Notes are internal-only: they never appear in the customer-facing thread. */
export function InternalNotes({
  ticketId,
  currentUserId,
  canEdit,
}: {
  ticketId: string;
  currentUserId: string | null;
  canEdit: boolean;
}) {
  const toast = useToast();
  const [draft, setDraft] = useState("");
  const notes = useResource<TicketNote[]>(() => ticketsApi.notes(ticketId), [ticketId]);

  const add = useAsyncAction(async () => {
    const note = await ticketsApi.addNote(ticketId, draft.trim());
    notes.setData((prev) => [...(prev ?? []), note]);
    setDraft("");
    toast("Internal note added.");
  });

  const remove = useAsyncAction(async (noteId: string) => {
    await ticketsApi.removeNote(noteId);
    notes.setData((prev) => (prev ?? []).filter((n) => n.id !== noteId));
    toast("Note deleted.");
  });

  return (
    <div className="space-y-3">
      {(add.error || remove.error) && (
        <InlineAlert>{add.error ?? remove.error}</InlineAlert>
      )}

      {notes.initialLoading ? (
        <LoadingRows rows={2} className="p-0" />
      ) : (notes.data?.length ?? 0) === 0 ? (
        <EmptyState
          icon={StickyNote}
          title="No internal notes"
          description="Notes stay on the escalation and are never shown to the customer."
          className="py-8"
        />
      ) : (
        <ul className="space-y-3">
          {notes.data!.map((note) => (
            <li key={note.id} className="flex gap-2.5">
              <Avatar name={note.author_name} size="xs" className="mt-0.5" />
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-baseline gap-x-2">
                  <span className="text-[12.5px] font-medium text-fg">
                    {note.author_name}
                  </span>
                  <span className="text-[11.5px] text-subtle">
                    {formatRelative(note.created_at)}
                  </span>
                </p>
                <p className="mt-0.5 whitespace-pre-wrap text-[13px] leading-relaxed text-muted">
                  {note.content}
                </p>
              </div>
              {canEdit && note.author_id === currentUserId && (
                <IconButton
                  label="Delete note"
                  size="sm"
                  onClick={() => remove.run(note.id)}
                  className="-mr-1 shrink-0"
                >
                  <Trash2 className="size-3.5" />
                </IconButton>
              )}
            </li>
          ))}
        </ul>
      )}

      {canEdit && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (draft.trim()) add.run();
          }}
          className="space-y-2 border-t border-line pt-3"
        >
          <label htmlFor={`note-${ticketId}`} className="sr-only">
            Add an internal note
          </label>
          <Textarea
            id={`note-${ticketId}`}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Add an internal note…"
            rows={2}
            className="min-h-16 text-[13px]"
          />
          <Button
            type="submit"
            size="sm"
            variant="secondary"
            loading={add.pending}
            disabled={!draft.trim()}
          >
            Add note
          </Button>
        </form>
      )}
    </div>
  );
}
