"use client";

import React, { useState } from "react";
import { BarChart3, Zap, ShieldCheck, Sparkles, CreditCard, Clock, Calendar } from "lucide-react";
import { QuotaMetersCard } from "./QuotaMetersCard";
import { PlanTierPricingCards } from "./PlanTierPricingCards";
import { BillingHistoryCard } from "./BillingHistoryCard";
import { UpgradeModal } from "@/components/dashboard/UpgradeModal";
import { useOrganization } from "@/context/OrganizationContext";

export function UsageAnalyticsView() {
  const { currentOrg, subscription, usage } = useOrganization();
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

  const planTier = subscription?.plan_tier || "FREE";

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Header Bar */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-fuchsia-600 to-indigo-600 text-white flex items-center justify-center shadow-xs">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">
                Usage, Quotas & Subscription
              </h2>
              <span
                className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase ${
                  planTier === "PRO"
                    ? "bg-fuchsia-100 text-fuchsia-700 border border-fuchsia-200"
                    : planTier === "ENTERPRISE"
                    ? "bg-purple-100 text-purple-700 border border-purple-200"
                    : "bg-slate-100 text-slate-700 border border-slate-200"
                }`}
              >
                {planTier} PLAN
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Monitor your AI tokens, vector embeddings capacity, and manage billing tiers.
            </p>
          </div>
        </div>

        {planTier === "FREE" && (
          <button
            type="button"
            onClick={() => setIsUpgradeModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-fuchsia-600 hover:bg-fuchsia-700 text-white text-xs font-semibold shadow-xs transition cursor-pointer self-start sm:self-center"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Upgrade Workspace</span>
          </button>
        )}
      </div>

      {/* 1. Live Quota Meters (AI responses, pgvector storage, knowledge bases, team seats) */}
      <QuotaMetersCard />

      {/* 2. Side-by-Side Plan Comparison Pricing Cards */}
      <PlanTierPricingCards onOpenCheckoutModal={() => setIsUpgradeModalOpen(true)} />

      {/* 3. Billing & Invoices */}
      <BillingHistoryCard />

      {/* Upgrade Modal */}
      <UpgradeModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
      />
    </div>
  );
}
