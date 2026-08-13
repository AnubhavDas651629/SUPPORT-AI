"use client";

import React from "react";
import { User, Mail, Globe, Clock, BookOpen, ShieldCheck, Sparkles, ExternalLink } from "lucide-react";
import { TicketItem } from "@/types/dashboard";

export function CustomerContextSidebar({ ticket, messages = [] }: { ticket: TicketItem; messages?: any[] }) {
  // Extract unique citations across all AI messages
  const allCitations = messages
    .filter(m => m.sender === "ai" && Array.isArray(m.citations))
    .flatMap(m => m.citations);
    
  const uniqueCitations = Array.from(new Map(allCitations.map(c => [c.filename, c])).values());

  return (
    <div className="w-72 bg-white border-l border-slate-200/80 p-5 flex flex-col justify-between h-full overflow-y-auto space-y-6">
      {/* Customer Profile Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-fuchsia-500 to-indigo-600 text-white flex items-center justify-center font-extrabold text-sm shadow-xs shrink-0">
            {ticket.customer_name ? ticket.customer_name.charAt(0).toUpperCase() : "C"}
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-extrabold text-slate-900 truncate">
              {ticket.customer_name || "Anonymous Customer"}
            </h4>
            <span className="text-[10px] font-bold text-fuchsia-700 bg-fuchsia-50 px-2 py-0.5 rounded-full inline-block mt-0.5">
              Verified Customer
            </span>
          </div>
        </div>

        {/* Info Grid */}
        <div className="space-y-2.5 text-xs">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Email Address</span>
            <span className="text-slate-800 font-medium truncate block">{ticket.customer_email || "customer@org.com"}</span>
          </div>

          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Conversation ID</span>
            <span className="font-mono text-[11px] text-slate-600 truncate block">{ticket.conversation_id}</span>
          </div>

          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Created</span>
            <span className="text-slate-700">{ticket.created_at}</span>
          </div>

          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Assigned Agent</span>
            <span className="text-slate-900 font-semibold">{ticket.assigned_to || "Unassigned"}</span>
          </div>
        </div>
      </div>

      {/* RAG Knowledge Base Citations Referenced during Chat */}
      <div className="p-3.5 bg-slate-50 border border-slate-200/70 rounded-2xl space-y-2.5">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
          <BookOpen className="w-3.5 h-3.5 text-blue-600" />
          <span>Referenced Documents</span>
        </div>
        <div className="space-y-1.5 text-[11px]">
          {uniqueCitations.length === 0 ? (
            <div className="text-slate-400 text-xs italic py-2 text-center">No documents referenced</div>
          ) : (
            uniqueCitations.map((cit: any, idx: number) => (
              <div key={idx} className="p-2 bg-white rounded-xl border border-slate-200 text-slate-700 flex items-center justify-between">
                <span className="truncate" title={cit.filename}>{cit.filename || "Unknown Document"}</span>
                <span className="text-[10px] font-bold text-emerald-600 shrink-0">Cited</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* SLA & Priority Summary */}
      <div className="p-3.5 bg-gradient-to-br from-[#FDF2F8] to-[#F5F3FF] border border-fuchsia-200/60 rounded-2xl space-y-2 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-slate-500 uppercase">SLA Target</span>
          <span className="text-rose-600 font-bold text-[11px]">{ticket.sla_deadline || "2 hrs left"}</span>
        </div>
        <div className="w-full h-1.5 bg-slate-200/60 rounded-full overflow-hidden">
          <div className="h-full bg-rose-500 rounded-full w-3/4" />
        </div>
        <p className="text-[10px] text-slate-400">Escalated to prevent SLA breach</p>
      </div>
    </div>
  );
}
