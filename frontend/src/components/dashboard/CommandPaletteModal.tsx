"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  Sparkles,
  Upload,
  LifeBuoy,
  Code2,
  Webhook,
  Key,
  Sliders,
  BookOpen,
  ArrowRight,
} from "lucide-react";

export function CommandPaletteModal({
  isOpen,
  onClose,
  onSelectAction,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSelectAction: (actionKey: string) => void;
}) {
  const [query, setQuery] = useState("");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === "k" || e.key === "f")) {
        e.preventDefault();
        // Toggle
      }
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const commands = [
    { key: "live_test", label: "Open Live AI Chat Simulator", icon: Sparkles, category: "AI Assistant" },
    { key: "new_ticket", label: "Create New Escalation Ticket", icon: LifeBuoy, category: "Tickets" },
    { key: "upload_doc", label: "Upload Document to pgvector", icon: Upload, category: "Knowledge Base" },
    { key: "embed_code", label: "Copy HTML Widget Embed Script", icon: Code2, category: "Widget" },
    { key: "webhooks", label: "Configure Outbound Webhook Endpoints", icon: Webhook, category: "Developer" },
    { key: "api_keys", label: "Generate & Manage API Keys", icon: Key, category: "Developer" },
    { key: "settings", label: "AI Prompt & Temperature Settings", icon: Sliders, category: "Settings" },
  ];

  const filtered = commands.filter((c) =>
    c.label.toLowerCase().includes(query.toLowerCase()) || c.category.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-xs flex items-start justify-center pt-24 p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Search Input Bar */}
        <div className="p-4 border-b border-slate-100 flex items-center gap-3">
          <Search className="w-4 h-4 text-fuchsia-600 shrink-0" />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command, search tickets, or navigate..."
            className="w-full text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none bg-transparent"
          />
          <kbd className="px-2 py-0.5 rounded-lg bg-slate-100 text-[10px] font-mono text-slate-500 font-bold">
            ESC
          </kbd>
        </div>

        {/* Command List */}
        <div className="p-2 max-h-80 overflow-y-auto space-y-1">
          {filtered.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400">
              No matching commands found.
            </div>
          ) : (
            filtered.map((c) => {
              const Icon = c.icon;
              return (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => {
                    onSelectAction(c.key);
                    onClose();
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-fuchsia-50/60 hover:text-fuchsia-700 text-slate-700 transition text-left cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-slate-100 group-hover:bg-fuchsia-100 text-slate-600 group-hover:text-fuchsia-600 flex items-center justify-center transition">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 group-hover:text-fuchsia-700 transition">
                        {c.label}
                      </div>
                      <div className="text-[10px] text-slate-400">{c.category}</div>
                    </div>
                  </div>

                  <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-fuchsia-600 transition" />
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
