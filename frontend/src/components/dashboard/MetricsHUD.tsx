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
    <div className="flex flex-col sm:flex-row bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden divide-y sm:divide-y-0 sm:divide-x divide-slate-200">
      {/* Metric 1: Monthly AI Quota */}
      <div className="flex-1 p-4 sm:p-5 flex flex-col justify-between hover:bg-slate-50/50 transition">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <Bot className="w-4 h-4 text-slate-400" />
            Monthly Quota
          </span>
          <span className="text-xs font-medium text-slate-400">{aiPercent}% Used</span>
        </div>
        <div className="flex items-baseline gap-2">
          <div className="text-2xl font-bold text-slate-900 tracking-tight">{aiUsed}</div>
          <div className="text-sm font-medium text-slate-500">/ {aiLimit} msgs</div>
        </div>
      </div>

      {/* Metric 2: Open Escalation Tickets */}
      <div className="flex-1 p-4 sm:p-5 flex flex-col justify-between hover:bg-slate-50/50 transition">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <LifeBuoy className="w-4 h-4 text-slate-400" />
            Escalation Queue
          </span>
          {urgentCount > 0 ? (
            <span className="flex items-center gap-1.5 text-[11px] text-rose-600 font-semibold px-2 py-0.5 bg-rose-50 rounded">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
              {urgentCount} Urgent
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[11px] text-slate-500">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> All caught up
            </span>
          )}
        </div>
        <div className="flex items-baseline gap-2">
          <div className="text-2xl font-bold text-slate-900 tracking-tight">{openTicketsCount}</div>
          <div className="text-sm font-medium text-slate-500">Pending</div>
        </div>
      </div>

      {/* Metric 3: Vector Embeddings */}
      <div className="flex-1 p-4 sm:p-5 flex flex-col justify-between hover:bg-slate-50/50 transition">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <BookOpen className="w-4 h-4 text-slate-400" />
            Vector Store
          </span>
          <span className="text-[11px] font-medium text-slate-400">pgvector</span>
        </div>
        <div className="flex items-baseline gap-2">
          <div className="text-2xl font-bold text-slate-900 tracking-tight">{totalDocsCount}</div>
          <div className="text-sm font-medium text-slate-500">Docs Synced</div>
        </div>
      </div>

      {/* Metric 4: AI Resolution Rate */}
      <div className="flex-1 p-4 sm:p-5 flex flex-col justify-between hover:bg-slate-50/50 transition">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-slate-400" />
            Resolution Rate
          </span>
          <span className="text-[11px] font-medium text-slate-400">Total: {conversationsCount}</span>
        </div>
        <div className="flex items-baseline gap-2">
          <div className="text-2xl font-bold text-slate-900 tracking-tight">{automationRate}</div>
          <div className="text-sm font-medium text-slate-500">Autonomous</div>
        </div>
      </div>
    </div>
  );
}
