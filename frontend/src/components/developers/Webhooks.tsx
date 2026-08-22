"use client";

import { useState } from "react";
import { Plus, Radio, Send, ShieldAlert } from "lucide-react";
import { Panel, PanelHeader } from "@/components/ui/Panel";
import { Badge } from "@/components/ui/Badge";
import { Button, IconButton } from "@/components/ui/Button";
import { ConfirmDialog, Dialog } from "@/components/ui/Dialog";
import { CopyButton } from "@/components/ui/CopyButton";
import { Checkbox, Field, Input, Toggle } from "@/components/ui/Field";
import { Table, TableWrap, Td, Th, Tr } from "@/components/ui/Table";
import { EmptyState, ErrorState, InlineAlert, LoadingRows } from "@/components/ui/States";
import { useToast } from "@/components/ui/Toast";
import { webhooksApi } from "@/lib/api";
import {
  WEBHOOK_EVENTS,
  type WebhookDelivery,
  type WebhookEndpoint,
  type WebhookEndpointCreated,
} from "@/lib/api/types";
import { canManageOrganization } from "@/lib/domain";
import { useAsyncAction, useResource } from "@/lib/hooks";
import { useOrganization } from "@/context/OrganizationContext";
import { formatDateTime, formatRelative } from "@/lib/utils";
import { Trash2 } from "lucide-react";

export function Webhooks() {
  const toast = useToast();
  const { currentOrg, role, subscription } = useOrganization();
  const orgId = currentOrg?.id ?? null;
  const canManage = canManageOrganization(role);
  const planAllows = subscription?.limits.allows_webhooks ?? false;

  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [events, setEvents] = useState<string[]>(["*"]);
  const [revealed, setRevealed] = useState<WebhookEndpointCreated | null>(null);
  const [deleting, setDeleting] = useState<WebhookEndpoint | null>(null);
  const [deliveriesFor, setDeliveriesFor] = useState<WebhookEndpoint | null>(null);

  const endpoints = useResource<WebhookEndpoint[]>(
    () => webhooksApi.list(orgId!),
    [orgId],
  );

  const create = useAsyncAction(async () => {
    const created = await webhooksApi.create(orgId!, {
      name: name.trim(),
      url: url.trim(),
      subscribed_events: events,
    });
    setCreateOpen(false);
    setName("");
    setUrl("");
    setEvents(["*"]);
    setRevealed(created);
    endpoints.refetch();
  });

  const toggleActive = useAsyncAction(async (endpoint: WebhookEndpoint) => {
    const updated = await webhooksApi.update(orgId!, endpoint.id, {
      is_active: !endpoint.is_active,
    });
    endpoints.setData((prev) =>
      (prev ?? []).map((e) => (e.id === updated.id ? updated : e)),
    );
    toast(updated.is_active ? "Endpoint enabled." : "Endpoint paused.");
  });

  const ping = useAsyncAction(async (endpoint: WebhookEndpoint) => {
    const result = await webhooksApi.test(orgId!, endpoint.id);
    toast(
      result.success
        ? `Ping delivered — ${result.status_code} in ${result.duration_ms ?? "?"}ms`
        : `Ping failed — ${result.message}`,
      result.success ? "success" : "error",
    );
    endpoints.refetch();
  });

  const remove = useAsyncAction(async (endpointId: string) => {
    await webhooksApi.remove(orgId!, endpointId);
    endpoints.setData((prev) => (prev ?? []).filter((e) => e.id !== endpointId));
    setDeleting(null);
    toast("Endpoint deleted.");
  });

  function toggleEvent(event: string) {
    setEvents((prev) => {
      if (event === "*") return ["*"];
      const next = prev.filter((e) => e !== "*");
      return next.includes(event) ? next.filter((e) => e !== event) : [...next, event];
    });
  }

  return (
    <>
      <Panel>
        <PanelHeader
          title="Webhooks"
          description="Signed with HMAC-SHA256; every attempt is logged"
          action={
            <Button
              size="sm"
              variant="primary"
              disabled={!canManage || !planAllows}
              title={
                !planAllows
                  ? "Webhooks require the Pro or Enterprise plan"
                  : !canManage
                    ? "Only the organization owner can add endpoints"
                    : undefined
              }
              onClick={() => setCreateOpen(true)}
            >
              <Plus className="size-3.5" />
              Add endpoint
            </Button>
          }
        />

        {!planAllows && (
          <div className="border-b border-line px-4 py-3 sm:px-5">
            <InlineAlert tone="warning">
              Webhooks require the Pro or Enterprise plan.
            </InlineAlert>
          </div>
        )}

        {endpoints.error ? (
          <ErrorState message={endpoints.error} onRetry={endpoints.refetch} />
        ) : endpoints.initialLoading ? (
          <LoadingRows rows={3} />
        ) : (endpoints.data?.length ?? 0) === 0 ? (
          <EmptyState
            icon={Radio}
            title="No endpoints"
            description="Register a URL and Support-AI will POST to it whenever an escalation, conversation or message changes."
          />
        ) : (
          <TableWrap>
            <Table>
              <thead>
                <tr>
                  <Th>Endpoint</Th>
                  <Th>Events</Th>
                  <Th>Health</Th>
                  <Th>Active</Th>
                  <Th className="text-right">Actions</Th>
                </tr>
              </thead>
              <tbody>
                {endpoints.data!.map((endpoint) => (
                  <Tr key={endpoint.id}>
                    <Td className="max-w-xs">
                      <span className="block truncate font-medium text-fg">
                        {endpoint.name}
                      </span>
                      <code className="block truncate font-mono text-[11.5px] text-subtle">
                        {endpoint.url}
                      </code>
                    </Td>
                    <Td>
                      <span className="flex flex-wrap gap-1">
                        {endpoint.subscribed_events.slice(0, 3).map((event) => (
                          <code
                            key={event}
                            className="rounded border border-line bg-surface-2 px-1.5 py-0.5 font-mono text-[11px] text-muted"
                          >
                            {event}
                          </code>
                        ))}
                        {endpoint.subscribed_events.length > 3 && (
                          <span className="text-[11.5px] text-subtle">
                            +{endpoint.subscribed_events.length - 3}
                          </span>
                        )}
                      </span>
                    </Td>
                    <Td>
                      {endpoint.consecutive_failures === 0 ? (
                        <Badge tone="success" dot>
                          Healthy
                        </Badge>
                      ) : (
                        <Badge tone="danger" dot>
                          {endpoint.consecutive_failures} failing
                        </Badge>
                      )}
                    </Td>
                    <Td>
                      <Toggle
                        checked={endpoint.is_active}
                        disabled={!canManage || toggleActive.pending}
                        label={`${endpoint.is_active ? "Pause" : "Enable"} ${endpoint.name}`}
                        onChange={() => toggleActive.run(endpoint)}
                      />
                    </Td>
                    <Td>
                      <span className="flex items-center justify-end gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setDeliveriesFor(endpoint)}
                        >
                          Deliveries
                        </Button>
                        <IconButton
                          label={`Send a test ping to ${endpoint.name}`}
                          size="sm"
                          disabled={ping.pending}
                          onClick={() => ping.run(endpoint)}
                        >
                          <Send className="size-3.5" />
                        </IconButton>
                        {canManage && (
                          <IconButton
                            label={`Delete ${endpoint.name}`}
                            size="sm"
                            onClick={() => setDeleting(endpoint)}
                          >
                            <Trash2 className="size-3.5" />
                          </IconButton>
                        )}
                      </span>
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
        title="Add a webhook endpoint"
        description="The signing secret is shown once, at creation."
        footer={
          <>
            <Button size="sm" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              variant="primary"
              loading={create.pending}
              disabled={!name.trim() || !url.trim() || events.length === 0}
              onClick={() => create.run()}
            >
              Add endpoint
            </Button>
          </>
        }
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (name.trim() && url.trim()) create.run();
          }}
          className="space-y-3"
        >
          {create.error && <InlineAlert>{create.error}</InlineAlert>}
          <Field label="Name" htmlFor="hook-name" required>
            <Input
              id="hook-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ops Slack relay"
              autoFocus
              required
            />
          </Field>
          <Field
            label="URL"
            htmlFor="hook-url"
            required
            hint="Must start with http:// or https://"
          >
            <Input
              id="hook-url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://ops.example.com/hooks/support-ai"
              required
            />
          </Field>
          <fieldset>
            <legend className="mb-2 text-[13px] font-medium text-fg">Events</legend>
            <div className="grid gap-1.5 sm:grid-cols-2">
              {WEBHOOK_EVENTS.map((event) => (
                <label
                  key={event}
                  className="flex items-center gap-2 rounded-control border border-line px-2.5 py-1.5 text-[12.5px] text-muted has-checked:border-accent-line has-checked:bg-accent-soft"
                >
                  <Checkbox
                    checked={events.includes(event)}
                    onChange={() => toggleEvent(event)}
                  />
                  <code className="font-mono">
                    {event === "*" ? "* (all events)" : event}
                  </code>
                </label>
              ))}
            </div>
          </fieldset>
        </form>
      </Dialog>

      {/* One-time secret */}
      <Dialog
        open={!!revealed}
        onClose={() => setRevealed(null)}
        title="Copy your signing secret"
        description="Use it to verify the x-supportai-signature header. It cannot be retrieved again."
        footer={
          <Button size="sm" variant="primary" onClick={() => setRevealed(null)}>
            I&apos;ve saved it
          </Button>
        }
      >
        <div className="space-y-3">
          <div className="flex items-start gap-2 rounded-control border border-warning/25 bg-warning-soft px-3 py-2.5 text-[13px] text-warning">
            <ShieldAlert className="mt-0.5 size-4 shrink-0" />
            <span>Without this secret you cannot verify that a payload came from us.</span>
          </div>
          <div className="rounded-control border border-line bg-surface-2 p-3">
            <code className="block break-all font-mono text-[12.5px] text-fg">
              {revealed?.secret}
            </code>
          </div>
          <CopyButton value={revealed?.secret ?? ""} label="Copy secret" />
        </div>
      </Dialog>

      <DeliveriesDialog
        endpoint={deliveriesFor}
        organizationId={orgId}
        onClose={() => setDeliveriesFor(null)}
      />

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && remove.run(deleting.id)}
        title={`Delete "${deleting?.name ?? ""}"?`}
        message="Support-AI stops sending events to this URL. The delivery log is removed with it."
        confirmLabel="Delete endpoint"
        destructive
        loading={remove.pending}
      />
    </>
  );
}

function DeliveriesDialog({
  endpoint,
  organizationId,
  onClose,
}: {
  endpoint: WebhookEndpoint | null;
  organizationId: string | null;
  onClose: () => void;
}) {
  const deliveries = useResource<WebhookDelivery[]>(
    () => webhooksApi.deliveries(organizationId!, endpoint!.id),
    [organizationId, endpoint?.id],
    { enabled: !!endpoint && !!organizationId },
  );

  return (
    <Dialog
      open={!!endpoint}
      onClose={onClose}
      title={endpoint ? `Deliveries — ${endpoint.name}` : "Deliveries"}
      description="Every attempt, with its status code and duration"
      size="lg"
    >
      {deliveries.error ? (
        <ErrorState message={deliveries.error} onRetry={deliveries.refetch} />
      ) : deliveries.loading && !deliveries.data ? (
        <LoadingRows rows={4} className="p-0" />
      ) : (deliveries.data?.length ?? 0) === 0 ? (
        <EmptyState
          icon={Radio}
          title="No deliveries yet"
          description="Send a test ping, or wait for the next matching event."
        />
      ) : (
        <ul className="space-y-2">
          {deliveries.data!.map((delivery) => (
            <li
              key={delivery.id}
              className="rounded-panel border border-line bg-surface-2/40 p-3"
            >
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <code className="font-mono text-[12px] text-fg">
                  {delivery.event_type}
                </code>
                <Badge tone={delivery.is_success ? "success" : "danger"} dot>
                  {delivery.status_code ?? "no response"}
                </Badge>
                {delivery.attempt_number > 1 && (
                  <span className="text-[11.5px] text-subtle">
                    attempt {delivery.attempt_number}
                  </span>
                )}
                <span className="ml-auto font-mono text-[11px] text-subtle">
                  {delivery.duration_ms != null ? `${delivery.duration_ms}ms` : "—"} ·{" "}
                  {formatRelative(delivery.created_at)}
                </span>
              </div>
              {delivery.response_body && (
                <pre className="mt-2 max-h-24 overflow-auto rounded border border-line bg-surface px-2 py-1.5 font-mono text-[11px] leading-relaxed text-muted">
                  {delivery.response_body.slice(0, 500)}
                </pre>
              )}
              <p className="mt-1.5 text-[11px] text-subtle">
                {formatDateTime(delivery.created_at)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </Dialog>
  );
}
