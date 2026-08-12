"use client";

import React, { useState } from "react";
import {
  Filter,
  ArrowUpDown,
  MoreHorizontal,
  MessageSquare,
  Paperclip,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  Search,
  ExternalLink,
  UserCheck,
} from "lucide-react";
import { TicketItem, TicketPriority, TicketStatus } from "@/types/dashboard";

const INITIAL_TICKETS: TicketItem[] = [
  {
    id: "tkt_1",
    organization_id: "org_1",
    conversation_id: "conv_88392",
    subject: "Refund request for $500 - Order #88392 (VIP Customer)",
    customer_name: "Sarah Jenkins",
    customer_email: "sarah.j@enterprise.com",
    status: "OPEN",
    priority: "URGENT",
    assigned_to: "Unassigned",
    messages_count: 8,
    attachments_count: 2,
    sla_deadline: "1 hour left",
    ai_confidence: 12,
    created_at: "10 mins ago",
    updated_at: "10 mins ago",
  },
  {
    id: "tkt_2",
    organization_id: "org_1",
    conversation_id: "conv_88341",
    subject: "Custom webhook signature validation failing on staging server",
    customer_name: "Alex Rivera",
    customer_email: "alex@techcorp.io",
    status: "IN_PROGRESS",
    priority: "HIGH",
    assigned_to: "Partha Das",
    messages_count: 14,
    attachments_count: 4,
    sla_deadline: "3 hours left",
    ai_confidence: 45,
    created_at: "45 mins ago",
    updated_at: "12 mins ago",
  },
  {
    id: "tkt_3",
    organization_id: "org_1",
    conversation_id: "conv_88290",
    subject: "Knowledge Base DOCX ingestion timeout on 45MB document",
    customer_name: "David Kim",
    customer_email: "david.k@startup.co",
    status: "OPEN",
    priority: "MEDIUM",
    assigned_to: "Unassigned",
    messages_count: 5,
    attachments_count: 1,
    sla_deadline: "8 hours left",
    ai_confidence: 68,
    created_at: "2 hours ago",
    updated_at: "2 hours ago",
  },
  {
    id: "tkt_4",
    organization_id: "org_1",
    conversation_id: "conv_88112",
    subject: "International shipping rates inquiry to Tokyo, Japan",
    customer_name: "Kenji Sato",
    customer_email: "kenji@tokyo-retail.jp",
    status: "RESOLVED",
    priority: "LOW",
    assigned_to: "Auto-AI Deflected",
    messages_count: 4,
    attachments_count: 0,
    sla_deadline: "Completed",
    ai_confidence: 96,
    created_at: "Yesterday",
    updated_at: "Yesterday",
  },
];

export function TicketQueueTable({ onOpenNewTicket }: { onOpenNewTicket: () => void }) {
  const [tickets, setTickets] = useState<TicketItem[]>(INITIAL_TICKETS);
  const [filterPriority, setFilterPriority] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const filteredTickets = tickets.filter((t) => {
    const matchesPriority =
      filterPriority === "ALL" ||
      (filterPriority === "URGENT" && (t.priority === "URGENT" || t.priority === "HIGH")) ||
      (filterPriority === "OPEN" && t.status === "OPEN") ||
      (filterPriority === "IN_PROGRESS" && t.status === "IN_PROGRESS") ||
      (filterPriority === "RESOLVED" && t.status === "RESOLVED");

    const matchesSearch =
      !searchQuery ||
      t.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.customer_name?.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesPriority && matchesSearch;
  });

  const handleResolve = (ticketId: string) => {
    setTickets((prev) =>
      prev.map((t) => (t.id === ticketId ? { ...t, status: "RESOLVED", sla_deadline: "Completed", ai_confidence: 100 } : t))
    );
    setActiveMenuId(null);
  };

  const handleAssignToMe = (ticketId: string) => {
    setTickets((prev) =>
      prev.map((t) => (t.id === ticketId ? { ...t, assigned_to: "Partha Das (You)", status: "IN_PROGRESS" } : t))
    );
    setActiveMenuId(null);
  };

  return (
    <div className="w-full bg-white rounded-3xl border border-slate-200/80 shadow-2xs p-5 sm:p-6">
      {/* Table Header & Controls (matches inspiration filter controls) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
        <div>
          <h3 className="text-sm font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Priority Human Escalation Queue</span>
            <span className="text-[10px] bg-rose-100 text-rose-700 font-bold px-2 py-0.5 rounded-full">
              {tickets.filter((t) => t.status === "OPEN").length} Needs Attention
            </span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time conversations escalated from autonomous AI to human support staff.
          </p>
        </div>

        {/* Filter Buttons & + New Ticket */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-2xl border border-slate-200/70">
            {["ALL", "URGENT", "OPEN", "IN_PROGRESS", "RESOLVED"].map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setFilterPriority(filter)}
                className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  filterPriority === filter
                    ? "bg-white text-slate-900 shadow-2xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {filter === "ALL" ? "All" : filter.replace("_", " ")}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={onOpenNewTicket}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-fuchsia-600 hover:bg-fuchsia-700 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Ticket</span>
          </button>
        </div>
      </div>

      {/* Ticket Rows (matches the inspo project row format) */}
      <div className="divide-y divide-slate-100 mt-2">
        {filteredTickets.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            No tickets match your filter.
          </div>
        ) : (
          filteredTickets.map((ticket) => {
            const isUrgent = ticket.priority === "URGENT" || ticket.priority === "HIGH";

            return (
              <div
                key={ticket.id}
                className="py-3.5 px-2 hover:bg-slate-50/70 rounded-2xl transition flex flex-col md:flex-row md:items-center justify-between gap-3 group relative"
              >
                {/* Left: Title, Customer, Subtitle */}
                <div className="flex-1 min-w-0 pr-4">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 hover:text-fuchsia-600 transition cursor-pointer truncate">
                      {ticket.subject}
                    </h4>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                    <span className="text-slate-600 font-medium">{ticket.customer_name}</span>
                    <span>•</span>
                    <span className="text-slate-400">{ticket.customer_email}</span>
                    <span>•</span>
                    <span className="text-slate-400">{ticket.created_at}</span>
                  </div>
                </div>

                {/* Right: Badges, SLA Timer, Progress Bar, & Action Menu */}
                <div className="flex items-center gap-3 shrink-0 flex-wrap justify-between md:justify-end">
                  {/* Messages & Attachments Badges */}
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 bg-slate-50 border border-slate-200/60 px-2 py-1 rounded-xl">
                    <div className="flex items-center gap-1">
                      <Paperclip className="w-3 h-3 text-slate-400" />
                      <span>{ticket.attachments_count}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageSquare className="w-3 h-3 text-slate-400" />
                      <span>{ticket.messages_count}</span>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <span
                    className={`text-[10px] font-bold px-2 py-0.8 rounded-lg uppercase tracking-wider ${
                      ticket.status === "OPEN"
                        ? "bg-rose-50 text-rose-700 border border-rose-200/60"
                        : ticket.status === "IN_PROGRESS"
                        ? "bg-fuchsia-50 text-fuchsia-700 border border-fuchsia-200/60"
                        : "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                    }`}
                  >
                    {ticket.status.replace("_", " ")}
                  </span>

                  {/* Priority Badge */}
                  <span
                    className={`text-[10px] font-bold px-2 py-0.8 rounded-lg uppercase tracking-wider ${
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

                  {/* SLA Countdown Badge */}
                  <div className="flex items-center gap-1 text-[11px] text-slate-500 min-w-[70px]">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>{ticket.sla_deadline}</span>
                  </div>

                  {/* AI Attempt Progress Bar */}
                  <div className="flex items-center gap-2 min-w-[80px]">
                    <div className="w-12 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          ticket.status === "RESOLVED"
                            ? "bg-emerald-500"
                            : isUrgent
                            ? "bg-rose-500"
                            : "bg-fuchsia-500"
                        }`}
                        style={{ width: `${ticket.ai_confidence || 0}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 font-bold">
                      {ticket.ai_confidence || 0}%
                    </span>
                  </div>

                  {/* Action Menu (...) */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setActiveMenuId(activeMenuId === ticket.id ? null : ticket.id)}
                      className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 transition cursor-pointer"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>

                    {/* Context Action Menu */}
                    {activeMenuId === ticket.id && (
                      <div className="absolute right-0 mt-1 w-44 bg-white rounded-2xl border border-slate-200 shadow-xl p-1.5 z-40 animate-in fade-in zoom-in-95 duration-100">
                        <button
                          type="button"
                          onClick={() => handleAssignToMe(ticket.id)}
                          className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                        >
                          <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                          <span>Assign to me</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleResolve(ticket.id)}
                          className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs text-emerald-600 hover:bg-emerald-50 transition font-medium cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Mark Resolved</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
