"use client";

import React, { useState } from "react";
import { X, Sparkles, Check, Zap, Loader2, ArrowRight } from "lucide-react";
import { useOrganization } from "@/context/OrganizationContext";
import { api } from "@/lib/api";

const TIER_ORDER: Record<string, number> = {
  FREE: 0,
  PRO: 1,
  ENTERPRISE: 2,
};

const MODAL_PLANS = [
  {
    id: "FREE",
    name: "Free",
    price: "$0",
    period: "forever",
    description: "For small teams and prototypes",
    features: [
      "100 AI responses / month",
      "1 Knowledge Base (10 docs)",
      "1 Team Seat",
      "Standard vector search",
    ],
  },
  {
    id: "PRO",
    name: "Pro",
    price: "$49",
    period: "per month",
    badge: "POPULAR",
    description: "For growing teams needing API & webhooks",
    features: [
      "10,000 AI responses / month",
      "10 Knowledge Bases (10 GB)",
      "10 Team Member Seats",
      "Production API Keys & HMAC Webhooks",
      "Remove Support AI Branding",
      "SLA Priority Escalations",
    ],
  },
  {
    id: "ENTERPRISE",
    name: "Enterprise",
    price: "$299",
    period: "per month",
    badge: "SCALE",
    description: "High throughput & custom RAG clusters",
    features: [
      "500,000 AI responses / month",
      "100 Knowledge Bases (500 GB)",
      "100 Team Member Seats",
      "Dedicated PostgreSQL pgvector cluster",
      "Custom Fine-Tuning & Persona",
      "24/7 Dedicated Support",
    ],
  },
];

export function UpgradeModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { currentOrg, subscription, refreshOrgData } = useOrganization();
  const [loadingTier, setLoadingTier] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentTier = subscription?.plan_tier || "FREE";
  const currentRank = TIER_ORDER[currentTier] ?? 0;

  const handleCheckout = async (tierId: string) => {
    if (tierId === currentTier || !currentOrg) return;
    setLoadingTier(tierId);

    try {
      if (tierId === "FREE") {
        const res = await api.post(`/organizations/${currentOrg.id}/subscription/portal`, {
          return_url: window.location.href,
        });
        if (res.data?.checkout_url) {
          if (res.data.checkout_url.startsWith("http") && !res.data.checkout_url.includes(window.location.host)) {
            window.location.href = res.data.checkout_url;
          } else {
            await refreshOrgData();
            onClose();
            window.location.href = res.data.checkout_url;
          }
          return;
        }
      }

      const res = await api.post(`/organizations/${currentOrg.id}/subscription/checkout`, {
        price_id: tierId,
        success_url: `${window.location.origin}/dashboard?tab=analytics&upgraded=true`,
        cancel_url: window.location.href,
      });

      if (res.data?.checkout_url) {
        if (res.data.checkout_url.startsWith("http") && !res.data.checkout_url.includes(window.location.host)) {
          window.location.href = res.data.checkout_url;
        } else {
          await refreshOrgData();
          onClose();
          window.location.href = res.data.checkout_url;
        }
      }
    } catch (e: any) {
      console.error("Checkout error:", e);
      alert(`Could not initiate checkout for ${tierId} Plan. Please try again.`);
    } finally {
      setLoadingTier(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 sm:p-8 animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-fuchsia-100 text-fuchsia-600 flex items-center justify-center shadow-xs">
              <Zap className="w-5 h-5 fill-fuchsia-600 text-fuchsia-600" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-extrabold text-slate-900">Choose Your Plan</h3>
              <p className="text-xs text-slate-400">Unlock high-volume AI responses, custom API keys, and webhooks</p>
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

        {/* 3 Pricing Cards Comparison */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {MODAL_PLANS.map((plan) => {
            const tierRank = TIER_ORDER[plan.id] ?? 0;
            const isCurrent = plan.id === currentTier;
            const isHigher = tierRank > currentRank;

            return (
              <div
                key={plan.id}
                className={`p-5 rounded-3xl flex flex-col justify-between transition relative ${
                  isCurrent
                    ? "bg-white border-2 border-fuchsia-500 shadow-lg ring-4 ring-fuchsia-500/10"
                    : plan.badge === "POPULAR" && !isCurrent
                    ? "bg-gradient-to-b from-[#FDF2F8]/60 to-white border-2 border-fuchsia-300 shadow-md"
                    : "bg-slate-50/50 border border-slate-200"
                }`}
              >
                {/* Badge */}
                {isCurrent ? (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-fuchsia-600 text-white font-extrabold text-[9px] px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-xs">
                    CURRENT PLAN
                  </div>
                ) : plan.badge ? (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-slate-900 text-white font-extrabold text-[9px] px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-xs">
                    {plan.badge}
                  </div>
                ) : null}

                <div>
                  <h4 className="text-base font-extrabold text-slate-900 mt-1">{plan.name}</h4>
                  <div className="text-2xl font-extrabold text-slate-900 mt-1.5">
                    {plan.price} <span className="text-xs text-slate-400 font-normal">/ {plan.period}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">{plan.description}</p>

                  <div className="space-y-2 mt-4 pt-3 border-t border-slate-200/60 text-xs text-slate-700">
                    {plan.features.map((feat, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-fuchsia-600 shrink-0 mt-0.5 stroke-[2.5]" />
                        <span className="text-[11px]">{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-5 mt-4 border-t border-slate-200/60">
                  <button
                    type="button"
                    disabled={isCurrent || loadingTier === plan.id}
                    onClick={() => handleCheckout(plan.id)}
                    className={`w-full py-2.5 rounded-xl font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer disabled:cursor-default ${
                      isCurrent
                        ? "bg-slate-100 text-slate-400 border border-slate-200"
                        : isHigher
                        ? "bg-fuchsia-600 hover:bg-fuchsia-700 active:bg-fuchsia-800 text-white shadow-md shadow-fuchsia-600/20"
                        : "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300"
                    }`}
                  >
                    {loadingTier === plan.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : isCurrent ? (
                      <span>Active Plan</span>
                    ) : isHigher ? (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Upgrade to {plan.name}</span>
                      </>
                    ) : (
                      <>
                        <span>Downgrade to {plan.name}</span>
                        <ArrowRight className="w-3 h-3" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
