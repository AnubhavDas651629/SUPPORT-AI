"use client";

import React, { useState } from "react";
import { Key, Webhook, Code2, ShieldCheck, Terminal, ExternalLink } from "lucide-react";
import { ApiKeysManagerTab } from "./ApiKeysManagerTab";
import { WebhooksManagerTab } from "./WebhooksManagerTab";
import { SdkCodeSnippetsTab } from "./SdkCodeSnippetsTab";
import { UpgradeModal } from "@/components/dashboard/UpgradeModal";
import { useOrganization } from "@/context/OrganizationContext";

export function DeveloperPortalView() {
  const { currentOrg, subscription } = useOrganization();
  const [activeTab, setActiveTab] = useState<"keys" | "webhooks" | "snippets">("keys");
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Header Bar */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-xs">
            <Terminal className="w-5 h-5 text-fuchsia-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">
                Developer Hub & API Gateway
              </h2>
              <span className="text-[10px] bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded-full uppercase">
                REST & Webhooks
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Generate production secret keys, register HMAC webhook endpoints, and inspect code SDKs.
            </p>
          </div>
        </div>

        {/* Tab Navigation Controls */}
        <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-2xl border border-slate-200/70">
          <button
            type="button"
            onClick={() => setActiveTab("keys")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === "keys"
                ? "bg-white text-slate-900 shadow-2xs"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Key className="w-3.5 h-3.5 text-amber-500" />
            <span>API Keys</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("webhooks")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === "webhooks"
                ? "bg-white text-slate-900 shadow-2xs"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Webhook className="w-3.5 h-3.5 text-emerald-500" />
            <span>Webhooks</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("snippets")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === "snippets"
                ? "bg-white text-slate-900 shadow-2xs"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Code2 className="w-3.5 h-3.5 text-fuchsia-500" />
            <span>SDKs</span>
          </button>
        </div>
      </div>

      {/* Tab Content Body */}
      {activeTab === "keys" && (
        <ApiKeysManagerTab onOpenUpgrade={() => setIsUpgradeOpen(true)} />
      )}

      {activeTab === "webhooks" && (
        <WebhooksManagerTab onOpenUpgrade={() => setIsUpgradeOpen(true)} />
      )}

      {activeTab === "snippets" && <SdkCodeSnippetsTab />}

      {/* Plan Upgrade Modal */}
      <UpgradeModal
        isOpen={isUpgradeOpen}
        onClose={() => setIsUpgradeOpen(false)}
      />
    </div>
  );
}
