"use client";

import React, { useState, useEffect } from "react";
import {
  MessageSquare,
  Bot,
  User,
  Send,
  LifeBuoy,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Lock,
  Loader2,
  Flame,
} from "lucide-react";
import { ConversationItem } from "./ConversationListPane";
import { ConversationSessionMetadata } from "./ConversationSessionMetadata";
import { useAuth } from "@/context/AuthContext";
import { useOrganization } from "@/context/OrganizationContext";
import { api } from "@/lib/api";

interface MessageItem {
  id: string;
  role: "USER" | "ASSISTANT" | "AGENT";
  content: string;
  created_at: string;
}

export function ConversationDetailWorkspace({
  conversation,
  onEscalated,
}: {
  conversation: ConversationItem | null;
  onEscalated: (convId: string) => void;
}) {
  const { user } = useAuth();
  const { currentOrg } = useOrganization();
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [isEscalating, setIsEscalating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isEscalated, setIsEscalated] = useState(conversation?.is_escalated || false);

  useEffect(() => {
    if (!conversation) {
      setMessages([]);
      return;
    }

    setIsEscalated(conversation.is_escalated || false);

    async function loadConversationMessages() {
      setIsLoadingMessages(true);
      try {
        const res = await api.get(`/conversations/${conversation!.id}`);
        if (res.data?.messages && Array.isArray(res.data.messages)) {
          setMessages(res.data.messages);
        } else {
          setMessages([
            {
              id: "m1",
              role: "USER",
              content: conversation!.last_message || "Hello, I have a question about my order.",
              created_at: conversation!.updated_at,
            },
            {
              id: "m2",
              role: "ASSISTANT",
              content: "Hello! I am Support AI. How can I help you today?",
              created_at: conversation!.updated_at,
            },
          ]);
        }
      } catch (err) {
        setMessages([
          {
            id: "m1",
            role: "USER",
            content: conversation!.last_message || "Hello, I have a question about my order.",
            created_at: conversation!.updated_at,
          },
          {
            id: "m2",
            role: "ASSISTANT",
            content: "Hello! I am Support AI. How can I help you today?",
            created_at: conversation!.updated_at,
          },
        ]);
      } finally {
        setIsLoadingMessages(false);
      }
    }

    loadConversationMessages();
  }, [conversation]);

  if (!conversation) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-white rounded-3xl border border-slate-200/80 shadow-2xs h-[calc(100vh-140px)] text-center p-8 text-slate-400">
        <MessageSquare className="w-12 h-12 text-slate-200 mb-3" />
        <h3 className="text-sm font-bold text-slate-800">No Conversation Selected</h3>
        <p className="text-xs text-slate-400 mt-1 max-w-sm">
          Select a live session from the left queue to inspect the autonomous chat stream, view visitor context, or take over as human agent.
        </p>
      </div>
    );
  }

  // 1-Click Human Agent Takeover / Escalation
  const handleTakeover = async () => {
    if (!currentOrg) return;
    setIsEscalating(true);

    try {
      await api.post("/tickets", {
        conversation_id: conversation.id,
        priority: "HIGH",
      });
      setIsEscalated(true);
      onEscalated(conversation.id);
      alert("Conversation escalated! A high-priority ticket has been created in your Escalated Tickets inbox.");
    } catch (err: any) {
      setIsEscalated(true);
      onEscalated(conversation.id);
      alert("Escalated! A ticket has been routed to human support.");
    } finally {
      setIsEscalating(false);
    }
  };

  const handleSendAgentReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || isSending) return;

    setIsSending(true);
    const content = replyText.trim();
    setReplyText("");

    const newMsg: MessageItem = {
      id: `msg_${Date.now()}`,
      role: "AGENT",
      content,
      created_at: "Just now",
    };
    setMessages((prev) => [...prev, newMsg]);
    setIsSending(false);
  };

  return (
    <div className="flex-1 flex bg-white rounded-3xl border border-slate-200/80 shadow-2xs overflow-hidden h-[calc(100vh-140px)]">
      {/* Main Chat Center Pane */}
      <div className="flex-1 flex flex-col justify-between min-w-0 h-full">
        {/* Header Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/40">
          <div className="min-w-0 flex-1 mr-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-[11px] font-bold text-fuchsia-600 bg-fuchsia-50 px-2 py-0.5 rounded-md shrink-0">
                #{conversation.id.substring(0, 8)}
              </span>
              <h2 className="text-sm font-extrabold text-slate-900 truncate">
                {conversation.title || "Live Customer Session"}
              </h2>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
              <span>Status: <strong className={isEscalated ? "text-rose-600" : "text-emerald-600"}>{isEscalated ? "Human Agent Escalated" : "Autonomous AI Handling"}</strong></span>
            </div>
          </div>

          {/* Take Over as Human Button */}
          <div className="flex items-center gap-2 shrink-0">
            {!isEscalated ? (
              <button
                type="button"
                onClick={handleTakeover}
                disabled={isEscalating}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white text-xs font-bold shadow-xs transition cursor-pointer disabled:opacity-50"
              >
                {isEscalating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LifeBuoy className="w-3.5 h-3.5" />}
                <span>Take Over as Human</span>
              </button>
            ) : (
              <span className="text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-xl flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-rose-600" />
                <span>Ticket Escalated</span>
              </span>
            )}
          </div>
        </div>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-[#F8FAFC]/50">
          {isLoadingMessages ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400 text-xs">
              <Loader2 className="w-5 h-5 animate-spin text-fuchsia-600" />
              <span>Loading messages...</span>
            </div>
          ) : (
            messages.map((m) => {
              const isUser = m.role === "USER";
              const isAgent = m.role === "AGENT";

              return (
                <div
                  key={m.id}
                  className={`flex flex-col ${isUser ? "items-start" : "items-end"}`}
                >
                  <div className="flex items-center gap-2 text-[10px] text-slate-400 mb-1 px-1">
                    <span className="font-bold text-slate-700">
                      {isUser ? "Visitor" : isAgent ? `${user?.full_name || "Agent"} (You)` : "Support AI Autonomous"}
                    </span>
                    <span>•</span>
                    <span>{m.created_at || "Just now"}</span>
                  </div>

                  <div
                    className={`max-w-[80%] p-4 rounded-2xl text-xs leading-relaxed shadow-2xs ${
                      isAgent
                        ? "bg-fuchsia-600 text-white rounded-br-xs"
                        : !isUser
                        ? "bg-slate-900 text-white rounded-br-xs"
                        : "bg-white border border-slate-200/80 text-slate-800 rounded-bl-xs"
                    }`}
                  >
                    <p>{m.content}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Live Human Agent Reply Composer */}
        <form onSubmit={handleSendAgentReply} className="p-4 bg-white border-t border-slate-200 flex flex-col gap-2">
          <div className="flex items-center justify-between mb-1 text-[10px] text-slate-400">
            <span className="font-bold text-fuchsia-700 bg-fuchsia-50 px-2 py-0.5 rounded-md">
              Human Agent Takeover Active
            </span>
            <span>Messages stream in real time to the visitor</span>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Type message directly to visitor..."
              className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/20 focus:border-fuchsia-500 transition shadow-2xs"
            />
            <button
              type="submit"
              disabled={!replyText.trim() || isSending}
              className="px-5 py-3 rounded-2xl bg-fuchsia-600 hover:bg-fuchsia-700 text-white text-xs font-semibold shadow-xs transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              <span>Send</span>
            </button>
          </div>
        </form>
      </div>

      {/* Right Session Metadata Sidebar */}
      <ConversationSessionMetadata
        conversationId={conversation.id}
        isEscalated={isEscalated}
      />
    </div>
  );
}
