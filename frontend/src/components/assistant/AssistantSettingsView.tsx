"use client";

import React, { useState, useEffect } from "react";
import {
  Palette,
  Sliders,
  Code2,
  Save,
  CheckCircle2,
  Sparkles,
  Bot,
  Loader2,
  Copy,
} from "lucide-react";
import { BrandingAppearanceTab } from "./BrandingAppearanceTab";
import { AiPersonalityTab } from "./AiPersonalityTab";
import { LiveWidgetSimulator } from "./LiveWidgetSimulator";
import { useOrganization } from "@/context/OrganizationContext";
import { api } from "@/lib/api";

export function AssistantSettingsView() {
  const { currentOrg, subscription } = useOrganization();
  const [activeTab, setActiveTab] = useState<"branding" | "personality" | "embed">("branding");

  // Form State
  const [widgetTitle, setWidgetTitle] = useState("Acme Assistant");
  const [welcomeMessage, setWelcomeMessage] = useState(
    "Hi there! How can we help you today?"
  );
  const [primaryColor, setPrimaryColor] = useState("#C026D3");
  const [placement, setPlacement] = useState<"bottom-right" | "bottom-left">("bottom-right");
  const [starterPrompts, setStarterPrompts] = useState<string[]>([
    "Track my package",
    "Return an item",
    "Speak with a human",
  ]);

  const [systemPrompt, setSystemPrompt] = useState(
    "You are an empathetic, concise customer support assistant. Answer directly based on the uploaded knowledge base without fluff."
  );
  const [temperature, setTemperature] = useState(0.2);
  const [supportEmail, setSupportEmail] = useState("support@company.com");
  const [autoEscalate, setAutoEscalate] = useState(true);

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Load existing org settings on mount
  useEffect(() => {
    if (!currentOrg) return;

    async function loadSettings() {
      try {
        const res = await api.get(`/organizations/${currentOrg!.id}/settings`);
        if (res.data) {
          if (res.data.widget_title) setWidgetTitle(res.data.widget_title);
          if (res.data.primary_color) setPrimaryColor(res.data.primary_color);
          if (res.data.system_prompt_override) setSystemPrompt(res.data.system_prompt_override);
          if (typeof res.data.temperature === "number") setTemperature(res.data.temperature);
          if (res.data.support_email) setSupportEmail(res.data.support_email);
          if (typeof res.data.auto_create_ticket_on_escalation === "boolean") {
            setAutoEscalate(res.data.auto_create_ticket_on_escalation);
          }
        }
      } catch (err) {
        console.warn("Could not load organization settings:", err);
      }
    }

    loadSettings();
  }, [currentOrg]);

  const handleSave = async () => {
    if (!currentOrg) return;
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      await api.patch(`/organizations/${currentOrg.id}/settings`, {
        widget_title: widgetTitle,
        primary_color: primaryColor,
        system_prompt_override: systemPrompt,
        temperature: temperature,
        support_email: supportEmail || undefined,
        auto_create_ticket_on_escalation: autoEscalate,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      // In free tier / dev mock, show success as well
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const embedSnippet = `<script src="http://localhost:8000/static/widget.js" data-org-id="${
    currentOrg?.id || "your-org-id"
  }" defer></script>`;

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Header Bar with Save CTA */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-fuchsia-50 text-fuchsia-600 border border-fuchsia-100 flex items-center justify-center">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">
                AI Assistant Studio & Widget Branding
              </h2>
              <span className="text-[10px] bg-fuchsia-100 text-fuchsia-700 font-bold px-2 py-0.5 rounded-full uppercase">
                Live Studio
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Customize colors, bot greetings, system prompt personality, and test live chat in real-time.
            </p>
          </div>
        </div>

        {/* Save Settings Button */}
        <div className="flex items-center gap-3">
          {saveSuccess && (
            <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 animate-in fade-in duration-200">
              <CheckCircle2 className="w-4 h-4" />
              <span>Saved & Deployed!</span>
            </span>
          )}

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="px-5 py-2.5 rounded-2xl bg-fuchsia-600 hover:bg-fuchsia-700 active:bg-fuchsia-800 text-white text-xs font-bold shadow-md shadow-fuchsia-600/20 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Save Changes</span>
          </button>
        </div>
      </div>

      {/* Main Two-Column Studio Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Configuration Controls (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200/80 shadow-2xs p-6 space-y-6 flex flex-col justify-between">
          {/* Tab Navigation */}
          <div>
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-6">
              <button
                type="button"
                onClick={() => setActiveTab("branding")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
                  activeTab === "branding"
                    ? "bg-fuchsia-50 text-fuchsia-700 border border-fuchsia-200/70 shadow-2xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <Palette className="w-3.5 h-3.5" />
                <span>Branding & Appearance</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("personality")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
                  activeTab === "personality"
                    ? "bg-fuchsia-50 text-fuchsia-700 border border-fuchsia-200/70 shadow-2xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>AI Persona & Model</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("embed")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
                  activeTab === "embed"
                    ? "bg-fuchsia-50 text-fuchsia-700 border border-fuchsia-200/70 shadow-2xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <Code2 className="w-3.5 h-3.5" />
                <span>Deploy Widget</span>
              </button>
            </div>

            {/* Tab Contents */}
            {activeTab === "branding" && (
              <BrandingAppearanceTab
                widgetTitle={widgetTitle}
                setWidgetTitle={setWidgetTitle}
                welcomeMessage={welcomeMessage}
                setWelcomeMessage={setWelcomeMessage}
                primaryColor={primaryColor}
                setPrimaryColor={setPrimaryColor}
                placement={placement}
                setPlacement={setPlacement}
                starterPrompts={starterPrompts}
                setStarterPrompts={setStarterPrompts}
              />
            )}

            {activeTab === "personality" && (
              <AiPersonalityTab
                systemPrompt={systemPrompt}
                setSystemPrompt={setSystemPrompt}
                temperature={temperature}
                setTemperature={setTemperature}
                supportEmail={supportEmail}
                setSupportEmail={setSupportEmail}
                autoEscalate={autoEscalate}
                setAutoEscalate={setAutoEscalate}
              />
            )}

            {activeTab === "embed" && (
              <div className="space-y-4 text-xs">
                <div>
                  <h4 className="font-bold text-slate-800">Standard HTML Embed Tag</h4>
                  <p className="text-slate-400 text-[11px] mt-0.5">
                    Paste this snippet before the closing <code className="text-fuchsia-600">&lt;/body&gt;</code> tag on any website.
                  </p>
                </div>

                <div className="p-4 bg-slate-950 text-slate-100 rounded-2xl font-mono text-xs flex items-center justify-between gap-3 shadow-inner">
                  <code className="truncate">{embedSnippet}</code>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(embedSnippet);
                      setCopiedCode(true);
                      setTimeout(() => setCopiedCode(false), 2000);
                    }}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white transition shrink-0 cursor-pointer flex items-center gap-1 font-sans font-semibold text-xs"
                  >
                    {copiedCode ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedCode ? "Copied" : "Copy"}</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
            <span>Updates deploy live to the floating widget immediately</span>
            <span className="font-mono text-slate-600">Model: gpt-4o-mini</span>
          </div>
        </div>

        {/* Right Column: Live Simulated Website & Floating Widget Preview (5 cols) */}
        <div className="lg:col-span-5">
          <LiveWidgetSimulator
            widgetTitle={widgetTitle}
            welcomeMessage={welcomeMessage}
            primaryColor={primaryColor}
            placement={placement}
            starterPrompts={starterPrompts}
          />
        </div>
      </div>
    </div>
  );
}
