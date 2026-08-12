"use client";

import React, { useState } from "react";
import {
  Search,
  Filter,
  Plus,
  LifeBuoy,
  Clock,
  MessageSquare,
  Paperclip,
  CheckCircle2,
  ChevronDown,
  Loader2,
} from "lucide-react";
import { TicketItem, TicketPriority, TicketStatus } from "@/types/dashboard";

export function TicketListPane({
  tickets,
  isLoading,
  selectedTicketId,
  onSelectTicket,
  onOpenNewTicket,
}: {
  tickets: TicketItem[];
  isLoading: boolean;
  selectedTicketId: string;
  onSelectTicket: (ticket: TicketItem) => void;
  onOpenNewTicket: () => void;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [priorityFilter, setPriorityFilter] = useState<string>("ALL");

  const filtered = tickets.filter((t) => {
    const matchesStatus =
      statusFilter === "ALL" ||
      (statusFilter === "OPEN" && t.status === "OPEN") ||
      (statusFilter === "IN_PROGRESS" && t.status === "IN_PROGRESS") ||
      (statusFilter === "RESOLVED" && t.status === "RESOLVED");

    const matchesPriority =
      priorityFilter === "ALL" || t.priority === priorityFilter;

    const matchesSearch =
      !searchQuery ||
      t.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.customer_email?.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesStatus && matchesPriority && matchesSearch;
  });

  return (
    <div className="w-80 lg:w-96 bg-white rounded-3xl border border-slate-200/80 shadow-2xs flex flex-col justify-between overflow-hidden h-[calc(100vh-140px)] shrink-0">
      {/* Search & Actions Bar */}
      <div className="p-4 border-b border-slate-100 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LifeBuoy className="w-4 h-4 text-fuchsia-600" />
            <h3 className="text-sm font-extrabold text-slate-900">Ticket Inbox</h3>
          </div>

          <button
            type="button"
            onClick={onOpenNewTicket}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-fuchsia-600 hover:bg-fuchsia-700 text-white text-xs font-bold transition shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tickets, customers..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/20 focus:border-fuchsia-500 transition"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1">
          {["ALL", "OPEN", "IN_PROGRESS", "RESOLVED"].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-2.5 py-1 rounded-xl text-[11px] font-bold shrink-0 transition cursor-pointer ${
                statusFilter === st
                  ? "bg-fuchsia-600 text-white shadow-2xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200/60"
              }`}
            >
              {st === "ALL" ? "All" : st.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Ticket List */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2 space-y-1">
        {isLoading ? (
          <div className="p-8 text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-fuchsia-600" />
            <span>Loading tickets from server...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            <LifeBuoy className="w-8 h-8 text-slate-200 mx-auto mb-2" />
            <p className="font-bold text-slate-700">No tickets found</p>
            <p className="mt-0.5">Escalated chats or new tickets will appear here.</p>
          </div>
        ) : (
          filtered.map((ticket) => {
            const isSelected = ticket.id === selectedTicketId;

            return (
              <div
                key={ticket.id}
                onClick={() => onSelectTicket(ticket)}
                className={`p-3.5 rounded-2xl transition cursor-pointer space-y-2 border ${
                  isSelected
                    ? "bg-gradient-to-r from-[#FDF2F8]/80 to-[#F5F3FF]/60 border-fuchsia-300/80 shadow-xs"
                    : "hover:bg-slate-50/80 border-transparent"
                }`}
              >
                {/* Header Line */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-6 h-6 rounded-lg bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-[10px] shrink-0">
                      {ticket.customer_name ? ticket.customer_name.charAt(0).toUpperCase() : "C"}
                    </div>
                    <span className="text-xs font-bold text-slate-900 truncate">
                      {ticket.customer_name || "Customer"}
                    </span>
                  </div>

                  <span
                    className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0 ${
                      ticket.priority === "URGENT"
                        ? "bg-rose-600 text-white"
                        : ticket.priority === "HIGH"
                        ? "bg-rose-100 text-rose-700"
                        : ticket.priority === "MEDIUM"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {ticket.priority}
                  </span>
                </div>

                {/* Subject */}
                <h4 className="text-xs font-semibold text-slate-800 line-clamp-2 leading-relaxed">
                  {ticket.subject}
                </h4>

                {/* Footer Line */}
                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>{ticket.sla_deadline || "4 hrs left"}</span>
                  </span>

                  <span
                    className={`font-bold px-1.5 py-0.2 rounded ${
                      ticket.status === "OPEN"
                        ? "bg-rose-50 text-rose-700"
                        : ticket.status === "IN_PROGRESS"
                        ? "bg-fuchsia-50 text-fuchsia-700"
                        : "bg-emerald-50 text-emerald-700"
                    }`}
                  >
                    {ticket.status.replace("_", " ")}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Bottom Summary Bar */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-[11px] text-slate-500">
        <span>{filtered.length} tickets total</span>
        <span className="font-semibold text-rose-600">
          {tickets.filter((t) => t.status === "OPEN").length} open
        </span>
      </div>
    </div>
  );
}
