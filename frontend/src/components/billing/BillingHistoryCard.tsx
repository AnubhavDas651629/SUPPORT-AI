"use client";

import React, { useState } from "react";
import { CreditCard, Download, ExternalLink, ShieldCheck, CheckCircle2, Loader2 } from "lucide-react";
import { useOrganization } from "@/context/OrganizationContext";
import { api } from "@/lib/api";

export function BillingHistoryCard() {
  const { currentOrg, subscription } = useOrganization();
  const [isOpeningPortal, setIsOpeningPortal] = useState(false);

  const planTier = subscription?.plan_tier || "FREE";
  const isPaidPlan = planTier !== "FREE";

  const handleOpenBillingPortal = async () => {
    if (!currentOrg) return;
    setIsOpeningPortal(true);
    try {
      const res = await api.post(`/organizations/${currentOrg.id}/subscription/portal`, {
        return_url: window.location.href,
      });
      if (res.data?.checkout_url) {
        window.location.href = res.data.checkout_url;
      }
    } catch (err) {
      alert("Stripe customer portal is available for active paid subscribers.");
    } finally {
      setIsOpeningPortal(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-xs">
            <CreditCard className="w-5 h-5 text-fuchsia-400" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <span>Billing & Invoices</span>
              <span className="text-[10px] bg-emerald-100 text-emerald-700 font-bold px-2 py-0.5 rounded-full">
                Stripe Payments
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Manage payment methods, download PDF receipts, and view subscription terms.
            </p>
          </div>
        </div>

        {isPaidPlan && (
          <button
            type="button"
            onClick={handleOpenBillingPortal}
            disabled={isOpeningPortal}
            className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-slate-100 hover:bg-slate-200/80 text-slate-800 text-xs font-semibold transition cursor-pointer"
          >
            {isOpeningPortal ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ExternalLink className="w-3.5 h-3.5 text-slate-500" />}
            <span>Customer Portal</span>
          </button>
        )}
      </div>

      {/* Subscription Summary Box */}
      <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div>
          <div className="font-bold text-slate-900">
            {planTier} Tier Subscription • Active
          </div>
          <div className="text-slate-400 text-[11px] mt-0.5">
            {isPaidPlan
              ? "Renews automatically via Stripe payment method."
              : "Free Tier includes 100 autonomous AI messages every month."}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-semibold text-slate-700">Encrypted Stripe Billing</span>
        </div>
      </div>
    </div>
  );
}
