"use client";

import React, { useState, useEffect } from "react";
import { Sparkles, Bot, Zap, ShieldCheck } from "lucide-react";

interface NodeItem {
  id: string;
  name: string;
  category: string;
  color: string;
  bgColor: string;
  x: number; // percentage
  y: number; // percentage
  icon: string;
}

const NODES: NodeItem[] = [
  { id: "openai", name: "OpenAI", category: "LLM Provider", color: "#10A37F", bgColor: "bg-emerald-50 text-emerald-600 border-emerald-200", x: 18, y: 22, icon: "AI" },
  { id: "anthropic", name: "Claude", category: "Reasoning Model", color: "#D97706", bgColor: "bg-amber-50 text-amber-600 border-amber-200", x: 50, y: 14, icon: "CL" },
  { id: "elevenlabs", name: "ElevenLabs", category: "Voice Agent", color: "#0F172A", bgColor: "bg-slate-50 text-slate-800 border-slate-200", x: 82, y: 22, icon: "11" },
  { id: "meta", name: "Meta LLaMA", category: "Open Source", color: "#0081FB", bgColor: "bg-blue-50 text-blue-600 border-blue-200", x: 16, y: 50, icon: "∞" },
  { id: "zendesk", name: "Zendesk", category: "Ticketing CRM", color: "#03363D", bgColor: "bg-teal-50 text-teal-700 border-teal-200", x: 84, y: 50, icon: "ZD" },
  { id: "slack", name: "Slack", category: "Agent Alert", color: "#4A154B", bgColor: "bg-purple-50 text-purple-700 border-purple-200", x: 18, y: 78, icon: "#" },
  { id: "stripe", name: "Stripe", category: "Usage & Billing", color: "#635BFF", bgColor: "bg-indigo-50 text-indigo-600 border-indigo-200", x: 50, y: 86, icon: "S" },
  { id: "postgres", name: "Postgres PGVector", category: "Vector Store", color: "#336791", bgColor: "bg-sky-50 text-sky-700 border-sky-200", x: 82, y: 78, icon: "PG" },
];

const SLIDES = [
  {
    title: "Select & Combine & Integrate.",
    subtitle: "Deploy and refine autonomous AI support agents with instant human escalation.",
  },
  {
    title: "RAG Ingestion in Real-Time.",
    subtitle: "Upload PDF, TXT, and DOCX files. Chunked and indexed via PostgreSQL pgvector in seconds.",
  },
  {
    title: "Automated Ticket Escalation.",
    subtitle: "When AI detects refunds or VIP requests, tickets and webhooks are created instantaneously.",
  },
];

export function ConstellationCanvas() {
  const [activeSlide, setActiveSlide] = useState(0);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  // Auto rotate slides
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % SLIDES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-between p-8 sm:p-12 overflow-hidden select-none">
      {/* Subtle Micro-Dot Grid Pattern */}
      <div
        className="absolute inset-0 opacity-70 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(#CBD5E1 1.2px, transparent 1.2px)",
          backgroundSize: "20px 20px",
        }}
      />

      {/* Top Headline & Carousel Text */}
      <div className="relative z-10 text-center max-w-md mt-4 transition-all duration-500">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          {SLIDES[activeSlide].title}
        </h2>
        <p className="text-sm text-slate-500 mt-2 font-normal leading-relaxed">
          {SLIDES[activeSlide].subtitle}
        </p>
      </div>

      {/* Center Interactive Constellation Diagram */}
      <div className="relative w-full max-w-[420px] aspect-square my-auto flex items-center justify-center">
        {/* Dotted Connecting Lines SVG */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none stroke-slate-300 stroke-[1.5] stroke-dasharray-[4_4]">
          {NODES.map((node) => (
            <line
              key={node.id}
              x1="50%"
              y1="50%"
              x2={`${node.x}%`}
              y2={`${node.y}%`}
              className={`transition-all duration-300 ${
                hoveredNode === node.id ? "stroke-indigo-500 stroke-[2] stroke-dasharray-none" : "stroke-slate-300/80"
              }`}
            />
          ))}
        </svg>

        {/* Orbiting Integration Nodes */}
        {NODES.map((node) => (
          <div
            key={node.id}
            onMouseEnter={() => setHoveredNode(node.id)}
            onMouseLeave={() => setHoveredNode(null)}
            style={{
              left: `${node.x}%`,
              top: `${node.y}%`,
              transform: "translate(-50%, -50%)",
            }}
            className="absolute z-10 group cursor-pointer"
          >
            <div
              className={`w-11 h-11 rounded-2xl border flex items-center justify-center font-bold text-xs shadow-sm backdrop-blur-sm transition-all duration-300 transform group-hover:scale-115 group-hover:shadow-md ${node.bgColor}`}
            >
              {node.icon}
            </div>

            {/* Hover Tooltip Card */}
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2.5 py-1 bg-slate-900 text-white text-[11px] font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-lg z-30">
              <span className="font-semibold">{node.name}</span>
              <span className="text-slate-400 block text-[9px]">{node.category}</span>
            </div>
          </div>
        ))}

        {/* Center Glowing SupportAI Hub Badge */}
        <div className="relative z-20 w-20 h-20 rounded-2xl bg-slate-950 text-white flex flex-col items-center justify-center shadow-xl shadow-indigo-950/20 border border-slate-800 transform hover:scale-105 transition-transform duration-300 group cursor-pointer">
          {/* Animated Glow Ring */}
          <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl blur-sm opacity-40 group-hover:opacity-75 transition duration-500 -z-10 animate-pulse" />

          {/* Central Logo Symbol */}
          <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center border border-white/15 text-indigo-400">
            <Bot className="w-5 h-5 stroke-[2.2]" />
          </div>
          <span className="text-[10px] font-bold tracking-wider text-slate-200 mt-1 uppercase">Support AI</span>
        </div>
      </div>

      {/* Bottom Carousel Indicator Dots */}
      <div className="relative z-10 flex items-center gap-2 mb-2">
        {SLIDES.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setActiveSlide(idx)}
            className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
              activeSlide === idx ? "w-6 bg-slate-900" : "w-2 bg-slate-300 hover:bg-slate-400"
            }`}
            aria-label={`Slide ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
