"use client";

import React, { useState } from "react";
import { AlertTriangle, Trash2, Loader2 } from "lucide-react";
import { useOrganization } from "@/context/OrganizationContext";
import { api } from "@/lib/api";

export function DangerZoneCard() {
  const { currentOrg } = useOrganization();
  const [confirmText, setConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (confirmText !== currentOrg?.name || !currentOrg) return;
    if (confirm(`Are you absolutely sure you want to delete ${currentOrg.name}? All tickets, documents, and API keys will be deleted immediately.`)) {
      setIsDeleting(true);
      try {
        await api.delete(`/organizations/${currentOrg.id}`);
        alert("Workspace deleted.");
        // Redirect or refresh
        window.location.href = "/dashboard";
      } catch (err: any) {
        alert("Failed to delete workspace: " + (err.response?.data?.detail || "Unknown error"));
      } finally {
        setIsDeleting(false);
      }
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-rose-200/80 shadow-2xs p-6 sm:p-8 space-y-5">
      <div className="flex items-center gap-2.5 pb-4 border-b border-rose-100">
        <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100">
          <AlertTriangle className="w-4 h-4" />
        </div>
        <div>
          <h3 className="text-sm font-extrabold text-rose-900 tracking-tight">
            Danger Zone
          </h3>
          <p className="text-xs text-rose-500 mt-0.5">
            Irreversible destructive actions for this workspace.
          </p>
        </div>
      </div>

      <div className="p-4 rounded-2xl bg-rose-50/50 border border-rose-200 text-xs text-rose-900 space-y-3">
        <div>
          <span className="font-bold block">Delete this workspace</span>
          <span className="text-rose-700 text-[11px]">
            Permanently delete <strong>{currentOrg?.name}</strong>, all pgvector embeddings, escalated tickets, and webhook subscriptions.
          </span>
        </div>

        <div className="space-y-2 pt-2">
          <label className="block text-[11px] font-semibold text-rose-800">
            Type <strong>{currentOrg?.name}</strong> to confirm:
          </label>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={currentOrg?.name || "Workspace name"}
              className="px-3.5 py-2 bg-white border border-rose-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition flex-1"
            />
            <button
              type="button"
              disabled={confirmText !== currentOrg?.name || isDeleting}
              onClick={handleDelete}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white font-bold rounded-xl text-xs shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
              <span>Delete Workspace</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
