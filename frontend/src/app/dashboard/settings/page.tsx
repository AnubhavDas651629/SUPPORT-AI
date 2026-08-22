"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { PageHeader, Panel, PanelHeader } from "@/components/ui/Panel";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { CopyButton } from "@/components/ui/CopyButton";
import { ConfirmDialog } from "@/components/ui/Dialog";
import { Field, Input, Toggle } from "@/components/ui/Field";
import { InlineAlert, LoadingRows } from "@/components/ui/States";
import { useToast } from "@/components/ui/Toast";
import { organizationsApi, settingsApi, systemApi } from "@/lib/api";
import type { OrganizationSettings } from "@/lib/api/types";
import { PLAN_META, canManageOrganization } from "@/lib/domain";
import { useAsyncAction, useResource } from "@/lib/hooks";
import { useOrganization } from "@/context/OrganizationContext";

export default function SettingsPage() {
  const toast = useToast();
  const router = useRouter();
  const { currentOrg, role, subscription, refresh } = useOrganization();
  const orgId = currentOrg?.id ?? null;
  const canManage = canManageOrganization(role);

  const [name, setName] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);

  // Seed each form from the latest server value by adjusting state during
  // render (React's documented pattern) rather than in an effect.
  const [syncedOrg, setSyncedOrg] = useState<typeof currentOrg>(null);
  if (currentOrg !== syncedOrg) {
    setSyncedOrg(currentOrg);
    setName(currentOrg?.name ?? "");
  }

  const settings = useResource<OrganizationSettings>(
    () => settingsApi.get(orgId!),
    [orgId],
  );
  const health = useResource(() => systemApi.health(), ["health"]);

  const [widgetTitle, setWidgetTitle] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#2c5cff");
  const [supportEmail, setSupportEmail] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [brandingDirty, setBrandingDirty] = useState(false);

  const [syncedSettings, setSyncedSettings] = useState<OrganizationSettings | null>(null);
  if (settings.data && settings.data !== syncedSettings) {
    setSyncedSettings(settings.data);
    setWidgetTitle(settings.data.widget_title);
    setPrimaryColor(settings.data.primary_color);
    setSupportEmail(settings.data.support_email ?? "");
    setLogoUrl(settings.data.company_logo_url ?? "");
    setBrandingDirty(false);
  }

  const renameOrg = useAsyncAction(async () => {
    await organizationsApi.update(orgId!, name.trim());
    await refresh();
    toast("Organization renamed.");
  });

  const saveBranding = useAsyncAction(async () => {
    const next = await settingsApi.update(orgId!, {
      widget_title: widgetTitle || undefined,
      primary_color: primaryColor || undefined,
      support_email: supportEmail || undefined,
      company_logo_url: logoUrl || undefined,
    });
    settings.setData(next);
    setBrandingDirty(false);
    toast("Widget settings saved.");
  });

  const deleteOrg = useAsyncAction(async () => {
    await organizationsApi.remove(orgId!);
    toast("Organization deleted.");
    router.push("/dashboard");
    window.location.reload();
  });

  const brandingAllowed = subscription?.limits.allows_custom_branding ?? false;
  const plan = subscription ? PLAN_META[subscription.plan_tier] : null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Organization details, widget appearance and plan."
        actions={
          plan && (
            <Link href="/dashboard/settings/billing">
              <Badge tone={plan.tone}>{plan.label} plan</Badge>
            </Link>
          )
        }
      />

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-6">
          <Panel>
            <PanelHeader
              title="Organization"
              action={
                canManage && name.trim() !== currentOrg?.name && name.trim().length >= 2 ? (
                  <Button
                    size="sm"
                    variant="primary"
                    loading={renameOrg.pending}
                    onClick={() => renameOrg.run()}
                  >
                    Save
                  </Button>
                ) : undefined
              }
            />
            <div className="space-y-4 p-4 sm:p-5">
              {renameOrg.error && <InlineAlert>{renameOrg.error}</InlineAlert>}
              <Field label="Name" htmlFor="org-name" required>
                <Input
                  id="org-name"
                  value={name}
                  disabled={!canManage}
                  minLength={2}
                  maxLength={100}
                  onChange={(e) => setName(e.target.value)}
                />
              </Field>
              <Field
                label="Slug"
                htmlFor="org-slug"
                hint="Generated from the name when the organization was created."
              >
                <Input id="org-slug" value={currentOrg?.slug ?? ""} readOnly disabled />
              </Field>
              <div>
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <p className="text-[13px] font-medium text-fg">Organization ID</p>
                  <CopyButton value={currentOrg?.id ?? ""} label="Copy" />
                </div>
                {/* break-all so a UUID can't set a min-content wider than a phone. */}
                <code className="block break-all rounded-control border border-line bg-surface-2 px-3 py-2 font-mono text-[12px] text-muted">
                  {currentOrg?.id}
                </code>
                <p className="mt-1.5 text-[12.5px] text-subtle">
                  Required by most API calls — see{" "}
                  <Link href="/dashboard/developers" className="text-accent hover:underline">
                    Developers
                  </Link>
                  .
                </p>
              </div>
            </div>
          </Panel>

          <Panel>
            <PanelHeader
              title="Chat widget"
              description="How Support-AI appears on your site"
              action={
                canManage && brandingDirty ? (
                  <Button
                    size="sm"
                    variant="primary"
                    loading={saveBranding.pending}
                    onClick={() => saveBranding.run()}
                  >
                    Save
                  </Button>
                ) : undefined
              }
            />

            {settings.initialLoading ? (
              <LoadingRows rows={3} />
            ) : settings.error ? (
              <div className="p-4 sm:p-5">
                <InlineAlert>{settings.error}</InlineAlert>
              </div>
            ) : (
              <div className="space-y-4 p-4 sm:p-5">
                {saveBranding.error && <InlineAlert>{saveBranding.error}</InlineAlert>}
                {!brandingAllowed && (
                  <InlineAlert tone="warning">
                    Custom branding needs the Pro or Enterprise plan. The title and colour
                    below will be rejected on Free.
                  </InlineAlert>
                )}

                <Field label="Widget title" htmlFor="widget-title">
                  <Input
                    id="widget-title"
                    value={widgetTitle}
                    disabled={!canManage}
                    onChange={(e) => {
                      setWidgetTitle(e.target.value);
                      setBrandingDirty(true);
                    }}
                    placeholder="Support"
                  />
                </Field>

                <div>
                  <label htmlFor="primary-color" className="mb-1.5 block text-[13px] font-medium text-fg">
                    Primary colour
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      id="primary-color"
                      type="color"
                      value={primaryColor}
                      disabled={!canManage}
                      onChange={(e) => {
                        setPrimaryColor(e.target.value);
                        setBrandingDirty(true);
                      }}
                      className="size-9.5 shrink-0 cursor-pointer rounded-control border border-line-strong bg-surface p-1"
                    />
                    <Input
                      value={primaryColor}
                      disabled={!canManage}
                      aria-label="Primary colour hex value"
                      pattern="^#[0-9A-Fa-f]{6}$"
                      onChange={(e) => {
                        setPrimaryColor(e.target.value);
                        setBrandingDirty(true);
                      }}
                      className="font-mono"
                    />
                  </div>
                  <p className="mt-1.5 text-[12.5px] text-subtle">
                    Six-digit hex, e.g. #2C5CFF.
                  </p>
                </div>

                <Field
                  label="Support email"
                  htmlFor="support-email"
                  hint="Where ticket notifications are sent."
                >
                  <Input
                    id="support-email"
                    type="email"
                    value={supportEmail}
                    disabled={!canManage}
                    onChange={(e) => {
                      setSupportEmail(e.target.value);
                      setBrandingDirty(true);
                    }}
                    placeholder="support@company.com"
                  />
                </Field>

                <Field label="Logo URL" htmlFor="logo-url">
                  <Input
                    id="logo-url"
                    type="url"
                    value={logoUrl}
                    disabled={!canManage}
                    onChange={(e) => {
                      setLogoUrl(e.target.value);
                      setBrandingDirty(true);
                    }}
                    placeholder="https://company.com/logo.svg"
                  />
                </Field>

                <div className="flex items-start justify-between gap-4 border-t border-line pt-4">
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium text-fg">
                      Auto-escalate to a ticket
                    </p>
                    <p className="mt-0.5 text-[12.5px] leading-relaxed text-muted">
                      Managed on the{" "}
                      <Link href="/dashboard/agents" className="text-accent hover:underline">
                        Agents
                      </Link>{" "}
                      page.
                    </p>
                  </div>
                  <Toggle
                    checked={settings.data?.auto_create_ticket_on_escalation ?? false}
                    disabled
                    label="Auto-escalate to a ticket"
                    onChange={() => {}}
                  />
                </div>
              </div>
            )}
          </Panel>

          {canManage && (
            <Panel className="border-danger/25">
              <PanelHeader title="Danger zone" />
              <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                <div className="min-w-0">
                  <p className="text-[13px] font-medium text-fg">Delete this organization</p>
                  <p className="mt-0.5 text-[12.5px] leading-relaxed text-muted">
                    Removes every knowledge base, document, conversation and escalation.
                    This cannot be undone.
                  </p>
                </div>
                <Button size="sm" variant="danger" onClick={() => setDeleteOpen(true)}>
                  Delete
                </Button>
              </div>
            </Panel>
          )}
        </div>

        <div className="space-y-6">
          <Panel>
            <PanelHeader title="Plan" />
            <div className="space-y-3 p-4 sm:p-5">
              {plan ? (
                <>
                  <div className="flex items-center justify-between gap-3">
                    <Badge tone={plan.tone}>{plan.label}</Badge>
                    <Badge tone={subscription!.status === "ACTIVE" ? "success" : "warning"} dot>
                      {subscription!.status}
                    </Badge>
                  </div>
                  <p className="text-[13px] leading-relaxed text-muted">{plan.blurb}</p>
                  <Link
                    href="/dashboard/settings/billing"
                    className="inline-flex items-center gap-1 rounded text-[13px] font-medium text-accent hover:underline"
                  >
                    Manage plan
                    <ArrowRight className="size-3.5" />
                  </Link>
                </>
              ) : (
                <LoadingRows rows={2} className="p-0" />
              )}
            </div>
          </Panel>

          <Panel>
            <PanelHeader title="System" description="Live backend health check" />
            <dl className="divide-y divide-line">
              {[
                { label: "API", value: health.data?.status ?? (health.error ? "unreachable" : "…") },
                { label: "Database", value: health.data?.database ?? (health.error ? "unknown" : "…") },
                { label: "Redis", value: health.data?.redis ?? (health.error ? "unknown" : "…") },
              ].map((row) => (
                <div
                  key={row.label}
                  className="flex items-center justify-between gap-3 px-4 py-2.5 sm:px-5"
                >
                  <dt className="text-[12.5px] text-muted">{row.label}</dt>
                  <dd>
                    <Badge
                      tone={
                        row.value === "ok" || row.value === "connected"
                          ? "success"
                          : row.value === "…"
                            ? "neutral"
                            : "danger"
                      }
                      dot
                    >
                      {row.value}
                    </Badge>
                  </dd>
                </div>
              ))}
            </dl>
          </Panel>
        </div>
      </div>

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => deleteOrg.run()}
        title={`Delete "${currentOrg?.name ?? ""}"?`}
        message="Every knowledge base, document, conversation, escalation, API key and webhook belonging to this organization is permanently removed."
        confirmLabel="Delete organization"
        destructive
        loading={deleteOrg.pending}
      />
    </div>
  );
}
