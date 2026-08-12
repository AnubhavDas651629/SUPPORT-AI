"use client";

import React, { useState } from "react";
import { X, Send, Sparkles, Bot, AlertCircle, CheckCircle2, RotateCcw, Loader2 } from "lucide-react";
import { useOrganization } from "@/context/OrganizationContext";
import { api } from "@/lib/api";

interface Message {
  sender: "ai" | "user";
  text: string;
  isEscalated?: boolean;
}

export function LiveAiTestDrawer({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { currentOrg } = useOrganization();
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: "ai",
      text: "Hi there! I am your Support AI Assistant powered by RAG and pgvector. How can I help you today?",
    },
  ]);
  const [inputVal, setInputVal] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);

  if (!isOpen) return null;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim() || isStreaming) return;

    const userText = inputVal.trim();
    setInputVal("");
    setMessages((prev) => [...prev, { sender: "user", text: userText }]);
    setIsStreaming(true);

    // Simulate RAG & Escalation check
    const isEscalationPrompt =
      userText.toLowerCase().includes("refund") ||
      userText.toLowerCase().includes("escalate") ||
      userText.toLowerCase().includes("human") ||
      userText.toLowerCase().includes("urgent");

    setTimeout(() => {
      if (isEscalationPrompt) {
        setMessages((prev) => [
          ...prev,
          {
            sender: "ai",
            text: "I understand you need immediate assistance regarding this request. I have automatically escalated this conversation to our senior human support team and generated Ticket #88392. A human specialist will assist you shortly.",
            isEscalated: true,
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            sender: "ai",
            text: `Based on your uploaded knowledge base (Shipping & Policies), standard ground delivery takes 3 to 5 business days across North America. Expedited express orders arrive within 24–48 hours. Let me know if you need help tracking a specific package!`,
          },
        ]);
      }
      setIsStreaming(false);
    }, 900);
  };

  const handleReset = () => {
    setMessages([
      {
        sender: "ai",
        text: "Hi there! I am your Support AI Assistant powered by RAG and pgvector. How can I help you today?",
      },
    ]);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/30 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between border-l border-slate-200 animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-fuchsia-600 to-indigo-600 text-white flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center font-bold text-xs">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold leading-tight">Live AI Assistant Simulator</h3>
              <p className="text-[10px] text-fuchsia-100 mt-0.5">• Active Knowledge Base Connected</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleReset}
              title="Reset conversation"
              className="p-1.5 rounded-lg hover:bg-white/20 text-white transition cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-white/20 text-white transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#F8FAFC]">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex flex-col ${m.sender === "user" ? "items-end" : "items-start"}`}
            >
              <div
                className={`max-w-[85%] p-3 rounded-2xl text-xs leading-relaxed shadow-2xs ${
                  m.sender === "user"
                    ? "bg-fuchsia-600 text-white rounded-br-xs"
                    : m.isEscalated
                    ? "bg-rose-50 border border-rose-200 text-rose-800 rounded-bl-xs"
                    : "bg-white border border-slate-200/80 text-slate-800 rounded-bl-xs"
                }`}
              >
                {m.isEscalated && (
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-rose-600 mb-1">
                    <AlertCircle className="w-3 h-3" />
                    <span>HUMAN ESCALATION TRIGGERED</span>
                  </div>
                )}
                <span>{m.text}</span>
              </div>
            </div>
          ))}

          {isStreaming && (
            <div className="flex items-center gap-2 text-xs text-slate-400 p-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-fuchsia-600" />
              <span>AI is generating response from pgvector...</span>
            </div>
          )}
        </div>

        {/* Suggestion Prompts */}
        <div className="px-4 py-2 bg-white border-t border-slate-100 flex items-center gap-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => setInputVal("How many days does shipping take?")}
            className="text-[10px] px-2.5 py-1 rounded-full bg-slate-100 hover:bg-fuchsia-50 hover:text-fuchsia-600 text-slate-600 shrink-0 transition"
          >
            "How does shipping work?"
          </button>
          <button
            type="button"
            onClick={() => setInputVal("I want a refund for $500")}
            className="text-[10px] px-2.5 py-1 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold shrink-0 transition"
          >
            "Refund $500 (Escalate)"
          </button>
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSend} className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder="Type a message to test AI..."
            className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/20 focus:border-fuchsia-500 transition"
          />
          <button
            type="submit"
            disabled={!inputVal.trim() || isStreaming}
            className="p-2.5 rounded-xl bg-fuchsia-600 hover:bg-fuchsia-700 text-white transition disabled:opacity-50 cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
}
