"use client";

import React, { useState } from "react";
import { Check, Sparkles, Zap, Shield, Key, Webhook, Headphones, ArrowRight, Loader2 } from "lucide-react";
import { useOrganization } from "@/context/OrganizationContext";
import { api } from "@/lib/api";

const TIERS = [
  {
    id: "FREE",
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Essential AI autonomous support for small projects and prototypes.",
    badge: null,
    features: [
      "100 AI responses / month",
      "1 Knowledge Base",
      "10 documents max (100 MB)",
      "1 Team Seat (Single user)",
      "Standard vector search",
      "Community support",
    ],
    ctaText: "Current Plan",
    isPopular: false,
  },
  {
    id: "PRO",
    name: "Pro",
    price: "$49",
    period: "per month",
    description: "For growing businesses requiring full API access, webhooks & high volume.",
    badge: "MOST POPULAR",
    features: [
      "10,000 AI responses / month",
      "10 Knowledge Bases",
      "500 documents per KB (10 GB)",
      "10 Team Member Seats",
      "Production API Keys (REST Gateway)",
      "HMAC Outbound Webhooks",
      "Custom Widget Branding & CSS",
      "SLA Priority Escalations",
    ],
    ctaText: "Upgrade to Pro",
    isPopular: true,
  },
  {
    id: "ENTERPRISE",
    name: "Enterprise",
    price: "$299",
    period: "per month",
    description: "Dedicated infrastructure, high throughput SLA & custom LLM fine-tuning.",
    badge: "ENTERPRISE SCALE",
    features: [
      "500,000 AI responses / month",
      "100 Knowledge Bases",
      "10,000 documents per KB (500 GB)",
      "100 Team Member Seats",
      "Dedicated PostgreSQL pgvector cluster",
      "Custom LLM fine-tuning & persona",
      "Custom SSO & SAML Authentication",
      "24/7 Dedicated Support & SLA",
    ],
    ctaText: "Upgrade to Enterprise",
    isPopular: false,
  },
];

export function PlanTierPricingCards({ onOpenCheckoutModal }: { onOpenCheckoutModal?: () => void }) {
  const { currentOrg, subscription, refreshOrgData } = useOrganization();
  const [loadingTier, setLoadingTier] = useState<string | null>(null);

  const currentTier = subscription?.plan_tier || "FREE";

  const handlePlanAction = async (tierId: string) => {
    if (tierId === currentTier) return;
    if (!currentOrg) return;

    setLoadingTier(tierId);
    try {
      // Call Stripe Checkout API
      const res = await api.post(`/organizations/${currentOrg.id}/subscription/checkout`, {
        price_id: tierId === "PRO" ? "price_pro_monthly" : "price_enterprise_monthly",
        success_url: window.location.href,
        cancel_url: window.location.href,
      });

      if (res.data?.checkout_url) {
        window.location.href = res.data.checkout_url;
      }
    } catch (err) {
      if (onOpenCheckoutModal) {
        onOpenCheckoutModal();
      } else {
        alert(`Proceeding to checkout for ${tierId} Plan...`);
      }
    } finally {
      setLoadingTier(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center max-w-xl mx-auto space-y-1.5">
        <h3 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
          Flexible Plans for Every Stage of Growth
        </h3>
        <p className="text-xs text-slate-400">
          Scale your autonomous customer support with seamless vector storage and API capacity.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {TIERS.map((tier) => {
          const isCurrent = tier.id === currentTier;
          const isUpgrade = !isCurrent;

          return (
            <div
              key={tier.id}
              className={`rounded-3xl p-6 flex flex-col justify-between transition relative ${
                tier.isPopular
                  ? "bg-white border-2 border-fuchsia-500 shadow-xl ring-4 ring-fuchsia-500/10"
                  : "bg-white border border-slate-200/80 shadow-2xs hover:shadow-md"
              }`}
            >
              {/* Popular Badge */}
              {tier.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-gradient-to-r from-fuchsia-600 to-indigo-600 text-white font-extrabold text-[10px] tracking-wider uppercase shadow-xs">
                  {tier.badge}
                </div>
              )}

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-base font-extrabold text-slate-900">{tier.name}</h4>
                  {isCurrent && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                      CURRENT PLAN
                    </span>
                  )}
                </div>

                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                    {tier.price}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">{tier.period}</span>
                </div>

                <p className="text-xs text-slate-500 leading-relaxed min-h-[36px]">
                  {tier.description}
                </p>

                {/* Features List */}
                <div className="pt-3 border-t border-slate-100 space-y-2.5">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Included Features
                  </div>
                  {tier.features.map((feat, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-700">
                      <div className="w-4 h-4 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5 border border-emerald-100">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </div>
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action CTA Button */}
              <div className="pt-6 mt-6 border-t border-slate-100">
                <button
                  type="button"
                  disabled={isCurrent || loadingTier === tier.id}
                  onClick={() => handlePlanAction(tier.id)}
                  className={`w-full py-2.5 px-4 rounded-2xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer disabled:cursor-default ${
                    isCurrent
                      ? "bg-slate-100 text-slate-400 border border-slate-200"
                      : tier.isPopular
                      ? "bg-fuchsia-600 hover:bg-fuchsia-700 text-white shadow-xs"
                      : "bg-slate-950 hover:bg-black text-white shadow-xs"
                  }`}
                >
                  {loadingTier === tier.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : isCurrent ? (
                    <span>Active Plan</span>
                  ) : (
                    <>
                      <span>{tier.ctaText}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
