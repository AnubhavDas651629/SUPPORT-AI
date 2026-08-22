"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog, Dialog } from "@/components/ui/Dialog";
import { Field, Input, Textarea } from "@/components/ui/Field";
import { InlineAlert } from "@/components/ui/States";
import { useToast } from "@/components/ui/Toast";
import { knowledgeApi } from "@/lib/api";
import type { KnowledgeBase, KnowledgeBaseListItem } from "@/lib/api/types";
import { useAsyncAction } from "@/lib/hooks";

export function KnowledgeBaseFormDialog({
  open,
  onClose,
  organizationId,
  existing,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  organizationId: string;
  existing?: KnowledgeBaseListItem | KnowledgeBase | null;
  onSaved: (kb: KnowledgeBase) => void;
}) {
  const toast = useToast();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  // Reset the form whenever the dialog opens for a different target. Adjusting
  // state during render (React's documented pattern) avoids the extra render
  // an effect would cause.
  const openFor = open ? (existing?.id ?? "new") : null;
  const [syncedFor, setSyncedFor] = useState<string | null>(null);
  if (openFor !== syncedFor) {
    setSyncedFor(openFor);
    setName(existing?.name ?? "");
    setDescription(existing?.description ?? "");
  }

  const save = useAsyncAction(async () => {
    const payload = { name: name.trim(), description: description.trim() || null };
    const kb = existing
      ? await knowledgeApi.update(organizationId, existing.id, payload)
      : await knowledgeApi.create(organizationId, payload);
    toast(existing ? "Knowledge base updated." : "Knowledge base created.");
    onSaved(kb);
    onClose();
  });

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={existing ? "Edit knowledge base" : "New knowledge base"}
      description={
        existing
          ? undefined
          : "A knowledge base groups the documents an agent retrieves from."
      }
      size="sm"
      footer={
        <>
          <Button size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="sm"
            variant="primary"
            loading={save.pending}
            disabled={!name.trim()}
            onClick={() => save.run()}
          >
            {existing ? "Save changes" : "Create"}
          </Button>
        </>
      }
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (name.trim()) save.run();
        }}
        className="space-y-3"
      >
        {save.error && <InlineAlert>{save.error}</InlineAlert>}
        <Field label="Name" htmlFor="kb-name" required>
          <Input
            id="kb-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Billing & refunds"
            autoFocus
            required
          />
        </Field>
        <Field
          label="Description"
          htmlFor="kb-description"
          hint="Optional. Helps your team know what belongs in here."
        >
          <Textarea
            id="kb-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Refund policy, invoice handling, dunning and payment failures."
          />
        </Field>
      </form>
    </Dialog>
  );
}

export function DeleteKnowledgeBaseDialog({
  open,
  onClose,
  organizationId,
  knowledgeBase,
  onDeleted,
}: {
  open: boolean;
  onClose: () => void;
  organizationId: string;
  knowledgeBase: KnowledgeBaseListItem | KnowledgeBase | null;
  onDeleted: () => void;
}) {
  const toast = useToast();
  const remove = useAsyncAction(async () => {
    if (!knowledgeBase) return;
    await knowledgeApi.remove(organizationId, knowledgeBase.id);
    toast("Knowledge base deleted.");
    onDeleted();
    onClose();
  });

  return (
    <ConfirmDialog
      open={open}
      onClose={onClose}
      onConfirm={() => remove.run()}
      title={`Delete "${knowledgeBase?.name ?? ""}"?`}
      message="Its documents and every indexed chunk are removed. Conversations that used it are kept, but their citations will no longer resolve."
      confirmLabel="Delete knowledge base"
      destructive
      loading={remove.pending}
    />
  );
}
