"use client";

import React, { useState } from "react";
import { X, Trash2, AlertTriangle, Loader2 } from "lucide-react";
import { useOrganization } from "@/context/OrganizationContext";
import { api } from "@/lib/api";

interface KnowledgeBaseItem {
  id: string;
  name: string;
  description: string;
}

export function DeleteKbModal({
  isOpen,
  onClose,
  kb,
  documentsCount,
  onDeleted,
}: {
  isOpen: boolean;
  onClose: () => void;
  kb: KnowledgeBaseItem | null;
  documentsCount: number;
  onDeleted: (kbId: string) => void;
}) {
  const { currentOrg } = useOrganization();
  const [confirmName, setConfirmName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen || !kb) return null;

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentOrg || confirmName.trim().toLowerCase() !== kb.name.trim().toLowerCase()) {
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      await api.delete(`/organizations/${currentOrg.id}/knowledge-bases/${kb.id}`);
      onDeleted(kb.id);
      onClose();
    } catch (err: any) {
      console.error("Failed to delete knowledge base:", err);
      const detail = err.response?.data?.detail;
      let message = "Failed to delete knowledge base. Please try again.";
      if (typeof detail === "string") {
        message = detail;
      } else if (Array.isArray(detail) && detail[0]?.msg) {
        message = detail[0].msg;
      } else if (err.response?.status === 403) {
        message = "Permission denied. Only workspace owners can delete knowledge bases.";
      }
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  };

  const isConfirmed = confirmName.trim().toLowerCase() === kb.name.trim().toLowerCase();

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100">
              <Trash2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Delete Knowledge Base</h3>
              <p className="text-[11px] text-slate-400">Irreversible action</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {errorMessage && (
          <div className="mt-4 p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="mt-4 p-4 bg-rose-50/70 border border-rose-200/80 rounded-2xl space-y-2">
          <div className="flex items-start gap-2 text-rose-800 text-xs font-semibold">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>Warning: Permanent Deletion</span>
          </div>
          <p className="text-xs text-rose-700 leading-relaxed">
            Deleting <strong className="font-bold text-rose-900">{kb.name}</strong> will permanently remove all{" "}
            <strong>{documentsCount} indexed document{documentsCount === 1 ? "" : "s"}</strong> and their corresponding vector embeddings from pgvector.
          </p>
        </div>

        <form onSubmit={handleDelete} className="space-y-4 mt-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              To confirm, type <span className="font-bold text-slate-900 select-all">{kb.name}</span> below:
            </label>
            <input
              type="text"
              required
              value={confirmName}
              onChange={(e) => setConfirmName(e.target.value)}
              placeholder={kb.name}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !isConfirmed}
              className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
              <span>Delete Knowledge Base</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
