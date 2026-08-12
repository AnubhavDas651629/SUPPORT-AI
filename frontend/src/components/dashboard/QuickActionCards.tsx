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
    <div className="w-full">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-bold text-slate-900 tracking-tight">
          Recommended Quick Actions
        </h2>
        <span className="text-[11px] text-slate-400 font-medium">Quick setup shortcuts</span>
      </div>

      {/* Grid of 6 Action Cards (matches inspiration layout) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {actions.map((act) => {
          const Icon = act.icon;
          return (
            <button
              key={act.title}
              type="button"
              onClick={act.action}
              className="p-3.5 bg-white hover:bg-slate-50/80 rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-xs transition-all text-left flex items-start justify-between group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 transition group-hover:scale-105 ${act.iconColor}`}
                >
                  <Icon className="w-4 h-4 stroke-[2.2]" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900 group-hover:text-fuchsia-600 transition">
                    {act.title}
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                    {act.desc}
                  </p>
                </div>
              </div>

              <ArrowUpRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-fuchsia-600 transition shrink-0 ml-1" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
