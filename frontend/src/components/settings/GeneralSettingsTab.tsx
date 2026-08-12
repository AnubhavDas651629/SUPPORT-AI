"use client";

import React, { useState, useEffect } from "react";
import { Building2, Mail, Globe, Save, CheckCircle2, Loader2 } from "lucide-react";
import { useOrganization } from "@/context/OrganizationContext";
import { api } from "@/lib/api";

export function GeneralSettingsTab() {
  const { currentOrg, refreshOrgData } = useOrganization();
  const [name, setName] = useState(currentOrg?.name || "");
  const [supportEmail, setSupportEmail] = useState("support@yourcompany.com");
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (currentOrg) {
      setName(currentOrg.name);
    }
  }, [currentOrg]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !currentOrg) return;

    setIsSaving(true);
    setSavedSuccess(false);

    try {
      await api.patch(`/organizations/${currentOrg.id}`, {
        name: name.trim(),
      });
      await refreshOrgData();
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch (err) {
      alert("Failed to update organization name.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs p-6 sm:p-8 space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div>
          <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">
            Organization Profile
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage your workspace name, primary support email, and branding domain.
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-5 max-w-xl">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Workspace Name
          </label>
          <div className="relative">
            <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/20 focus:border-fuchsia-500 transition font-medium"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Primary Support Email
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="email"
              value={supportEmail}
              onChange={(e) => setSupportEmail(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/20 focus:border-fuchsia-500 transition"
            />
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Used as the reply-to address on customer escalation notices.
          </span>
        </div>

        <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
          <button
            type="submit"
            disabled={isSaving || !name.trim()}
            className="px-5 py-2.5 bg-slate-950 hover:bg-black text-white text-xs font-semibold rounded-2xl shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            <span>Save Profile</span>
          </button>

          {savedSuccess && (
            <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" />
              <span>Saved successfully</span>
            </span>
          )}
        </div>
      </form>
    </div>
  );
}
