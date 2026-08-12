"use client";

import React, { useState, useEffect } from "react";
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
  LifeBuoy,
  Loader2,
} from "lucide-react";
import { TicketItem, TicketPriority, TicketStatus } from "@/types/dashboard";
import { useOrganization } from "@/context/OrganizationContext";
import { api } from "@/lib/api";

export function TicketQueueTable({
  onOpenNewTicket,
  onOpenTicketsView,
}: {
  onOpenNewTicket: () => void;
  onOpenTicketsView?: () => void;
}) {
  const { currentOrg } = useOrganization();
  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterPriority, setFilterPriority] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const loadTickets = async () => {
    if (!currentOrg) return;
    setIsLoading(true);
    try {
      const res = await api.get(`/tickets?organization_id=${currentOrg.id}`);
      const items = res.data?.items || [];
      if (Array.isArray(items)) {
        const mapped: TicketItem[] = items.map((t: any) => ({
          id: t.id,
          organization_id: t.organization_id,
          conversation_id: t.conversation_id,
          subject: t.subject || "Customer Support Escalation",
          customer_name: "Customer",
          customer_email: "customer@example.com",
          status: t.status,
          priority: t.priority,
          assigned_to: t.assigned_to_user_id ? "Assigned" : "Unassigned",
          messages_count: 2,
          attachments_count: 0,
          sla_deadline: "4 hours left",
          ai_confidence: t.created_by_ai ? 100 : 0,
          created_at: new Date(t.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          updated_at: new Date(t.updated_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        }));
        setTickets(mapped);
      } else {
        setTickets([]);
      }
    } catch (err) {
      console.warn("Could not load tickets:", err);
      setTickets([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, [currentOrg]);

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

  const handleResolve = async (ticketId: string) => {
    try {
      await api.patch(`/tickets/${ticketId}/status`, { status: "RESOLVED" });
      setTickets((prev) =>
        prev.map((t) => (t.id === ticketId ? { ...t, status: "RESOLVED", sla_deadline: "Completed" } : t))
      );
    } catch (err) {
      console.warn("Error resolving ticket", err);
    }
    setActiveMenuId(null);
  };

  const handleAssignToMe = async (ticketId: string) => {
    setTickets((prev) =>
      prev.map((t) => (t.id === ticketId ? { ...t, assigned_to: "You", status: "IN_PROGRESS" } : t))
    );
    setActiveMenuId(null);
  };

  return (
    <div className="w-full bg-white rounded-3xl border border-slate-200/80 shadow-2xs p-5 sm:p-6">
      {/* Table Header & Controls */}
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

      {/* Ticket Rows */}
      <div className="divide-y divide-slate-100 mt-2">
        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400 text-xs">
            <Loader2 className="w-5 h-5 animate-spin text-fuchsia-600" />
            <span>Loading escalation queue...</span>
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">
            <LifeBuoy className="w-8 h-8 text-slate-200 mx-auto mb-2" />
            <p className="font-bold text-slate-700">No active escalation tickets</p>
            <p className="mt-0.5">When customers request human assistance or refunds, tickets will stream here automatically.</p>
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
                    <h4
                      onClick={onOpenTicketsView}
                      className="text-xs sm:text-sm font-bold text-slate-900 hover:text-fuchsia-600 transition cursor-pointer truncate"
                    >
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
