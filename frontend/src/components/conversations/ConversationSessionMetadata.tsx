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

        {/* The detailed mocked metrics (Visitor Context, Handling Mode, RAG Citations) have been removed until backend tracking is implemented. */}
      </div>

      <div className="pt-4 border-t border-slate-100 text-[10px] text-slate-400 flex items-center gap-1.5">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
        <span>End-to-End Encrypted Session</span>
      </div>
    </div>
  );
}
