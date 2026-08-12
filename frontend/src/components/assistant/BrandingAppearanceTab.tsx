"use client";

import React, { useState } from "react";
import { Sliders, Palette, Plus, X, AlignRight, AlignLeft } from "lucide-react";

const COLOR_PRESETS = [
  { name: "Fuchsia Magenta", hex: "#C026D3" },
  { name: "Electric Indigo", hex: "#6366F1" },
  { name: "Ocean Blue", hex: "#0EA5E9" },
  { name: "Emerald Green", hex: "#10B981" },
  { name: "Slate Black", hex: "#0F172A" },
  { name: "Rose Red", hex: "#E11D48" },
  { name: "Violet Purple", hex: "#8B5CF6" },
  { name: "Amber Orange", hex: "#F59E0B" },
];

export function BrandingAppearanceTab({
  widgetTitle,
  setWidgetTitle,
  welcomeMessage,
  setWelcomeMessage,
  primaryColor,
  setPrimaryColor,
  placement,
  setPlacement,
  starterPrompts,
  setStarterPrompts,
}: {
  widgetTitle: string;
  setWidgetTitle: (val: string) => void;
  welcomeMessage: string;
  setWelcomeMessage: (val: string) => void;
  primaryColor: string;
  setPrimaryColor: (val: string) => void;
  placement: "bottom-right" | "bottom-left";
  setPlacement: (val: "bottom-right" | "bottom-left") => void;
  starterPrompts: string[];
  setStarterPrompts: React.Dispatch<React.SetStateAction<string[]>>;
}) {
  const [newPromptInput, setNewPromptInput] = useState("");

  const handleAddPrompt = () => {
    if (!newPromptInput.trim() || starterPrompts.length >= 4) return;
    setStarterPrompts((prev) => [...prev, newPromptInput.trim()]);
    setNewPromptInput("");
  };

  const handleRemovePrompt = (idx: number) => {
    setStarterPrompts((prev) => prev.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-6">
      {/* 1. Assistant Title */}
      <div>
        <label className="block text-xs font-bold text-slate-800 mb-1.5">
          Assistant Bot Name / Title
        </label>
        <input
          type="text"
          value={widgetTitle}
          onChange={(e) => setWidgetTitle(e.target.value)}
          placeholder="e.g. Acme Support Assistant"
          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/20 focus:border-fuchsia-500 transition shadow-2xs"
        />
        <p className="text-[11px] text-slate-400 mt-1">
          Displayed in the floating widget header when customers open chat.
        </p>
      </div>

      {/* 2. Welcome Message */}
      <div>
        <label className="block text-xs font-bold text-slate-800 mb-1.5">
          Welcome Greeting Message
        </label>
        <textarea
          rows={2}
          value={welcomeMessage}
          onChange={(e) => setWelcomeMessage(e.target.value)}
          placeholder="e.g. Hi there! How can we help you today?"
          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/20 focus:border-fuchsia-500 transition shadow-2xs"
        />
        <p className="text-[11px] text-slate-400 mt-1">
          The first automatic greeting displayed when a visitor initiates chat.
        </p>
      </div>

      {/* 3. Primary Color Theme */}
      <div>
        <label className="block text-xs font-bold text-slate-800 mb-2">
          Brand Theme Color
        </label>
        <div className="flex items-center gap-2.5 flex-wrap mb-3">
          {COLOR_PRESETS.map((p) => (
            <button
              key={p.hex}
              type="button"
              onClick={() => setPrimaryColor(p.hex)}
              style={{ backgroundColor: p.hex }}
              className={`w-8 h-8 rounded-full transition-all transform cursor-pointer ${
                primaryColor.toLowerCase() === p.hex.toLowerCase()
                  ? "ring-4 ring-slate-300 scale-110 shadow-xs"
                  : "hover:scale-105 opacity-90"
              }`}
              title={p.name}
            />
          ))}
        </div>

        <div className="flex items-center gap-2">
          <input
            type="color"
            value={primaryColor}
            onChange={(e) => setPrimaryColor(e.target.value)}
            className="w-8 h-8 rounded-xl border border-slate-200 cursor-pointer p-0.5"
          />
          <input
            type="text"
            value={primaryColor}
            onChange={(e) => setPrimaryColor(e.target.value)}
            className="w-32 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800"
          />
        </div>
      </div>

      {/* 4. Placement on Screen */}
      <div>
        <label className="block text-xs font-bold text-slate-800 mb-2">
          Widget Screen Position
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setPlacement("bottom-right")}
            className={`p-3 rounded-2xl border flex items-center justify-center gap-2 text-xs font-bold transition cursor-pointer ${
              placement === "bottom-right"
                ? "bg-fuchsia-50 border-fuchsia-300 text-fuchsia-700 shadow-2xs"
                : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
            }`}
          >
            <AlignRight className="w-4 h-4" />
            <span>Bottom Right (Standard)</span>
          </button>

          <button
            type="button"
            onClick={() => setPlacement("bottom-left")}
            className={`p-3 rounded-2xl border flex items-center justify-center gap-2 text-xs font-bold transition cursor-pointer ${
              placement === "bottom-left"
                ? "bg-fuchsia-50 border-fuchsia-300 text-fuchsia-700 shadow-2xs"
                : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
            }`}
          >
            <AlignLeft className="w-4 h-4" />
            <span>Bottom Left</span>
          </button>
        </div>
      </div>

      {/* 5. Quick Starter Prompt Chips */}
      <div>
        <label className="block text-xs font-bold text-slate-800 mb-1.5">
          Starter Question Suggestions (Up to 4 chips)
        </label>
        <div className="flex flex-wrap gap-2 mb-3">
          {starterPrompts.map((chip, idx) => (
            <span
              key={idx}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 border border-slate-200/80 rounded-full text-xs text-slate-800 font-medium"
            >
              <span>{chip}</span>
              <button
                type="button"
                onClick={() => handleRemovePrompt(idx)}
                className="text-slate-400 hover:text-rose-600 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>

        {starterPrompts.length < 4 && (
          <div className="flex gap-2">
            <input
              type="text"
              value={newPromptInput}
              onChange={(e) => setNewPromptInput(e.target.value)}
              placeholder="e.g. How do returns work?"
              className="flex-1 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/20 focus:border-fuchsia-500 transition"
            />
            <button
              type="button"
              onClick={handleAddPrompt}
              className="px-3.5 py-2 bg-slate-950 hover:bg-black text-white text-xs font-semibold rounded-xl flex items-center gap-1 transition cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
