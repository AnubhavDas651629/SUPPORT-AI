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
    <div className="w-80 lg:w-96 bg-slate-50 flex flex-col justify-between overflow-hidden shrink-0 border-r border-slate-200">
      {/* Search & Header */}
      <div className="p-3 border-b border-slate-200 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-slate-900">Inbox</h3>
          </div>
          <span className="text-[10px] font-medium text-slate-500 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Live</span>
          </span>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search conversations..."
            className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400 focus:border-slate-400 transition"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1">
          {(["ALL", "AI", "ESCALATED"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition cursor-pointer ${
                filter === f
                  ? "bg-slate-200 text-slate-900"
                  : "text-slate-500 hover:bg-slate-200/50"
              }`}
            >
              {f === "ALL" ? "All" : f === "AI" ? "AI Only" : "Escalated"}
            </button>
          ))}
        </div>
      </div>

      {/* List Body */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-8 text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
            <span>Loading...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 space-y-3">
            <MessageSquare className="w-8 h-8 text-slate-300 mx-auto" />
            <div>
              <p className="font-medium text-slate-600">No conversations</p>
            </div>
            {onOpenSimulator && (
              <button
                type="button"
                onClick={onOpenSimulator}
                className="px-3 py-1.5 rounded bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium transition cursor-pointer"
              >
                Test AI Simulator
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
                className={`p-3 transition cursor-pointer space-y-1 border-l-[3px] border-b border-b-slate-200/50 ${
                  isSelected
                    ? "bg-white border-l-slate-900"
                    : "hover:bg-white/60 border-l-transparent"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <h4 className={`text-sm truncate ${isSelected ? 'font-semibold text-slate-900' : 'font-medium text-slate-700'}`}>
                      {conv.title || "Visitor Session"}
                    </h4>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className={`w-1.5 h-1.5 rounded-full ${conv.is_escalated ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                    <span className="text-[10px] font-medium text-slate-500">
                      {conv.is_escalated ? "Human" : "AI"}
                    </span>
                  </div>
                </div>

                <p className={`text-xs line-clamp-1 ${isSelected ? 'text-slate-600' : 'text-slate-500'}`}>
                  {conv.last_message || "Active customer query in progress..."}
                </p>

                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-300" />
                    <span>{conv.updated_at}</span>
                  </span>

                  <span className="font-medium">
                    {conv.messages_count || 2} msgs
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Bottom Summary Bar */}
      <div className="p-3 border-t border-slate-200 bg-slate-100 flex items-center justify-between text-[11px] text-slate-500">
        <span>{filtered.length} total</span>
        <span className="font-medium text-slate-700">
          {conversations.filter((c) => !c.is_escalated).length} AI handled
        </span>
      </div>
    </div>
  );
}
