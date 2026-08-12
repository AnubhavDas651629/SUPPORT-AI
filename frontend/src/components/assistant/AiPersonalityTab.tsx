"use client";

import React from "react";
import { Sliders, Sparkles, ShieldAlert, Mail, Zap } from "lucide-react";

const PROMPT_TEMPLATES = [
  {
    name: "Polite & Concise",
    prompt:
      "You are an empathetic, concise customer support assistant. Answer directly based on the uploaded knowledge base without fluff. If you do not have enough context, offer to escalate to human support.",
  },
  {
    name: "E-Commerce & Refunds",
    prompt:
      "You are an e-commerce support specialist. Assist customers with order status, tracking delivery dates, and return merchandise authorization (RMA). If a refund exceeds $50 or order is lost, immediately escalate.",
  },
  {
    name: "Developer Technical Support",
    prompt:
      "You are a technical developer support agent. Provide precise code snippets, explain API parameters, and detail webhook HMAC validation algorithms accurately.",
  },
];

export function AiPersonalityTab({
  systemPrompt,
  setSystemPrompt,
  temperature,
  setTemperature,
  supportEmail,
  setSupportEmail,
  autoEscalate,
  setAutoEscalate,
}: {
  systemPrompt: string;
  setSystemPrompt: (val: string) => void;
  temperature: number;
  setTemperature: (val: number) => void;
  supportEmail: string;
  setSupportEmail: (val: string) => void;
  autoEscalate: boolean;
  setAutoEscalate: (val: boolean) => void;
}) {
  return (
    <div className="space-y-6">
      {/* 1. System Prompt Override */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-bold text-slate-800">
            System Instructions / Prompt Persona
          </label>
          <span className="text-[11px] text-fuchsia-600 font-semibold">Custom LLM Instructions</span>
        </div>

        {/* Template Presets */}
        <div className="flex items-center gap-1.5 flex-wrap mb-2">
          {PROMPT_TEMPLATES.map((tmpl) => (
            <button
              key={tmpl.name}
              type="button"
              onClick={() => setSystemPrompt(tmpl.prompt)}
              className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-fuchsia-50 hover:text-fuchsia-600 text-slate-600 transition cursor-pointer border border-slate-200/60"
            >
              + Use "{tmpl.name}"
            </button>
          ))}
        </div>

        <textarea
          rows={5}
          value={systemPrompt}
          onChange={(e) => setSystemPrompt(e.target.value)}
          placeholder="You are a helpful customer support agent..."
          className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 leading-relaxed focus:outline-none focus:ring-2 focus:ring-fuchsia-500/20 focus:border-fuchsia-500 transition shadow-2xs font-mono"
        />
        <p className="text-[11px] text-slate-400 mt-1">
          These instructions are injected as the system persona before answering queries using pgvector RAG chunks.
        </p>
      </div>

      {/* 2. Temperature Slider */}
      <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-800 block">LLM Temperature (Creativity)</span>
            <span className="text-[11px] text-slate-400">
              {temperature <= 0.2
                ? "Strict & Factual (Recommended for Policies)"
                : temperature <= 0.6
                ? "Balanced & Conversational"
                : "Creative & Expressive"}
            </span>
          </div>
          <span className="font-mono text-xs font-extrabold text-fuchsia-700 bg-fuchsia-100 px-2.5 py-1 rounded-xl">
            {temperature.toFixed(2)}
          </span>
        </div>

        <input
          type="range"
          min="0.0"
          max="1.0"
          step="0.05"
          value={temperature}
          onChange={(e) => setTemperature(parseFloat(e.target.value))}
          className="w-full accent-fuchsia-600 cursor-pointer"
        />

        <div className="flex justify-between text-[10px] text-slate-400 font-medium">
          <span>0.0 (Deterministic)</span>
          <span>0.5 (Standard)</span>
          <span>1.0 (Creative)</span>
        </div>
      </div>

      {/* 3. Auto-Escalation Toggle */}
      <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-slate-800 block">Auto-Create Human Ticket on Escalation</span>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Automatically create an urgent ticket in the Escalation Queue when AI detects refund requests, chargebacks, or negative sentiment.
          </p>
        </div>

        <label className="relative inline-flex items-center cursor-pointer shrink-0">
          <input
            type="checkbox"
            checked={autoEscalate}
            onChange={(e) => setAutoEscalate(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-fuchsia-600" />
        </label>
      </div>

      {/* 4. Fallback Support Email */}
      <div>
        <label className="block text-xs font-bold text-slate-800 mb-1.5">
          Fallback Escalation Support Email
        </label>
        <input
          type="email"
          value={supportEmail}
          onChange={(e) => setSupportEmail(e.target.value)}
          placeholder="support@company.com"
          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/20 focus:border-fuchsia-500 transition shadow-2xs"
        />
      </div>
    </div>
  );
}
