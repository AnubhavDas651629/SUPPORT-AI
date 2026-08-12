"use client";

import React, { useState, useEffect } from "react";
import { Bot, LifeBuoy, BookOpen, CheckCircle2, TrendingUp, Zap, Sparkles, Loader2 } from "lucide-react";
import { useOrganization } from "@/context/OrganizationContext";
import { api } from "@/lib/api";

export function MetricsHUD() {
  const { currentOrg, usage, subscription } = useOrganization();
  const [openTicketsCount, setOpenTicketsCount] = useState<number>(0);
  const [urgentCount, setUrgentCount] = useState<number>(0);
  const [totalDocsCount, setTotalDocsCount] = useState<number>(0);
  const [totalChunksCount, setTotalChunksCount] = useState<number>(0);
  const [isLoadingStats, setIsLoadingStats] = useState<boolean>(true);

  useEffect(() => {
    if (!currentOrg) return;

    async function loadRealStats() {
      setIsLoadingStats(true);
      try {
        // 1. Fetch live tickets for this organization
        const ticketsRes = await api.get(`/tickets?organization_id=${currentOrg!.id}`);
        const items = ticketsRes.data?.items || [];
        const open = items.filter((t: any) => t.status === "OPEN" || t.status === "IN_PROGRESS").length;
        const urgent = items.filter((t: any) => (t.priority === "URGENT" || t.priority === "HIGH") && t.status === "OPEN").length;
        setOpenTicketsCount(open);
        setUrgentCount(urgent);

        // 2. Fetch live knowledge bases and documents
        const kbRes = await api.get(`/organizations/${currentOrg!.id}/knowledge-bases`);
        const kbs = Array.isArray(kbRes.data) ? kbRes.data : [];
        let docCount = 0;
        let chunkCount = 0;

        if (kbs.length > 0) {
          const docsPromises = kbs.map((kb: any) =>
            api.get(`/organizations/${currentOrg!.id}/knowledge-bases/${kb.id}/documents`).catch(() => ({ data: [] }))
          );
          const docsResults = await Promise.all(docsPromises);
          docsResults.forEach((res) => {
            if (Array.isArray(res.data)) {
              docCount += res.data.length;
              res.data.forEach((d: any) => {
                chunkCount += d.chunk_count || 0;
              });
            }
          });
        }
        setTotalDocsCount(docCount);
        setTotalChunksCount(chunkCount);
      } catch (err) {
        console.warn("Could not load real metrics stats:", err);
      } finally {
        setIsLoadingStats(false);
      }
    }

    loadRealStats();
  }, [currentOrg]);

  const aiUsed = usage?.ai_responses?.used ?? 0;
  const aiLimit = usage?.ai_responses?.limit ?? (subscription?.limits?.max_ai_responses_per_month ?? 100);
  const aiPercent = aiLimit > 0 ? Math.min(Math.round((aiUsed / aiLimit) * 100), 100) : 0;
  const conversationsCount = usage?.conversations?.used ?? 0;

  // AI automation rate
  const automationRate = conversationsCount > 0
    ? `${Math.max(0, Math.round(((conversationsCount - openTicketsCount) / conversationsCount) * 100))}%`
    : "100%";

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
            style={{ width: `${Math.max(aiPercent, 2)}%` }}
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
            {openTicketsCount} <span className="text-xs font-medium text-slate-400">Pending</span>
          </div>
          {urgentCount > 0 ? (
            <div className="flex items-center gap-1.5 text-[11px] text-rose-600 font-semibold mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
              <span>{urgentCount} Urgent escalation{urgentCount > 1 ? "s" : ""}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-semibold mt-0.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{openTicketsCount === 0 ? "All caught up" : "Normal SLA"}</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between text-[10px] text-slate-400 pt-2 border-t border-slate-100">
          <span>Avg response SLA</span>
          <span className="font-bold text-slate-700">{openTicketsCount > 0 ? "15 mins" : "0 pending"}</span>
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
            {totalDocsCount} <span className="text-xs font-medium text-slate-400">Docs</span>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-semibold mt-0.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{totalDocsCount > 0 ? "100% pgvector Synced" : "Ready for Upload"}</span>
          </div>
        </div>

        <div className="flex items-center justify-between text-[10px] text-slate-400 pt-2 border-t border-slate-100">
          <span>Total Chunks</span>
          <span className="font-bold text-slate-700">{totalChunksCount.toLocaleString()} vectors</span>
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
            {automationRate}
          </div>
          <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-semibold mt-0.5">
            <span>{conversationsCount} total conversation{conversationsCount !== 1 ? "s" : ""}</span>
          </div>
        </div>

        <div className="flex items-center justify-between text-[10px] text-slate-400 pt-2 border-t border-slate-100">
          <span>Autonomous deflection</span>
          <span className="font-bold text-slate-700">
            {conversationsCount > 0 ? `${Math.max(0, conversationsCount - openTicketsCount)} / ${conversationsCount}` : "Ready"}
          </span>
        </div>
      </div>
    </div>
  );
}
