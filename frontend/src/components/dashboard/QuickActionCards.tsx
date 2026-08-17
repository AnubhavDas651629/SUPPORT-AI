"use client";

import React from "react";
import {
  Sparkles,
  Upload,
  LifeBuoy,
  Code2,
  Webhook,
  Key,
  ArrowUpRight,
} from "lucide-react";

interface QuickActionCardsProps {
  onOpenLiveTester: () => void;
  onOpenUploadDoc: () => void;
  onOpenTickets: () => void;
  onOpenEmbedModal: () => void;
  onOpenWebhooks: () => void;
  onOpenApiKeys: () => void;
}

export function QuickActionCards({
  onOpenLiveTester,
  onOpenUploadDoc,
  onOpenTickets,
  onOpenEmbedModal,
  onOpenWebhooks,
  onOpenApiKeys,
}: QuickActionCardsProps) {
  const actions = [
    {
      title: "Live AI Chat Tester",
      desc: "Simulate live RAG answers & trigger auto-escalation",
      icon: Sparkles,
      iconColor: "text-fuchsia-600 bg-fuchsia-50 border-fuchsia-200/80",
      action: onOpenLiveTester,
    },
    {
      title: "Upload Knowledge Doc",
      desc: "Parse & vector-embed PDF, DOCX, or TXT into pgvector",
      icon: Upload,
      iconColor: "text-blue-600 bg-blue-50 border-blue-200/80",
      action: onOpenUploadDoc,
    },
    {
      title: "Escalation Queue",
      desc: "Review open tickets needing human agent intervention",
      icon: LifeBuoy,
      iconColor: "text-rose-600 bg-rose-50 border-rose-200/80",
      action: onOpenTickets,
    },
    {
      title: "Widget Embed Code",
      desc: "Get 1-click HTML script tag to deploy on your website",
      icon: Code2,
      iconColor: "text-indigo-600 bg-indigo-50 border-indigo-200/80",
      action: onOpenEmbedModal,
    },
    {
      title: "Outbound Webhooks",
      desc: "Configure Slack alerts & HMAC event delivery",
      icon: Webhook,
      iconColor: "text-emerald-600 bg-emerald-50 border-emerald-200/80",
      action: onOpenWebhooks,
    },
    {
      title: "API Keys & Gateway",
      desc: "Generate production API keys for headless integration",
      icon: Key,
      iconColor: "text-amber-600 bg-amber-50 border-amber-200/80",
      action: onOpenApiKeys,
    },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2 mb-4">
      {actions.map((act) => {
        const Icon = act.icon;
        return (
          <button
            key={act.title}
            type="button"
            onClick={act.action}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-md hover:bg-slate-50 hover:text-slate-900 transition cursor-pointer text-xs font-medium text-slate-600 shadow-sm"
          >
            <Icon className="w-3.5 h-3.5 text-slate-400" />
            <span>{act.title}</span>
          </button>
        );
      })}
    </div>
  );
}
