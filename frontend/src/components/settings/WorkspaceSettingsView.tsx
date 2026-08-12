"use client";

import React, { useState } from "react";
import { Settings, Building2, Users, AlertTriangle, Sparkles } from "lucide-react";
import { GeneralSettingsTab } from "./GeneralSettingsTab";
import { TeamMembersTab } from "./TeamMembersTab";
import { DangerZoneCard } from "./DangerZoneCard";
import { UpgradeModal } from "@/components/dashboard/UpgradeModal";
import { useOrganization } from "@/context/OrganizationContext";

export function WorkspaceSettingsView() {
  const { currentOrg, subscription } = useOrganization();
  const [activeSubTab, setActiveSubTab] = useState<"general" | "team" | "danger">("general");
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);

  const planTier = subscription?.plan_tier || "FREE";

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Header Bar */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-xs">
            <Settings className="w-5 h-5 text-fuchsia-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">
                Workspace Settings
              </h2>
              <span className="text-[10px] bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded-full uppercase">
                {currentOrg?.name}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Manage organization preferences, team seats, and account controls.
            </p>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-2xl border border-slate-200/70">
          <button
            type="button"
            onClick={() => setActiveSubTab("general")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === "general"
                ? "bg-white text-slate-900 shadow-2xs"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>General</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab("team")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === "team"
                ? "bg-white text-slate-900 shadow-2xs"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Team</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab("danger")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === "danger"
                ? "bg-rose-50 text-rose-700 shadow-2xs"
                : "text-slate-500 hover:text-rose-600"
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Danger</span>
          </button>
        </div>
      </div>

      {/* Subtab Content */}
      {activeSubTab === "general" && <GeneralSettingsTab />}
      {activeSubTab === "team" && <TeamMembersTab onOpenUpgrade={() => setIsUpgradeOpen(true)} />}
      {activeSubTab === "danger" && <DangerZoneCard />}

      <UpgradeModal
        isOpen={isUpgradeOpen}
        onClose={() => setIsUpgradeOpen(false)}
      />
    </div>
  );
}
