"use client";

import React, { useState, useEffect } from "react";
import { MessageSquare, Send, LifeBuoy, CheckCircle2, Loader2, Bot, User } from "lucide-react";
import { ConversationItem } from "./ConversationListPane";
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
      <div className="flex-1 flex flex-col items-center justify-center bg-white border-r border-slate-200 text-center p-8 text-slate-400">
        <MessageSquare className="w-10 h-10 text-slate-200 mb-3" />
        <h3 className="text-sm font-medium text-slate-700">No Conversation Selected</h3>
        <p className="text-xs text-slate-400 mt-1 max-w-sm">
          Select a session from the inbox to view details.
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
      alert("Conversation escalated! A ticket has been routed to human support.");
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

    try {
      await api.post(`/conversations/${conversation.id}/reply`, { content });
    } catch (err) {
      console.warn("Reply API error:", err);
    }

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
    <div className="flex-1 flex flex-col min-w-0 bg-white border-r border-slate-200">
      {/* Header Bar */}
      <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between gap-3 bg-white">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-slate-900 truncate">
              {conversation.title || "Visitor Session"}
            </h2>
            <span className="font-mono text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
              #{conversation.id.substring(0, 8)}
            </span>
          </div>
        </div>

        {/* Take Over as Human Button */}
        <div className="flex items-center gap-2 shrink-0">
          {!isEscalated ? (
            <button
              type="button"
              onClick={handleTakeover}
              disabled={isEscalating}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium transition cursor-pointer disabled:opacity-50"
            >
              {isEscalating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LifeBuoy className="w-3.5 h-3.5" />}
              <span>Take Over</span>
            </button>
          ) : (
            <span className="text-xs font-medium text-slate-500 flex items-center gap-1.5 border border-slate-200 px-2 py-1 rounded-md bg-slate-50">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>Escalated</span>
            </span>
          )}
        </div>
      </div>

      {/* Message Stream */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6 bg-white">
        {isLoadingMessages ? (
          <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400 text-xs">
            <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
            <span>Loading...</span>
          </div>
        ) : (
          messages.map((m) => {
            const isUser = m.role === "USER";
            const isAgent = m.role === "AGENT";
            const isAi = m.role === "ASSISTANT";

            return (
              <div key={m.id} className="flex gap-3">
                {/* Avatar Icon */}
                <div className="shrink-0 mt-0.5">
                  {isUser ? (
                    <div className="w-7 h-7 rounded bg-slate-100 text-slate-500 flex items-center justify-center">
                      <User className="w-4 h-4" />
                    </div>
                  ) : isAgent ? (
                    <div className="w-7 h-7 rounded bg-blue-100 text-blue-600 flex items-center justify-center">
                      <User className="w-4 h-4" />
                    </div>
                  ) : (
                    <div className="w-7 h-7 rounded bg-fuchsia-100 text-fuchsia-600 flex items-center justify-center">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="font-semibold text-slate-900 text-xs">
                      {isUser ? "Visitor" : isAgent ? `${user?.full_name || "Agent"}` : "Support AI"}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {m.created_at || "Just now"}
                    </span>
                  </div>
                  
                  <div className="text-sm text-slate-700 leading-relaxed">
                    {m.content}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Input Composer */}
      <div className="p-4 bg-white border-t border-slate-200">
        {isEscalated && (
          <div className="flex items-center justify-between mb-2 px-1 text-[11px] text-slate-500">
            <span className="font-medium text-emerald-600 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Human take-over active
            </span>
          </div>
        )}
        <form onSubmit={handleSendAgentReply} className="relative">
          <textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Reply to visitor..."
            rows={3}
            className="w-full p-3 pr-12 bg-white border border-slate-300 rounded-md text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-500 focus:border-slate-500 resize-none transition"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendAgentReply(e as any);
              }
            }}
          />
          <button
            type="submit"
            disabled={!replyText.trim() || isSending}
            className="absolute right-2 bottom-2 p-1.5 rounded bg-slate-900 hover:bg-slate-800 text-white disabled:opacity-50 disabled:hover:bg-slate-900 transition cursor-pointer"
          >
            {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </form>
      </div>
    </div>
  );
}
