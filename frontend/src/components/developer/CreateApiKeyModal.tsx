"use client";

import React, { useState } from "react";
import { X, Key, Plus, Loader2, AlertCircle, Sparkles } from "lucide-react";
import { useOrganization } from "@/context/OrganizationContext";
import { api } from "@/lib/api";

export function CreateApiKeyModal({
  isOpen,
  onClose,
  onKeyCreated,
  onOpenUpgrade,
}: {
  isOpen: boolean;
  onClose: () => void;
  onKeyCreated: (rawSecret: string, keyName: string, prefix: string) => void;
  onOpenUpgrade?: () => void;
}) {
  const { currentOrg, subscription } = useOrganization();
  const [name, setName] = useState("");
  const [expiry, setExpiry] = useState("never");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isGatedError, setIsGatedError] = useState(false);

  if (!isOpen) return null;

  const allowsApiKeys = subscription?.limits?.allows_api_keys ?? (subscription?.plan_tier !== "FREE");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !currentOrg) return;

    setErrorMessage(null);
    setIsGatedError(false);

    if (!allowsApiKeys) {
      setIsGatedError(true);
      setErrorMessage("API Keys are not allowed on the Free tier. Please upgrade to Pro or Enterprise.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.post(`/organizations/${currentOrg.id}/api-keys`, {
        name: name.trim(),
      });
      onKeyCreated(res.data.secret_key, res.data.name, res.data.key_prefix);
      onClose();
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      const status = err.response?.status;
      if (status === 403 || (typeof detail === "string" && detail.toLowerCase().includes("plan"))) {
        setIsGatedError(true);
        setErrorMessage(typeof detail === "string" ? detail : "API Keys require a Pro or Enterprise subscription.");
      } else {
        setErrorMessage(typeof detail === "string" ? detail : "Failed to create API key. Please check your permissions.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
              <Key className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Create Production API Key</h3>
              <p className="text-[11px] text-slate-400">Generate a secret key for backend API access</p>
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
          <div className="mt-4 p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 flex flex-col gap-2">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
            {isGatedError && onOpenUpgrade && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenUpgrade();
                }}
                className="mt-1 w-full py-2 bg-fuchsia-600 hover:bg-fuchsia-700 text-white rounded-xl font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Upgrade to Pro Now</span>
              </button>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Key Name / Description</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Production Backend Gateway / Zapier"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/20 focus:border-fuchsia-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Expiration Period</label>
            <select
              value={expiry}
              onChange={(e) => setExpiry(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/20 focus:border-fuchsia-500 transition"
            >
              <option value="never">No Expiration (Recommended for servers)</option>
              <option value="30">30 Days</option>
              <option value="90">90 Days</option>
              <option value="365">1 Year</option>
            </select>
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
              disabled={isLoading || !name.trim()}
              className="px-5 py-2 rounded-xl bg-fuchsia-600 hover:bg-fuchsia-700 text-white text-xs font-semibold shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Generate API Key"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
