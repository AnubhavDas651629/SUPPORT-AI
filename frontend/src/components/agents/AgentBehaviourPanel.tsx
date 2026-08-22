"use client";

import { useState } from "react";
import { Panel, PanelHeader } from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";
import { Field, Textarea, Toggle } from "@/components/ui/Field";
import { InlineAlert, LoadingRows } from "@/components/ui/States";
import { useToast } from "@/components/ui/Toast";
import { settingsApi } from "@/lib/api";
import type { OrganizationSettings } from "@/lib/api/types";
import { canManageOrganization } from "@/lib/domain";
import { useAsyncAction, useResource } from "@/lib/hooks";
import { useOrganization } from "@/context/OrganizationContext";

/**
 * Behaviour every agent shares, backed by
 * `GET/PATCH /organizations/{id}/settings`. Temperature and the prompt
 * override apply to all three specialists — the backend keeps one settings row
 * per organization, not one per route.
 */
export function AgentBehaviourPanel() {
  const toast = useToast();
  const { currentOrg, role } = useOrganization();
  const canEdit = canManageOrganization(role);

  const settings = useResource<OrganizationSettings>(
    () => settingsApi.get(currentOrg!.id),
    [currentOrg?.id],
  );

  const [prompt, setPrompt] = useState("");
  const [temperature, setTemperature] = useState(0.3);
  const [autoTicket, setAutoTicket] = useState(true);
  const [dirty, setDirty] = useState(false);

  // Seed the form from whatever the API last returned. Adjusting state during
  // render is React's documented pattern for this and costs one fewer render
  // than an effect.
  const [syncedFrom, setSyncedFrom] = useState<OrganizationSettings | null>(null);
  if (settings.data && settings.data !== syncedFrom) {
    setSyncedFrom(settings.data);
    setPrompt(settings.data.system_prompt_override ?? "");
    setTemperature(settings.data.temperature);
    setAutoTicket(settings.data.auto_create_ticket_on_escalation);
    setDirty(false);
  }

  const save = useAsyncAction(async () => {
    const next = await settingsApi.update(currentOrg!.id, {
      system_prompt_override: prompt.trim() || undefined,
      temperature,
      auto_create_ticket_on_escalation: autoTicket,
    });
    settings.setData(next);
    setDirty(false);
    toast("Agent behaviour saved.");
  });

  return (
    <Panel>
      <PanelHeader
        title="Shared behaviour"
        description="Applies to all three specialists"
        action={
          canEdit && dirty ? (
            <Button size="sm" variant="primary" loading={save.pending} onClick={() => save.run()}>
              Save changes
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
        <div className="space-y-5 p-4 sm:p-5">
          {save.error && <InlineAlert>{save.error}</InlineAlert>}

          <Field
            label="System prompt override"
            htmlFor="prompt-override"
            hint="Appended to each specialist's built-in directives. Leave blank to use the defaults."
          >
            <Textarea
              id="prompt-override"
              value={prompt}
              disabled={!canEdit}
              rows={5}
              placeholder="e.g. Always mention our 30-day return window when discussing refunds."
              onChange={(e) => {
                setPrompt(e.target.value);
                setDirty(true);
              }}
            />
          </Field>

          <div>
            <div className="flex items-baseline justify-between gap-3">
              <label htmlFor="temperature" className="text-[13px] font-medium text-fg">
                Temperature
              </label>
              <span className="font-mono text-[12.5px] tnum text-muted">
                {temperature.toFixed(2)}
              </span>
            </div>
            <input
              id="temperature"
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={temperature}
              disabled={!canEdit}
              onChange={(e) => {
                setTemperature(Number(e.target.value));
                setDirty(true);
              }}
              className="mt-2 w-full accent-accent"
            />
            <p className="mt-1.5 text-[12.5px] text-subtle">
              Lower keeps answers close to the retrieved text. Support answers usually
              want 0.0–0.4.
            </p>
          </div>

          <div className="flex items-start justify-between gap-4 border-t border-line pt-4">
            <div className="min-w-0">
              <p className="text-[13px] font-medium text-fg">
                Open an escalation automatically
              </p>
              <p className="mt-0.5 text-[12.5px] leading-relaxed text-muted">
                When an agent decides it can&apos;t answer, create a tracked escalation
                instead of leaving the conversation open.
              </p>
            </div>
            <Toggle
              checked={autoTicket}
              disabled={!canEdit}
              label="Open an escalation automatically"
              onChange={(next) => {
                setAutoTicket(next);
                setDirty(true);
              }}
            />
          </div>

          {!canEdit && (
            <p className="text-[12.5px] text-subtle">
              Only the organization owner can change agent behaviour.
            </p>
          )}
        </div>
      )}
    </Panel>
  );
}
