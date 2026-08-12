"use client";

import React from "react";
import { Bot, HardDrive, BookOpen, Users, Zap, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useOrganization } from "@/context/OrganizationContext";

export function QuotaMetersCard() {
  const { usage, subscription } = useOrganization();

  const planTier = subscription?.plan_tier || "FREE";
  const limits = subscription?.limits || {
    max_ai_responses_per_month: 100,
    max_storage_bytes: 100 * 1024 * 1024,
    max_knowledge_bases: 1,
    max_members: 1,
  };

  // 1. AI Responses
  const aiUsed = usage?.ai_responses?.used ?? 0;
  const aiLimit = usage?.ai_responses?.limit ?? limits.max_ai_responses_per_month;
  const aiPercent = aiLimit > 0 ? Math.min(Math.round((aiUsed / aiLimit) * 100), 100) : 0;

  // 2. Storage
  const storageUsedBytes = usage?.storage_bytes?.used ?? 0;
  const storageLimitBytes = usage?.storage_bytes?.limit ?? limits.max_storage_bytes;
  const storageUsedMB = (storageUsedBytes / (1024 * 1024)).toFixed(1);
  const storageLimitMB = (storageLimitBytes / (1024 * 1024)).toFixed(0);
  const storagePercent = storageLimitBytes > 0 ? Math.min(Math.round((storageUsedBytes / storageLimitBytes) * 100), 100) : 0;

  // 3. Knowledge Bases & Team Members
  const kbsUsed = 1;
  const kbsLimit = limits.max_knowledge_bases;
  const kbsPercent = Math.min(Math.round((kbsUsed / kbsLimit) * 100), 100);

  const membersUsed = 1;
  const membersLimit = limits.max_members;
  const membersPercent = Math.min(Math.round((membersUsed / membersLimit) * 100), 100);

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
        <div>
          <h3 className="text-sm font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Resource Quotas & Capacity Utilization</span>
            <span className="text-[10px] bg-fuchsia-50 text-fuchsia-700 font-bold px-2 py-0.5 rounded-full">
              Live Meters
            </span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Current billing cycle quota allocation and consumption rates.
          </p>
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Quota resets on: <strong className="text-slate-800">{new Date(Date.now() + 18 * 24 * 60 * 60 * 1000).toLocaleDateString()}</strong>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Meter 1: AI Responses */}
        <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/70 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-fuchsia-50 text-fuchsia-600 flex items-center justify-center border border-fuchsia-100">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">Monthly AI Responses</h4>
                <div className="text-[11px] text-slate-400">Autonomous LLM Chat & RAG Answers</div>
              </div>
            </div>
            <span className="text-xs font-extrabold font-mono text-slate-900">
              {aiUsed.toLocaleString()} <span className="text-slate-400 font-normal">/ {aiLimit.toLocaleString()}</span>
            </span>
          </div>

          <div className="w-full h-2 bg-slate-200/80 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                aiPercent > 90
                  ? "bg-rose-500"
                  : aiPercent > 70
                  ? "bg-amber-500"
                  : "bg-gradient-to-r from-fuchsia-500 to-indigo-600"
              }`}
              style={{ width: `${Math.max(aiPercent, 2)}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
            <span>{aiPercent}% consumed</span>
            <span>{(aiLimit - aiUsed).toLocaleString()} remaining</span>
          </div>
        </div>

        {/* Meter 2: Vector Storage */}
        <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/70 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                <HardDrive className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">Vector Storage & Embeddings</h4>
                <div className="text-[11px] text-slate-400">PostgreSQL pgvector chunk storage</div>
              </div>
            </div>
            <span className="text-xs font-extrabold font-mono text-slate-900">
              {storageUsedMB} MB <span className="text-slate-400 font-normal">/ {storageLimitMB} MB</span>
            </span>
          </div>

          <div className="w-full h-2 bg-slate-200/80 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full transition-all duration-500"
              style={{ width: `${Math.max(storagePercent, 2)}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
            <span>{storagePercent}% storage used</span>
            <span>{(storageLimitBytes > 1024 * 1024 * 1024 ? `${(storageLimitBytes / (1024 * 1024 * 1024)).toFixed(0)} GB` : `${storageLimitMB} MB`)} cap</span>
          </div>
        </div>

        {/* Meter 3: Knowledge Base Count */}
        <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/70 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100">
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">Knowledge Bases</h4>
                <div className="text-[11px] text-slate-400">Isolated vector indexes</div>
              </div>
            </div>
            <span className="text-xs font-extrabold font-mono text-slate-900">
              {kbsUsed} <span className="text-slate-400 font-normal">/ {kbsLimit}</span>
            </span>
          </div>

          <div className="w-full h-2 bg-slate-200/80 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-fuchsia-500 rounded-full transition-all duration-500"
              style={{ width: `${Math.max(kbsPercent, 10)}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
            <span>{kbsUsed} of {kbsLimit} active</span>
            <span>{kbsLimit === 1 ? "1 KB on Free Tier" : `${kbsLimit} KBs permitted`}</span>
          </div>
        </div>

        {/* Meter 4: Team Members */}
        <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/70 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">Team Seats</h4>
                <div className="text-[11px] text-slate-400">Agents and administrators</div>
              </div>
            </div>
            <span className="text-xs font-extrabold font-mono text-slate-900">
              {membersUsed} <span className="text-slate-400 font-normal">/ {membersLimit} seat{membersLimit > 1 ? "s" : ""}</span>
            </span>
          </div>

          <div className="w-full h-2 bg-slate-200/80 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500"
              style={{ width: `${Math.max(membersPercent, 10)}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
            <span>{membersUsed} active user</span>
            <span>{planTier === "FREE" ? "Upgrade for team seats" : "Multi-agent support"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
