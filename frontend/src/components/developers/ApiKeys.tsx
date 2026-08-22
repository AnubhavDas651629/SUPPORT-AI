"use client";

import { useState } from "react";
import { KeyRound, Plus, ShieldAlert } from "lucide-react";
import { Panel, PanelHeader } from "@/components/ui/Panel";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog, Dialog } from "@/components/ui/Dialog";
import { CopyButton } from "@/components/ui/CopyButton";
import { Field, Input } from "@/components/ui/Field";
import { Table, TableWrap, Td, Th, Tr } from "@/components/ui/Table";
import { EmptyState, ErrorState, InlineAlert, LoadingRows } from "@/components/ui/States";
import { useToast } from "@/components/ui/Toast";
import { apiKeysApi } from "@/lib/api";
import type { ApiKey, ApiKeyCreated } from "@/lib/api/types";
import { canManageOrganization } from "@/lib/domain";
import { useAsyncAction, useResource } from "@/lib/hooks";
import { useOrganization } from "@/context/OrganizationContext";
import { formatDate, formatRelative } from "@/lib/utils";

export function ApiKeys() {
  const toast = useToast();
  const { currentOrg, role, subscription } = useOrganization();
  const orgId = currentOrg?.id ?? null;
  const canManage = canManageOrganization(role);
  const planAllows = subscription?.limits.allows_api_keys ?? false;

  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  // Computed when the dialog opens rather than during render — reading the
  // clock while rendering is impure and gives a different answer each pass.
  const [minExpiry, setMinExpiry] = useState("");
  const [revealed, setRevealed] = useState<ApiKeyCreated | null>(null);
  const [revoking, setRevoking] = useState<ApiKey | null>(null);

  const keys = useResource<ApiKey[]>(() => apiKeysApi.list(orgId!), [orgId]);

  const create = useAsyncAction(async () => {
    const created = await apiKeysApi.create(
      orgId!,
      name.trim(),
      expiresAt ? new Date(expiresAt).toISOString() : null,
    );
    setCreateOpen(false);
    setName("");
    setExpiresAt("");
    setRevealed(created);
    keys.refetch();
  });

  const revoke = useAsyncAction(async (keyId: string) => {
    const updated = await apiKeysApi.revoke(orgId!, keyId);
    keys.setData((prev) => (prev ?? []).map((k) => (k.id === updated.id ? updated : k)));
    setRevoking(null);
    toast("API key revoked.");
  });

  return (
    <>
      <Panel>
        <PanelHeader
          title="API keys"
          description="Organization-scoped keys for the widget and your own integrations"
          action={
            <Button
              size="sm"
              variant="primary"
              disabled={!canManage || !planAllows}
              title={
                !planAllows
                  ? "API keys require the Pro or Enterprise plan"
                  : !canManage
                    ? "Only the organization owner can create API keys"
                    : undefined
              }
              onClick={() => {
                setMinExpiry(
                  new Date(Date.now() + 86_400_000).toISOString().slice(0, 10),
                );
                setCreateOpen(true);
              }}
            >
              <Plus className="size-3.5" />
              New key
            </Button>
          }
        />

        {!planAllows && (
          <div className="border-b border-line px-4 py-3 sm:px-5">
            <InlineAlert tone="warning">
              API keys require the Pro or Enterprise plan. Existing keys stay visible but
              new ones can&apos;t be created on Free.
            </InlineAlert>
          </div>
        )}

        {keys.error ? (
          <ErrorState message={keys.error} onRetry={keys.refetch} />
        ) : keys.initialLoading ? (
          <LoadingRows rows={3} />
        ) : (keys.data?.length ?? 0) === 0 ? (
          <EmptyState
            icon={KeyRound}
            title="No API keys"
            description="Create a key to authenticate the embeddable widget or call the API from your own backend."
          />
        ) : (
          <TableWrap>
            <Table>
              <thead>
                <tr>
                  <Th>Name</Th>
                  <Th>Key</Th>
                  <Th>Status</Th>
                  <Th>Last used</Th>
                  <Th>Expires</Th>
                  <Th className="text-right">Actions</Th>
                </tr>
              </thead>
              <tbody>
                {keys.data!.map((key) => (
                  <Tr key={key.id}>
                    <Td className="font-medium text-fg">{key.name}</Td>
                    <Td>
                      <code className="font-mono text-[12px] text-muted">
                        {key.key_prefix}
                      </code>
                    </Td>
                    <Td>
                      {key.is_active ? (
                        <Badge tone="success" dot>
                          Active
                        </Badge>
                      ) : (
                        <Badge tone="neutral" dot>
                          Revoked
                        </Badge>
                      )}
                    </Td>
                    <Td className="text-[13px] text-muted">
                      {key.last_used_at ? formatRelative(key.last_used_at) : "Never"}
                    </Td>
                    <Td className="text-[13px] text-muted">
                      {key.expires_at ? formatDate(key.expires_at) : "No expiry"}
                    </Td>
                    <Td className="text-right">
                      {key.is_active && canManage && (
                        <Button size="sm" variant="ghost" onClick={() => setRevoking(key)}>
                          Revoke
                        </Button>
                      )}
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          </TableWrap>
        )}
      </Panel>

      {/* Create */}
      <Dialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create an API key"
        description="The secret is shown once, at creation. It is stored only as a SHA-256 hash."
        size="sm"
        footer={
          <>
            <Button size="sm" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              variant="primary"
              loading={create.pending}
              disabled={!name.trim()}
              onClick={() => create.run()}
            >
              Create key
            </Button>
          </>
        }
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (name.trim()) create.run();
          }}
          className="space-y-3"
        >
          {create.error && <InlineAlert>{create.error}</InlineAlert>}
          <Field label="Name" htmlFor="key-name" required hint="What will use this key?">
            <Input
              id="key-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Marketing site widget"
              maxLength={100}
              autoFocus
              required
            />
          </Field>
          <Field
            label="Expires"
            htmlFor="key-expiry"
            hint="Optional. Leave blank for a key that doesn't expire."
          >
            <Input
              id="key-expiry"
              type="date"
              value={expiresAt}
              min={minExpiry}
              onChange={(e) => setExpiresAt(e.target.value)}
            />
          </Field>
        </form>
      </Dialog>

      {/* One-time secret reveal */}
      <Dialog
        open={!!revealed}
        onClose={() => setRevealed(null)}
        title="Copy your key now"
        description="This is the only time the full secret is shown. It cannot be retrieved again."
        size="md"
        footer={
          <Button size="sm" variant="primary" onClick={() => setRevealed(null)}>
            I&apos;ve saved it
          </Button>
        }
      >
        <div className="space-y-3">
          <div className="flex items-start gap-2 rounded-control border border-warning/25 bg-warning-soft px-3 py-2.5 text-[13px] text-warning">
            <ShieldAlert className="mt-0.5 size-4 shrink-0" />
            <span>
              Store it in your secret manager. Anyone with this key can act on behalf of{" "}
              {currentOrg?.name}.
            </span>
          </div>
          <div className="rounded-control border border-line bg-surface-2 p-3">
            <p className="mb-2 text-[11px] uppercase tracking-[0.07em] text-subtle">
              {revealed?.name}
            </p>
            <code className="block break-all font-mono text-[12.5px] text-fg">
              {revealed?.secret_key}
            </code>
          </div>
          <CopyButton value={revealed?.secret_key ?? ""} label="Copy key" />
        </div>
      </Dialog>

      <ConfirmDialog
        open={!!revoking}
        onClose={() => setRevoking(null)}
        onConfirm={() => revoking && revoke.run(revoking.id)}
        title={`Revoke "${revoking?.name ?? ""}"?`}
        message="Anything using this key stops working immediately. This can't be undone."
        confirmLabel="Revoke key"
        destructive
        loading={revoke.pending}
      />
    </>
  );
}
