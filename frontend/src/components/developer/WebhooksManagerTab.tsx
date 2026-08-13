"use client";

import React, { useState, useEffect } from "react";
import {
  Webhook,
  Plus,
  Trash2,
  Play,
  CheckCircle2,
  Clock,
  Activity,
  Lock,
  Loader2,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import { CreateWebhookModal } from "./CreateWebhookModal";
import { WebhookSecretModal } from "./WebhookSecretModal";
import { WebhookDeliveriesModal } from "./WebhookDeliveriesModal";
import { useOrganization } from "@/context/OrganizationContext";
import { api } from "@/lib/api";

interface WebhookItem {
  id: string;
  name: string;
  url: string;
  subscribed_events: string[];
  is_active: boolean;
  created_at: string;
}

export function WebhooksManagerTab({ onOpenUpgrade }: { onOpenUpgrade: () => void }) {
  const { currentOrg, subscription } = useOrganization();
  const [webhooks, setWebhooks] = useState<WebhookItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createdSecret, setCreatedSecret] = useState<string | null>(null);
  const [createdName, setCreatedName] = useState("");
  const [inspectingWebhook, setInspectingWebhook] = useState<WebhookItem | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ id: string; status: number; duration: number } | null>(null);

  const planTier = subscription?.plan_tier || "FREE";
  const allowsWebhooks = subscription?.limits?.allows_webhooks ?? (planTier !== "FREE");

  const loadWebhooks = async () => {
    if (!currentOrg) return;
    setIsLoading(true);
    try {
      const res = await api.get(`/organizations/${currentOrg.id}/webhooks`);
      if (Array.isArray(res.data)) {
        setWebhooks(res.data);
      } else {
        setWebhooks([]);
      }
    } catch (err) {
      console.warn("Could not load webhooks:", err);
      setWebhooks([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadWebhooks();
  }, [currentOrg]);

  const handleWebhookCreated = (secret: string, webhook: any) => {
    loadWebhooks();
    setCreatedSecret(secret);
    setCreatedName(webhook.name);
  };

  const handleTestPing = async (webhook: WebhookItem) => {
    if (!currentOrg) return;
    setTestingId(webhook.id);
    setTestResult(null);

    try {
      const res = await api.post(`/organizations/${currentOrg.id}/webhooks/${webhook.id}/test`);
      setTestResult({
        id: webhook.id,
        status: res.data?.status_code || 200,
        duration: res.data?.duration_ms || 48,
      });
      alert(`Webhook test succeeded! Server returned HTTP ${res.data?.status_code || 200}`);
    } catch (e: any) {
      alert(`Webhook test failed: ${e.response?.data?.detail || "Could not reach endpoint"}`);
    } finally {
      setTestingId(null);
    }
  };

  const handleDelete = async (whId: string) => {
    if (!currentOrg) return;
    if (confirm("Are you sure you want to delete this webhook endpoint?")) {
      try {
        await api.delete(`/organizations/${currentOrg.id}/webhooks/${whId}`);
        setWebhooks((prev) => prev.filter((w) => w.id !== whId));
      } catch (err) {
        alert("Failed to delete webhook.");
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Free Plan Lock Notice */}
      {!allowsWebhooks && (
        <div className="p-5 bg-gradient-to-r from-[#FDF2F8] via-[#FAF5FF] to-[#F5F3FF] border border-fuchsia-200/80 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-fuchsia-100 text-fuchsia-600 flex items-center justify-center shrink-0 shadow-2xs">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-extrabold text-slate-900">Outbound Webhooks are gated on Pro & Enterprise Plans</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Your workspace is currently on the <strong>Free Plan</strong>. Upgrade to stream live signed event payloads to Slack, Zapier, or custom backends.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onOpenUpgrade}
            className="px-4 py-2.5 bg-fuchsia-600 hover:bg-fuchsia-700 active:bg-fuchsia-800 text-white rounded-xl text-xs font-bold shrink-0 shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Upgrade to Pro</span>
          </button>
        </div>
      )}

      {/* Header Bar */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs p-6 flex items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Outbound Webhook Endpoints</span>
            <span className="text-[10px] bg-emerald-100 text-emerald-700 font-bold px-2 py-0.5 rounded-full">
              HMAC-SHA256 Signed
            </span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Deliver real-time event payloads whenever tickets escalate or conversations resolve.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            if (!allowsWebhooks) {
              onOpenUpgrade();
            } else {
              setIsCreateOpen(true);
            }
          }}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs font-semibold shadow-xs transition cursor-pointer ${
            allowsWebhooks
              ? "bg-slate-950 hover:bg-black text-white"
              : "bg-slate-100 text-slate-500 hover:bg-slate-200"
          }`}
        >
          {!allowsWebhooks ? <Lock className="w-3.5 h-3.5 text-fuchsia-600" /> : <Plus className="w-3.5 h-3.5" />}
          <span>{allowsWebhooks ? "Register Webhook" : "Unlock Webhooks (Pro)"}</span>
        </button>
      </div>

      {/* Webhooks List */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs p-6 space-y-4">
        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400 text-xs">
            <Loader2 className="w-5 h-5 animate-spin text-fuchsia-600" />
            <span>Loading webhooks...</span>
          </div>
        ) : webhooks.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">
            <Webhook className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="font-bold text-slate-700">No webhooks registered yet</p>
            <p className="mt-0.5">
              {allowsWebhooks
                ? "Click 'Register Webhook' to start receiving HMAC signed event deliveries."
                : "Upgrade to Pro to connect Slack, Zapier, and custom webhooks."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {webhooks.map((wh) => (
              <div
                key={wh.id}
                className="py-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0 mt-0.5">
                    <Webhook className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">{wh.name}</h4>
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200/60 uppercase">
                        Active
                      </span>
                    </div>
                    <div className="font-mono text-xs text-slate-500 truncate max-w-lg">{wh.url}</div>
                    <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                      {wh.subscribed_events.map((ev) => (
                        <span
                          key={ev}
                          className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600"
                        >
                          {ev}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 shrink-0">
                  {/* Test Ping Button */}
                  <button
                    type="button"
                    onClick={() => handleTestPing(wh)}
                    disabled={testingId === wh.id}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {testingId === wh.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-fuchsia-600" />
                    ) : (
                      <Play className="w-3.5 h-3.5 text-slate-500" />
                    )}
                    <span>Test Ping</span>
                  </button>

                  {/* Delivery Logs Button */}
                  <button
                    type="button"
                    onClick={() => setInspectingWebhook(wh)}
                    className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200/80 transition cursor-pointer flex items-center gap-1.5"
                  >
                    <Activity className="w-3.5 h-3.5 text-slate-500" />
                    <span>Delivery Logs</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(wh.id)}
                    className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                    title="Delete Webhook"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <CreateWebhookModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onWebhookCreated={handleWebhookCreated}
        onOpenUpgrade={onOpenUpgrade}
      />

      <WebhookSecretModal
        isOpen={!!createdSecret}
        onClose={() => setCreatedSecret(null)}
        rawSecret={createdSecret || ""}
        webhookName={createdName}
      />

      <WebhookDeliveriesModal
        isOpen={!!inspectingWebhook}
        onClose={() => setInspectingWebhook(null)}
        webhookName={inspectingWebhook?.name || ""}
        webhookUrl={inspectingWebhook?.url || ""}
        webhookId={inspectingWebhook?.id || ""}
      />
    </div>
  );
}
