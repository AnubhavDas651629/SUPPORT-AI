"use client";

import React, { useState } from "react";
import { X, Webhook, Check, Plus, Loader2, AlertCircle, Sparkles } from "lucide-react";
import { useOrganization } from "@/context/OrganizationContext";
import { api } from "@/lib/api";

const ALL_EVENTS = [
  { id: "ticket.created", label: "Ticket Created", desc: "Fires when a customer request triggers AI auto-escalation or manual ticket creation." },
  { id: "ticket.updated", label: "Ticket Updated", desc: "Fires when a ticket's status, priority, or assignment changes." },
  { id: "ticket.assigned", label: "Ticket Assigned", desc: "Fires when a ticket is assigned to a support agent." },
  { id: "ticket.resolved", label: "Ticket Resolved", desc: "Fires when a ticket is marked as resolved or closed." },
  { id: "conversation.created", label: "Conversation Created", desc: "Fires when a new visitor chat session is started." },
  { id: "message.created", label: "New Message Sent", desc: "Fires on every customer, AI, or agent message." },
  { id: "feedback.submitted", label: "Feedback Submitted", desc: "Fires when a visitor submits thumbs up/down feedback on a response." },
  { id: "*", label: "All Events (Wildcard)", desc: "Subscribe to every event type. Useful for logging and audit." },
];

export function CreateWebhookModal({
  isOpen,
  onClose,
  onWebhookCreated,
  onOpenUpgrade,
}: {
  isOpen: boolean;
  onClose: () => void;
  onWebhookCreated: (rawSecret: string, webhook: any) => void;
  onOpenUpgrade?: () => void;
}) {
  const { currentOrg, subscription } = useOrganization();
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [selectedEvents, setSelectedEvents] = useState<string[]>([
    "ticket.created",
    "ticket.resolved",
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isGatedError, setIsGatedError] = useState(false);

  if (!isOpen) return null;

  const allowsWebhooks = subscription?.limits?.allows_webhooks ?? (subscription?.plan_tier !== "FREE");

  const toggleEvent = (eventId: string) => {
    setSelectedEvents((prev) =>
      prev.includes(eventId) ? prev.filter((e) => e !== eventId) : [...prev, eventId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || !name.trim() || !currentOrg) return;

    setErrorMessage(null);
    setIsGatedError(false);

    if (!allowsWebhooks) {
      setIsGatedError(true);
      setErrorMessage("Outbound Webhooks are not allowed on the Free tier. Please upgrade to Pro or Enterprise.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.post(`/organizations/${currentOrg.id}/webhooks`, {
        name: name.trim(),
        url: url.trim(),
        subscribed_events: selectedEvents,
      });
      onWebhookCreated(res.data.secret, res.data);
      onClose();
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      const status = err.response?.status;
      if (status === 403 || (typeof detail === "string" && detail.toLowerCase().includes("plan"))) {
        setIsGatedError(true);
        setErrorMessage(typeof detail === "string" ? detail : "Outbound Webhooks require a Pro or Enterprise subscription.");
      } else {
        setErrorMessage(typeof detail === "string" ? detail : "Failed to register webhook. Please verify the URL.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 sm:p-8 animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
              <Webhook className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Register Webhook Endpoint</h3>
              <p className="text-[11px] text-slate-400">Receive real-time signed HTTP POST payloads</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {errorMessage && (
          <div className="mt-4 p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 flex flex-col gap-2">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
            {isGatedError && onOpenUpgrade && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenUpgrade();
                }}
                className="mt-1 w-full py-2 bg-fuchsia-600 hover:bg-fuchsia-700 text-white rounded-xl font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Upgrade to Pro Now</span>
              </button>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Endpoint Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Slack Incident Alert Bot / Zapier Hook"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/20 focus:border-fuchsia-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Payload URL (HTTPS)</label>
            <input
              type="url"
              required
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://api.yourcompany.com/webhooks/support-ai"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/20 focus:border-fuchsia-500 transition font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">Subscribed Event Triggers</label>
            <div className="space-y-2">
              {ALL_EVENTS.map((ev) => {
                const isSelected = selectedEvents.includes(ev.id);
                return (
                  <div
                    key={ev.id}
                    onClick={() => toggleEvent(ev.id)}
                    className={`p-3 rounded-2xl border transition cursor-pointer flex items-start gap-3 ${
                      isSelected
                        ? "bg-fuchsia-50/50 border-fuchsia-300 text-fuchsia-900 shadow-2xs"
                        : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-md border flex items-center justify-center mt-0.5 shrink-0 ${
                        isSelected
                          ? "bg-fuchsia-600 border-fuchsia-600 text-white"
                          : "border-slate-300 bg-white"
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                    <div>
                      <div className="text-xs font-bold">{ev.label}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{ev.desc}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !url.trim() || selectedEvents.length === 0}
              className="px-5 py-2 rounded-xl bg-fuchsia-600 hover:bg-fuchsia-700 text-white text-xs font-semibold shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Register Webhook"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
