"use client";

import React, { useState, useEffect } from "react";
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
import { api } from "@/lib/api";

interface ChatMessage {
  id: string;
  sender: "customer" | "ai" | "agent";
  senderName: string;
  text: string;
  timestamp: string;
  isEscalationTrigger?: boolean;
}

export function TicketDetailWorkspace({
  ticket,
  onStatusChange,
  onPriorityChange,
}: {
  ticket: TicketItem | null;
  onStatusChange: (status: TicketStatus) => void;
  onPriorityChange: (priority: TicketPriority) => void;
}) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"transcript" | "notes" | "events">("transcript");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [replyText, setReplyText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [isPriorityDropdownOpen, setIsPriorityDropdownOpen] = useState(false);

  // Load conversation transcript when ticket changes
  useEffect(() => {
    if (!ticket) {
      setMessages([]);
      return;
    }

    async function loadTranscript() {
      try {
        if (ticket?.conversation_id) {
          const res = await api.get(`/conversations/${ticket.conversation_id}/messages`);
          if (Array.isArray(res.data) && res.data.length > 0) {
            const mapped: ChatMessage[] = res.data.map((m: any) => ({
              id: m.id,
              sender: m.sender === "USER" ? "customer" : m.sender === "ASSISTANT" ? "ai" : "agent",
              senderName: m.sender === "USER" ? (ticket.customer_name || "Customer") : m.sender === "ASSISTANT" ? "Support AI" : "Support Agent",
              text: m.content,
              timestamp: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              isEscalationTrigger: m.content?.toLowerCase().includes("refund") || m.content?.toLowerCase().includes("escalate"),
            }));
            setMessages(mapped);
            return;
          }
        }
      } catch (err) {
        // Fallback default message
      }

      setMessages([
        {
          id: "msg_1",
          sender: "customer",
          senderName: ticket?.customer_name || "Customer",
          text: ticket?.subject || "Customer initiated support chat.",
          timestamp: "Recently",
        },
        {
          id: "msg_2",
          sender: "ai",
          senderName: "Support AI",
          text: "I have escalated this conversation to our senior human support specialists. A team member will assist you shortly.",
          timestamp: "Recently",
          isEscalationTrigger: true,
        },
      ]);
    }

    loadTranscript();
  }, [ticket]);

  if (!ticket) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-white rounded-3xl border border-slate-200/80 shadow-2xs h-[calc(100vh-140px)] text-center p-8 text-slate-400">
        <MessageSquare className="w-12 h-12 text-slate-200 mb-3" />
        <h3 className="text-sm font-bold text-slate-800">No Ticket Selected</h3>
        <p className="text-xs text-slate-400 mt-1 max-w-sm">
          Select a ticket from the left queue to view the conversation transcript, write internal notes, and reply.
        </p>
      </div>
    );
  }

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || isSending) return;

    setIsSending(true);
    const content = replyText.trim();
    setReplyText("");

    try {
      await api.post(`/tickets/${ticket.id}/reply`, { content });
    } catch (err) {
      console.warn("Reply sent locally:", err);
    }

    const newMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      sender: "agent",
      senderName: `${user?.full_name || "Human Agent"} (You)`,
      text: content,
      timestamp: "Just now",
    };
    setMessages((prev) => [...prev, newMsg]);
    setIsSending(false);

    if (ticket.status === "OPEN") {
      onStatusChange("IN_PROGRESS");
    }
  };

  const handleStatusSelect = async (st: TicketStatus) => {
    onStatusChange(st);
    setIsStatusDropdownOpen(false);
    try {
      await api.patch(`/tickets/${ticket.id}/status`, { status: st });
    } catch (e) {
      console.warn("Status update error", e);
    }
  };

  const handlePrioritySelect = async (pr: TicketPriority) => {
    onPriorityChange(pr);
    setIsPriorityDropdownOpen(false);
    try {
      await api.patch(`/tickets/${ticket.id}/priority`, { priority: pr });
    } catch (e) {
      console.warn("Priority update error", e);
    }
  };

  return (
    <div className="flex-1 flex bg-white rounded-3xl border border-slate-200/80 shadow-2xs overflow-hidden h-[calc(100vh-140px)]">
      {/* Main Center Workspace */}
      <div className="flex-1 flex flex-col justify-between min-w-0 h-full">
        {/* Clean Header Bar with No Overlap */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/40">
          <div className="min-w-0 flex-1 mr-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-[11px] font-bold text-fuchsia-600 bg-fuchsia-50 px-2 py-0.5 rounded-md shrink-0">
                #{ticket.id.substring(0, 8)}
              </span>
              <h2 className="text-sm font-extrabold text-slate-900 truncate">
                {ticket.subject}
              </h2>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400 mt-1 flex-wrap">
              <span>Customer: <strong className="text-slate-700">{ticket.customer_name || "Customer"}</strong></span>
              <span>•</span>
              <span>SLA: <strong className="text-rose-600">{ticket.sla_deadline || "4 hrs left"}</strong></span>
            </div>
          </div>

          {/* Clean Controls (Status Dropdown + Priority Dropdown) */}
          <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
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
                      onClick={() => handleStatusSelect(st)}
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
                      onClick={() => handlePrioritySelect(pr)}
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

        {/* Tab Navigation */}
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
                  <div className="font-bold text-slate-900">Ticket Created in Workspace</div>
                  <div className="text-slate-500 text-[11px]">Subject: {ticket.subject}</div>
                  <span className="text-[10px] text-slate-400">{ticket.created_at}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Human Agent Reply Composer */}
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
                placeholder={`Type response to ${ticket.customer_name || "customer"}...`}
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

      {/* Customer Context Sidebar */}
      <CustomerContextSidebar ticket={ticket} />
    </div>
  );
}
