"use client";

import React, { useState } from "react";
import {
  Send,
  Bot,
  User,
  AlertCircle,
  Clock,
  CheckCircle2,
  Lock,
  History,
  MessageSquare,
  Sparkles,
  Paperclip,
  Check,
  ChevronDown,
  Loader2,
} from "lucide-react";
import { TicketItem, TicketPriority, TicketStatus } from "@/types/dashboard";
import { InternalNotesSection } from "./InternalNotesSection";
import { CustomerContextSidebar } from "./CustomerContextSidebar";
import { useAuth } from "@/context/AuthContext";

interface ChatMessage {
  id: string;
  sender: "customer" | "ai" | "agent";
  senderName: string;
  text: string;
  timestamp: string;
  isEscalationTrigger?: boolean;
}

const SAMPLE_CONVERSATION: ChatMessage[] = [
  {
    id: "msg_1",
    sender: "customer",
    senderName: "Sarah Jenkins",
    text: "Hi, I ordered 50 enterprise units last Tuesday under invoice #88392. 10 of the items arrived damaged during shipping.",
    timestamp: "10:15 AM",
  },
  {
    id: "msg_2",
    sender: "ai",
    senderName: "Support AI",
    text: "I am very sorry to hear about the damaged items! Under our Global Shipping & Warranty Policy, any items damaged during transit are eligible for expedited replacement or a direct refund.",
    timestamp: "10:15 AM",
  },
  {
    id: "msg_3",
    sender: "customer",
    senderName: "Sarah Jenkins",
    text: "I cannot wait for replacements because our event is tomorrow. I want an immediate refund of $500 for the damaged units. Please escalate this now.",
    timestamp: "10:17 AM",
  },
  {
    id: "msg_4",
    sender: "ai",
    senderName: "Support AI",
    text: "I understand the urgency regarding your tomorrow event. Because the refund request ($500.00) exceeds standard automated limits, I have escalated this conversation directly to our senior human support specialists. Ticket #88392 has been generated and an agent will assist you immediately.",
    timestamp: "10:17 AM",
    isEscalationTrigger: true,
  },
];

export function TicketDetailWorkspace({
  ticket,
  onStatusChange,
  onPriorityChange,
}: {
  ticket: TicketItem;
  onStatusChange: (status: TicketStatus) => void;
  onPriorityChange: (priority: TicketPriority) => void;
}) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"transcript" | "notes" | "events">("transcript");
  const [messages, setMessages] = useState<ChatMessage[]>(SAMPLE_CONVERSATION);
  const [replyText, setReplyText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [isPriorityDropdownOpen, setIsPriorityDropdownOpen] = useState(false);

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || isSending) return;

    setIsSending(true);
    setTimeout(() => {
      const newMsg: ChatMessage = {
        id: `msg_${Date.now()}`,
        sender: "agent",
        senderName: `${user?.full_name || "Human Agent"} (You)`,
        text: replyText.trim(),
        timestamp: "Just now",
      };
      setMessages((prev) => [...prev, newMsg]);
      setReplyText("");
      setIsSending(false);

      // Auto set status to IN_PROGRESS if OPEN
      if (ticket.status === "OPEN") {
        onStatusChange("IN_PROGRESS");
      }
    }, 400);
  };

  return (
    <div className="flex-1 flex bg-white rounded-3xl border border-slate-200/80 shadow-2xs overflow-hidden h-[calc(100vh-140px)]">
      {/* Main Center Area */}
      <div className="flex-1 flex flex-col justify-between min-w-0 h-full">
        {/* Workspace Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/40">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-fuchsia-600 bg-fuchsia-50 px-2 py-0.5 rounded-md">
                #{ticket.id}
              </span>
              <h2 className="text-sm font-extrabold text-slate-900 truncate">
                {ticket.subject}
              </h2>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
              <span>Customer: <strong className="text-slate-700">{ticket.customer_name}</strong></span>
              <span>•</span>
              <span>SLA: <strong className="text-rose-600">{ticket.sla_deadline}</strong></span>
            </div>
          </div>

          {/* Quick Status & Priority Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Status Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-800 shadow-2xs hover:bg-slate-50 transition cursor-pointer"
              >
                <span>Status:</span>
                <span
                  className={
                    ticket.status === "OPEN"
                      ? "text-rose-600"
                      : ticket.status === "IN_PROGRESS"
                      ? "text-fuchsia-600"
                      : "text-emerald-600"
                  }
                >
                  {ticket.status.replace("_", " ")}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {isStatusDropdownOpen && (
                <div className="absolute right-0 mt-1 w-36 bg-white rounded-2xl border border-slate-200 shadow-xl p-1.5 z-50">
                  {(["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"] as TicketStatus[]).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => {
                        onStatusChange(st);
                        setIsStatusDropdownOpen(false);
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded-xl text-xs font-semibold hover:bg-slate-50 transition flex items-center justify-between cursor-pointer"
                    >
                      <span>{st.replace("_", " ")}</span>
                      {ticket.status === st && <Check className="w-3.5 h-3.5 text-fuchsia-600" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Priority Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsPriorityDropdownOpen(!isPriorityDropdownOpen)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold shadow-2xs transition flex items-center gap-1 cursor-pointer ${
                  ticket.priority === "URGENT"
                    ? "bg-rose-600 text-white"
                    : ticket.priority === "HIGH"
                    ? "bg-rose-100 text-rose-700"
                    : "bg-slate-100 text-slate-700"
                }`}
              >
                <span>{ticket.priority}</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>

              {isPriorityDropdownOpen && (
                <div className="absolute right-0 mt-1 w-32 bg-white rounded-2xl border border-slate-200 shadow-xl p-1.5 z-50">
                  {(["LOW", "MEDIUM", "HIGH", "URGENT"] as TicketPriority[]).map((pr) => (
                    <button
                      key={pr}
                      type="button"
                      onClick={() => {
                        onPriorityChange(pr);
                        setIsPriorityDropdownOpen(false);
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded-xl text-xs font-semibold hover:bg-slate-50 transition flex items-center justify-between cursor-pointer"
                    >
                      <span>{pr}</span>
                      {ticket.priority === pr && <Check className="w-3.5 h-3.5 text-fuchsia-600" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Workspace Tab Bar */}
        <div className="px-5 border-b border-slate-100 flex items-center gap-6 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab("transcript")}
            className={`py-3 border-b-2 transition cursor-pointer flex items-center gap-2 ${
              activeTab === "transcript"
                ? "border-fuchsia-600 text-fuchsia-600"
                : "border-transparent text-slate-400 hover:text-slate-700"
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Customer Transcript ({messages.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("notes")}
            className={`py-3 border-b-2 transition cursor-pointer flex items-center gap-2 ${
              activeTab === "notes"
                ? "border-fuchsia-600 text-fuchsia-600"
                : "border-transparent text-slate-400 hover:text-slate-700"
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Internal Notes</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("events")}
            className={`py-3 border-b-2 transition cursor-pointer flex items-center gap-2 ${
              activeTab === "events"
                ? "border-fuchsia-600 text-fuchsia-600"
                : "border-transparent text-slate-400 hover:text-slate-700"
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Audit Timeline</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-[#F8FAFC]/50">
          {activeTab === "transcript" && (
            <div className="space-y-4">
              {messages.map((m) => {
                const isCustomer = m.sender === "customer";
                const isAgent = m.sender === "agent";

                return (
                  <div
                    key={m.id}
                    className={`flex flex-col ${isAgent ? "items-end" : "items-start"}`}
                  >
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 mb-1 px-1">
                      <span className="font-bold text-slate-700">{m.senderName}</span>
                      <span>•</span>
                      <span>{m.timestamp}</span>
                    </div>

                    <div
                      className={`max-w-[80%] p-4 rounded-2xl text-xs leading-relaxed shadow-2xs ${
                        isAgent
                          ? "bg-fuchsia-600 text-white rounded-br-xs"
                          : isCustomer
                          ? "bg-white border border-slate-200/80 text-slate-800 rounded-bl-xs"
                          : m.isEscalationTrigger
                          ? "bg-rose-50 border-2 border-rose-200 text-rose-900 rounded-bl-xs"
                          : "bg-slate-100 border border-slate-200 text-slate-700 rounded-bl-xs"
                      }`}
                    >
                      {m.isEscalationTrigger && (
                        <div className="flex items-center gap-1.5 text-[10px] font-extrabold text-rose-700 mb-1.5 pb-1 border-b border-rose-200">
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span>AUTO-ESCALATION TRIGGER POINT</span>
                        </div>
                      )}
                      <p>{m.text}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === "notes" && <InternalNotesSection ticketId={ticket.id} />}

          {activeTab === "events" && (
            <div className="space-y-3 p-2">
              <div className="flex items-start gap-3 text-xs">
                <div className="w-2 h-2 rounded-full bg-rose-500 mt-1.5" />
                <div>
                  <div className="font-bold text-slate-900">Conversation Auto-Escalated</div>
                  <div className="text-slate-500 text-[11px]">Reason: Refund amount &gt; $50 threshold</div>
                  <span className="text-[10px] text-slate-400">10 mins ago</span>
                </div>
              </div>
              <div className="flex items-start gap-3 text-xs">
                <div className="w-2 h-2 rounded-full bg-fuchsia-500 mt-1.5" />
                <div>
                  <div className="font-bold text-slate-900">Priority Assigned to URGENT</div>
                  <div className="text-slate-500 text-[11px]">System rule: VIP invoice match</div>
                  <span className="text-[10px] text-slate-400">10 mins ago</span>
                </div>
              </div>
              <div className="flex items-start gap-3 text-xs">
                <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5" />
                <div>
                  <div className="font-bold text-slate-900">Human Agent Opened Ticket</div>
                  <div className="text-slate-500 text-[11px]">Partha Das viewing workspace</div>
                  <span className="text-[10px] text-slate-400">2 mins ago</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Human Agent Reply Composer (Calls POST /api/v1/tickets/{id}/reply) */}
        {activeTab === "transcript" && (
          <form onSubmit={handleSendReply} className="p-4 bg-white border-t border-slate-200 flex flex-col gap-2">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold text-fuchsia-700 bg-fuchsia-50 px-2 py-0.5 rounded-md">
                Replying as Human Agent
              </span>
              <span className="text-[10px] text-slate-400">Message will stream live to customer</span>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Type your response to Sarah Jenkins..."
                className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/20 focus:border-fuchsia-500 transition shadow-2xs"
              />
              <button
                type="submit"
                disabled={!replyText.trim() || isSending}
                className="px-5 py-3 rounded-2xl bg-fuchsia-600 hover:bg-fuchsia-700 text-white text-xs font-semibold shadow-xs transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                <span>Send Reply</span>
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Collapsible Customer Profile & RAG Citations Sidebar */}
      <CustomerContextSidebar ticket={ticket} />
    </div>
  );
}
