"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useOrganization } from "@/context/OrganizationContext";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Field, Input } from "@/components/ui/Field";
import { InlineAlert } from "@/components/ui/States";
import { useAsyncAction } from "@/lib/hooks";

export function OrgSwitcher({ onNavigate }: { onNavigate?: () => void }) {
  const router = useRouter();
  const { organizations, currentOrg, selectOrg, createOrganization } = useOrganization();
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");

  const create = useAsyncAction(async (orgName: string) => {
    const org = await createOrganization(orgName);
    setCreating(false);
    setName("");
    onNavigate?.();
    router.push("/dashboard");
    return org;
  });

  return (
    <>
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-haspopup="listbox"
          aria-expanded={open}
          className={cn(
            "flex w-full items-center gap-2 rounded-control border border-line px-2.5 py-2",
            "text-left transition-colors hover:bg-surface-2",
          )}
        >
          <span
            aria-hidden="true"
            className="flex size-6 shrink-0 items-center justify-center rounded-[5px] bg-accent-soft text-[11px] font-semibold text-accent-text"
          >
            {(currentOrg?.name ?? "?").slice(0, 2).toUpperCase()}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[13px] font-medium text-fg">
              {currentOrg?.name ?? "No organization"}
            </span>
            <span className="block truncate text-[11px] text-subtle">
              {currentOrg ? `/${currentOrg.slug}` : "Create one to begin"}
            </span>
          </span>
          <ChevronsUpDown className="size-3.5 shrink-0 text-subtle" />
        </button>

        {open && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setOpen(false)}
              aria-hidden="true"
            />
            <div
              role="listbox"
              aria-label="Switch organization"
              className="absolute left-0 right-0 z-50 mt-1 animate-scale-in rounded-panel border border-line bg-surface p-1 shadow-lg"
            >
              {organizations.map((org) => (
                <button
                  key={org.id}
                  role="option"
                  aria-selected={org.id === currentOrg?.id}
                  onClick={() => {
                    selectOrg(org.id);
                    setOpen(false);
                  }}
                  className="flex w-full items-center gap-2 rounded-[5px] px-2 py-1.5 text-left text-[13px] text-fg transition-colors hover:bg-surface-2"
                >
                  <span className="min-w-0 flex-1 truncate">{org.name}</span>
                  {org.id === currentOrg?.id && (
                    <Check className="size-3.5 shrink-0 text-accent-text" />
                  )}
                </button>
              ))}
              <div className="my-1 border-t border-line" />
              <button
                onClick={() => {
                  setOpen(false);
                  setCreating(true);
                }}
                className="flex w-full items-center gap-2 rounded-[5px] px-2 py-1.5 text-left text-[13px] text-muted transition-colors hover:bg-surface-2 hover:text-fg"
              >
                <Plus className="size-3.5" />
                New organization
              </button>
            </div>
          </>
        )}
      </div>

      <Dialog
        open={creating}
        onClose={() => setCreating(false)}
        title="Create an organization"
        description="Organizations own their own knowledge bases, conversations, members and API keys."
        size="sm"
        footer={
          <>
            <Button size="sm" onClick={() => setCreating(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              variant="primary"
              loading={create.pending}
              disabled={name.trim().length < 2}
              onClick={() => create.run(name.trim())}
            >
              Create
            </Button>
          </>
        }
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (name.trim().length >= 2) create.run(name.trim());
          }}
          className="space-y-3"
        >
          {create.error && <InlineAlert>{create.error}</InlineAlert>}
          <Field label="Organization name" htmlFor="org-name" required>
            <Input
              id="org-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Northwind Logistics"
              minLength={2}
              maxLength={100}
              autoFocus
            />
          </Field>
        </form>
      </Dialog>
    </>
  );
}
