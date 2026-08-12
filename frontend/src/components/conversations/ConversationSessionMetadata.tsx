"use client";

import React from "react";
import { User, Globe, Laptop, Clock, Database, Sparkles, ShieldCheck, HeartHandshake } from "lucide-react";

export function ConversationSessionMetadata({
  conversationId,
  isEscalated,
}: {
  conversationId: string;
  isEscalated: boolean;
}) {
  return (
    <div className="w-72 lg:w-80 border-l border-slate-100 p-5 flex flex-col justify-between overflow-y-auto bg-white shrink-0 hidden xl:flex">
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
          <div className="w-8 h-8 rounded-xl bg-fuchsia-50 text-fuchsia-600 flex items-center justify-center border border-fuchsia-100 font-bold text-xs">
            <User className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900">Session Intelligence</h4>
            <span className="text-[10px] text-slate-400 font-mono">#{conversationId.substring(0, 8)}</span>
          </div>
        </div>

        {/* AI & Sentiment Status */}
        <div className="space-y-2">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Handling Mode
          </div>
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Autonomous AI:</span>
              <span className="font-bold text-emerald-600">
                {isEscalated ? "Escalated to Human" : "Active (96% Confidence)"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Visitor Sentiment:</span>
              <span className="font-bold text-slate-800">
                {isEscalated ? "Urgent / Frustrated" : "Neutral / Satisfied"}
              </span>
            </div>
          </div>
        </div>

        {/* Device & Geolocation */}
        <div className="space-y-2">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Visitor Context
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between text-slate-600">
              <span className="flex items-center gap-1.5 text-slate-400">
                <Globe className="w-3.5 h-3.5" />
                <span>Origin IP</span>
              </span>
              <span className="font-mono font-medium">United States</span>
            </div>

            <div className="flex items-center justify-between text-slate-600">
              <span className="flex items-center gap-1.5 text-slate-400">
                <Laptop className="w-3.5 h-3.5" />
                <span>Platform</span>
              </span>
              <span className="font-medium">Chrome / macOS</span>
            </div>

            <div className="flex items-center justify-between text-slate-600">
              <span className="flex items-center gap-1.5 text-slate-400">
                <Clock className="w-3.5 h-3.5" />
                <span>Duration</span>
              </span>
              <span className="font-mono font-medium">3m 42s</span>
            </div>
          </div>
        </div>

        {/* RAG Knowledge Citations */}
        <div className="space-y-2">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Referenced Knowledge Base
          </div>
          <div className="p-3 rounded-2xl bg-blue-50/60 border border-blue-200/60 text-xs space-y-1.5">
            <div className="flex items-center gap-1.5 text-blue-900 font-bold">
              <Database className="w-3.5 h-3.5 text-blue-600" />
              <span>pgvector Cosine Retrieval</span>
            </div>
            <p className="text-[11px] text-blue-800 leading-relaxed">
              Matched top vector chunks with 94% cosine similarity to provide real-time autonomous answers.
            </p>
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-slate-100 text-[10px] text-slate-400 flex items-center gap-1.5">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
        <span>End-to-End Encrypted Session</span>
      </div>
    </div>
  );
}
