"use client";

import React, { useState } from "react";
import { Search, MessageSquare, Bot, User, Clock, CheckCircle2, AlertCircle, Sparkles, Loader2 } from "lucide-react";

export interface ConversationItem {
  id: string;
  title: string;
  updated_at: string;
  messages_count?: number;
  last_message?: string;
  sentiment?: "positive" | "negative" | "neutral";
  is_escalated?: boolean;
}

export function ConversationListPane({
  conversations,
  isLoading,
  selectedId,
  onSelectConversation,
  onOpenSimulator,
}: {
  conversations: ConversationItem[];
  isLoading: boolean;
  selectedId: string;
  onSelectConversation: (conv: ConversationItem) => void;
  onOpenSimulator?: () => void;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<"ALL" | "AI" | "ESCALATED">("ALL");

  const filtered = conversations.filter((c) => {
    const matchesSearch =
      !searchQuery ||
      c.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.last_message?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter =
      filter === "ALL" ||
      (filter === "ESCALATED" && c.is_escalated) ||
      (filter === "AI" && !c.is_escalated);

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="w-80 lg:w-96 bg-white rounded-3xl border border-slate-200/80 shadow-2xs flex flex-col justify-between overflow-hidden h-[calc(100vh-140px)] shrink-0">
      {/* Search & Header */}
      <div className="p-4 border-b border-slate-100 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-fuchsia-600" />
            <h3 className="text-sm font-extrabold text-slate-900">Live Conversations</h3>
          </div>
          <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Streaming</span>
          </span>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search active chat sessions..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/20 focus:border-fuchsia-500 transition"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1">
          {(["ALL", "AI", "ESCALATED"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition cursor-pointer ${
                filter === f
                  ? "bg-fuchsia-600 text-white shadow-2xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200/60"
              }`}
            >
              {f === "ALL" ? "All Sessions" : f === "AI" ? "AI Autonomous" : "Escalated"}
            </button>
          ))}
        </div>
      </div>

      {/* List Body */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2 space-y-1">
        {isLoading ? (
          <div className="p-8 text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-fuchsia-600" />
            <span>Loading active conversations...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 space-y-3">
            <MessageSquare className="w-8 h-8 text-slate-200 mx-auto" />
            <div>
              <p className="font-bold text-slate-700">No active conversations</p>
              <p className="text-[11px] mt-0.5">
                When visitors chat on your live widget, sessions stream here in real time.
              </p>
            </div>
            {onOpenSimulator && (
              <button
                type="button"
                onClick={onOpenSimulator}
                className="px-3 py-1.5 rounded-xl bg-fuchsia-600 hover:bg-fuchsia-700 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
              >
                Test AI Chat Simulator
              </button>
            )}
          </div>
        ) : (
          filtered.map((conv) => {
            const isSelected = conv.id === selectedId;

            return (
              <div
                key={conv.id}
                onClick={() => onSelectConversation(conv)}
                className={`p-3.5 rounded-2xl transition cursor-pointer space-y-2 border ${
                  isSelected
                    ? "bg-gradient-to-r from-[#FDF2F8]/80 to-[#F5F3FF]/60 border-fuchsia-300/80 shadow-xs"
                    : "hover:bg-slate-50/80 border-transparent"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-6 h-6 rounded-lg bg-fuchsia-100 text-fuchsia-600 flex items-center justify-center font-bold text-[10px] shrink-0">
                      <Bot className="w-3.5 h-3.5" />
                    </div>
                    <h4 className="text-xs font-bold text-slate-900 truncate">
                      {conv.title || "Visitor Session"}
                    </h4>
                  </div>

                  <span
                    className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0 ${
                      conv.is_escalated
                        ? "bg-rose-100 text-rose-700"
                        : "bg-emerald-100 text-emerald-700"
                    }`}
                  >
                    {conv.is_escalated ? "Human Agent" : "Autonomous AI"}
                  </span>
                </div>

                <p className="text-xs text-slate-500 line-clamp-1 leading-relaxed">
                  {conv.last_message || "Active customer query in progress..."}
                </p>

                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>{conv.updated_at}</span>
                  </span>

                  <span className="font-semibold text-slate-600">
                    {conv.messages_count || 2} msgs
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Bottom Summary Bar */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-[11px] text-slate-500">
        <span>{filtered.length} total sessions</span>
        <span className="font-semibold text-emerald-600">
          {conversations.filter((c) => !c.is_escalated).length} handled by AI
        </span>
      </div>
    </div>
  );
}
