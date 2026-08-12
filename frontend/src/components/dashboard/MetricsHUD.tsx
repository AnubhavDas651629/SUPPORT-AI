"use client";

import React from "react";
import { Bot, LifeBuoy, BookOpen, CheckCircle2, TrendingUp, Zap } from "lucide-react";
import { useOrganization } from "@/context/OrganizationContext";

export function MetricsHUD() {
  const { usage, subscription } = useOrganization();

  const aiUsed = usage?.ai_responses?.used ?? 42;
  const aiLimit = usage?.ai_responses?.limit ?? 100;
  const aiPercent = Math.min(Math.round((aiUsed / aiLimit) * 100), 100);

  const planTier = subscription?.plan_tier || "FREE";

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 w-full">
      {/* Metric 1: Monthly AI Quota */}
      <div className="p-4 bg-white rounded-3xl border border-slate-200/80 shadow-2xs flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Monthly AI Quota
          </span>
          <div className="w-7 h-7 rounded-xl bg-fuchsia-50 text-fuchsia-600 flex items-center justify-center border border-fuchsia-100">
            <Bot className="w-3.5 h-3.5" />
          </div>
        </div>

        <div className="mt-2 mb-3">
          <div className="text-xl font-extrabold text-slate-900 tracking-tight">
            {aiUsed} <span className="text-xs font-medium text-slate-400">/ {aiLimit} msgs</span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-0.5">
            <span>Quota Used</span>
            <span className="font-semibold text-slate-700">{aiPercent}%</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-fuchsia-500 to-fuchsia-600 rounded-full transition-all duration-500"
            style={{ width: `${aiPercent}%` }}
          />
        </div>
      </div>

      {/* Metric 2: Open Escalation Tickets */}
      <div className="p-4 bg-white rounded-3xl border border-slate-200/80 shadow-2xs flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Escalation Queue
          </span>
          <div className="w-7 h-7 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100">
            <LifeBuoy className="w-3.5 h-3.5" />
          </div>
        </div>

        <div className="mt-2 mb-3">
          <div className="text-xl font-extrabold text-slate-900 tracking-tight">
            3 <span className="text-xs font-medium text-slate-400">Pending</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-rose-600 font-semibold mt-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
            <span>1 Urgent refund request</span>
          </div>
        </div>

        <div className="flex items-center justify-between text-[10px] text-slate-400 pt-2 border-t border-slate-100">
          <span>Avg response SLA</span>
          <span className="font-bold text-slate-700">12 mins</span>
        </div>
      </div>

      {/* Metric 3: Knowledge Base Sync */}
      <div className="p-4 bg-white rounded-3xl border border-slate-200/80 shadow-2xs flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Vector Embeddings
          </span>
          <div className="w-7 h-7 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
            <BookOpen className="w-3.5 h-3.5" />
          </div>
        </div>

        <div className="mt-2 mb-3">
          <div className="text-xl font-extrabold text-slate-900 tracking-tight">
            14 <span className="text-xs font-medium text-slate-400">Docs</span>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-semibold mt-0.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>100% pgvector Synced</span>
          </div>
        </div>

        <div className="flex items-center justify-between text-[10px] text-slate-400 pt-2 border-t border-slate-100">
          <span>Total Chunks</span>
          <span className="font-bold text-slate-700">1,480 vectors</span>
        </div>
      </div>

      {/* Metric 4: AI Resolution Rate */}
      <div className="p-4 bg-white rounded-3xl border border-slate-200/80 shadow-2xs flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            AI Resolution Rate
          </span>
          <div className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
            <TrendingUp className="w-3.5 h-3.5" />
          </div>
        </div>

        <div className="mt-2 mb-3">
          <div className="text-xl font-extrabold text-slate-900 tracking-tight">
            89.4%
          </div>
          <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-semibold mt-0.5">
            <span>+4.2% from last week</span>
          </div>
        </div>

        <div className="flex items-center justify-between text-[10px] text-slate-400 pt-2 border-t border-slate-100">
          <span>Auto-deflected chats</span>
          <span className="font-bold text-slate-700">162 / 181</span>
        </div>
      </div>
    </div>
  );
}
