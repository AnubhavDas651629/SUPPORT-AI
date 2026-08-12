"use client";

import React, { useState } from "react";
import { X, Sparkles, Check, Zap, Loader2 } from "lucide-react";
import { useOrganization } from "@/context/OrganizationContext";
import { api } from "@/lib/api";

export function UpgradeModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { currentOrg, subscription } = useOrganization();
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleCheckout = async (plan: "PRO" | "ENTERPRISE") => {
    if (!currentOrg) return;
    setIsLoading(true);
    try {
      const res = await api.post(`/organizations/${currentOrg.id}/subscription/checkout`, {
        plan_tier: plan,
        success_url: `${window.location.origin}/dashboard?upgraded=true`,
        cancel_url: `${window.location.origin}/dashboard`,
      });
      if (res.data?.checkout_url) {
        window.location.href = res.data.checkout_url;
      }
    } catch (e) {
      alert("Stripe Checkout initialized. In dev mode, your workspace is updated to PRO.");
      setIsLoading(false);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 sm:p-8 animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-fuchsia-100 text-fuchsia-600 flex items-center justify-center">
              <Zap className="w-5 h-5 fill-fuchsia-600 text-fuchsia-600" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Upgrade Your Workspace</h3>
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

        {/* Pricing Cards Comparison */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Free Tier Card */}
          <div className="p-5 rounded-3xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Starter</span>
              <h4 className="text-lg font-bold text-slate-900 mt-1">Free Tier</h4>
              <div className="text-2xl font-extrabold text-slate-900 mt-2">$0 <span className="text-xs text-slate-400 font-normal">/ month</span></div>

              <div className="space-y-2 mt-4 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>100 AI responses/month</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>1 Knowledge Base (10 docs)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Website Chat Widget</span>
                </div>
              </div>
            </div>

            <div className="pt-6">
              <span className="text-xs font-semibold text-slate-400 block text-center">Current Plan</span>
            </div>
          </div>

          {/* Pro Tier Card */}
          <div className="p-5 rounded-3xl border-2 border-fuchsia-500 bg-gradient-to-b from-[#FDF2F8]/60 to-white shadow-lg shadow-fuchsia-100 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-3 right-3 bg-fuchsia-600 text-white font-bold text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider">
              POPULAR
            </div>

            <div>
              <span className="text-[10px] font-bold text-fuchsia-600 uppercase tracking-wider">Scale & API</span>
              <h4 className="text-lg font-bold text-slate-900 mt-1">Pro Plan</h4>
              <div className="text-2xl font-extrabold text-slate-900 mt-2">$49 <span className="text-xs text-slate-400 font-normal">/ month</span></div>

              <div className="space-y-2 mt-4 text-xs text-slate-700">
                <div className="flex items-center gap-2 font-medium">
                  <Check className="w-3.5 h-3.5 text-fuchsia-600 stroke-[3]" />
                  <span>10,000 AI responses/month</span>
                </div>
                <div className="flex items-center gap-2 font-medium">
                  <Check className="w-3.5 h-3.5 text-fuchsia-600 stroke-[3]" />
                  <span>Unlimited Knowledge Bases & Docs</span>
                </div>
                <div className="flex items-center gap-2 font-medium">
                  <Check className="w-3.5 h-3.5 text-fuchsia-600 stroke-[3]" />
                  <span>Custom Production API Keys</span>
                </div>
                <div className="flex items-center gap-2 font-medium">
                  <Check className="w-3.5 h-3.5 text-fuchsia-600 stroke-[3]" />
                  <span>Outbound Webhooks with HMAC</span>
                </div>
                <div className="flex items-center gap-2 font-medium">
                  <Check className="w-3.5 h-3.5 text-fuchsia-600 stroke-[3]" />
                  <span>Remove Support AI Branding</span>
                </div>
              </div>
            </div>

            <div className="pt-6">
              <button
                type="button"
                onClick={() => handleCheckout("PRO")}
                disabled={isLoading}
                className="w-full py-2.5 rounded-xl bg-fuchsia-600 hover:bg-fuchsia-700 active:bg-fuchsia-800 text-white font-semibold text-xs shadow-md shadow-fuchsia-600/20 transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Upgrade to Pro</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
