"use client";

import React, { useState } from "react";
import { MessageSquare, X, Send, Bot, Sparkles, RotateCcw, Check, ExternalLink } from "lucide-react";

interface LiveWidgetSimulatorProps {
  widgetTitle: string;
  welcomeMessage: string;
  primaryColor: string;
  placement: "bottom-right" | "bottom-left";
  starterPrompts: string[];
}

export function LiveWidgetSimulator({
  widgetTitle,
  welcomeMessage,
  primaryColor,
  placement,
  starterPrompts,
}: LiveWidgetSimulatorProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [messages, setMessages] = useState<Array<{ sender: "ai" | "user"; text: string }>>([
    {
      sender: "ai",
      text: welcomeMessage || "Hi there! How can we help you today?",
    },
  ]);
  const [inputVal, setInputVal] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const handleSend = (textToSend?: string) => {
    const text = textToSend || inputVal;
    if (!text.trim() || isTyping) return;

    setInputVal("");
    setMessages((prev) => [...prev, { sender: "user", text }]);
    setIsTyping(true);

    setTimeout(() => {
      let reply = `Thanks for asking! Based on our documentation, standard delivery takes 3 to 5 business days. Let me know if you need anything else!`;
      if (text.toLowerCase().includes("refund") || text.toLowerCase().includes("human")) {
        reply = "I understand you need immediate assistance. I have flagged this conversation for human agent takeover. A specialist will assist you shortly.";
      }
      setMessages((prev) => [...prev, { sender: "ai", text: reply }]);
      setIsTyping(false);
    }, 700);
  };

  const handleReset = () => {
    setMessages([
      {
        sender: "ai",
        text: welcomeMessage || "Hi there! How can we help you today?",
      },
    ]);
  };

  return (
    <div className="w-full bg-slate-900 rounded-3xl p-3 sm:p-4 shadow-xl border border-slate-800 flex flex-col h-[660px]">
      {/* Mock Browser Top Header Bar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800 text-xs text-slate-400 select-none">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
          <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
        </div>

        <div className="flex items-center gap-1.5 px-4 py-1 bg-slate-800/80 rounded-xl text-[11px] font-mono text-slate-300">
          <span>https://your-company.com</span>
        </div>

        <div className="text-[10px] text-fuchsia-400 font-semibold uppercase tracking-wider flex items-center gap-1">
          <Sparkles className="w-3 h-3" />
          <span>Live Preview</span>
        </div>
      </div>

      {/* Simulated Webpage Body Canvas */}
      <div className="flex-1 bg-white rounded-2xl m-1 relative overflow-hidden flex flex-col justify-between p-6 select-none">
        {/* Mock Webpage Content */}
        <div className="space-y-4 max-w-sm opacity-60 pointer-events-none">
          <div className="h-4 w-32 bg-slate-200 rounded-md" />
          <div className="h-8 w-64 bg-slate-200 rounded-lg" />
          <div className="space-y-2">
            <div className="h-3 w-full bg-slate-100 rounded-md" />
            <div className="h-3 w-5/6 bg-slate-100 rounded-md" />
            <div className="h-3 w-4/6 bg-slate-100 rounded-md" />
          </div>
          <div className="flex gap-2 pt-2">
            <div className="h-8 w-24 bg-slate-200 rounded-xl" />
            <div className="h-8 w-24 bg-slate-100 rounded-xl" />
          </div>
        </div>

        {/* Floating Chat Bubble or Expanded Widget Card */}
        <div
          className={`absolute bottom-5 transition-all duration-300 z-30 ${
            placement === "bottom-right" ? "right-5" : "left-5"
          }`}
        >
          {isOpen ? (
            /* Expanded Chat Window */
            <div className="w-80 sm:w-88 bg-white rounded-3xl shadow-2xl border border-slate-200/90 overflow-hidden flex flex-col h-[460px] animate-in zoom-in-95 duration-200">
              {/* Widget Brand Header */}
              <div
                style={{ backgroundColor: primaryColor }}
                className="p-4 text-white flex items-center justify-between shadow-xs transition-colors duration-300"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-bold text-xs">
                    {widgetTitle ? widgetTitle.charAt(0).toUpperCase() : "A"}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold leading-none truncate max-w-[160px]">
                      {widgetTitle || "Support Assistant"}
                    </h4>
                    <div className="text-[10px] opacity-85 mt-1 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span>Instant AI Response</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={handleReset}
                    title="Reset chat"
                    className="p-1.5 rounded-lg hover:bg-white/20 transition cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="p-1.5 rounded-lg hover:bg-white/20 transition cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Chat Message Stream */}
              <div className="flex-1 overflow-y-auto p-3.5 space-y-2.5 bg-[#F8FAFC]">
                {messages.map((m, i) => (
                  <div
                    key={i}
                    className={`flex flex-col ${m.sender === "user" ? "items-end" : "items-start"}`}
                  >
                    <div
                      style={{
                        backgroundColor: m.sender === "user" ? primaryColor : undefined,
                      }}
                      className={`max-w-[85%] p-3 rounded-2xl text-[11px] leading-relaxed shadow-2xs ${
                        m.sender === "user"
                          ? "text-white rounded-br-xs font-medium"
                          : "bg-white border border-slate-200/80 text-slate-800 rounded-bl-xs"
                      }`}
                    >
                      {m.text}
                    </div>
                  </div>
                ))}

                {isTyping && (
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400 bg-white p-2 rounded-xl border border-slate-100 w-fit">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-ping" />
                    <span>Typing...</span>
                  </div>
                )}
              </div>

              {/* Starter Question Chips */}
              {starterPrompts.length > 0 && messages.length <= 2 && (
                <div className="px-3 py-2 bg-white border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto">
                  {starterPrompts.map((prompt, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleSend(prompt)}
                      className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 shrink-0 transition cursor-pointer"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              )}

              {/* Input Form */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="p-2.5 bg-white border-t border-slate-200 flex items-center gap-2"
              >
                <input
                  type="text"
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value)}
                  placeholder="Ask a question..."
                  className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400"
                />
                <button
                  type="submit"
                  style={{ backgroundColor: primaryColor }}
                  disabled={!inputVal.trim() || isTyping}
                  className="p-2 rounded-xl text-white transition disabled:opacity-50 cursor-pointer shadow-2xs"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          ) : (
            /* Collapsed Floating Chat Bubble */
            <button
              type="button"
              onClick={() => setIsOpen(true)}
              style={{ backgroundColor: primaryColor }}
              className="w-14 h-14 rounded-full text-white shadow-2xl flex items-center justify-center cursor-pointer transform hover:scale-105 active:scale-95 transition shadow-fuchsia-600/30 group"
            >
              <MessageSquare className="w-6 h-6 stroke-[2.2]" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
