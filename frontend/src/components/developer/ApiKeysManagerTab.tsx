"use client";

import React, { useState, useEffect } from "react";
import { Key, Plus, Trash2, ShieldCheck, Clock, CheckCircle2, Lock, Sparkles, Loader2 } from "lucide-react";
import { CreateApiKeyModal } from "./CreateApiKeyModal";
import { ApiKeySecretModal } from "./ApiKeySecretModal";
import { useOrganization } from "@/context/OrganizationContext";
import { api } from "@/lib/api";

interface ApiKeyItem {
  id: string;
  name: string;
  key_prefix: string;
  created_at: string;
  expires_at?: string;
  is_active: boolean;
}

export function ApiKeysManagerTab({ onOpenUpgrade }: { onOpenUpgrade: () => void }) {
  const { currentOrg, subscription } = useOrganization();
  const [keys, setKeys] = useState<ApiKeyItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createdSecret, setCreatedSecret] = useState<string | null>(null);
  const [createdKeyName, setCreatedKeyName] = useState("");

  const planTier = subscription?.plan_tier || "FREE";
  const allowsApiKeys = subscription?.limits?.allows_api_keys ?? (planTier !== "FREE");

  const loadKeys = async () => {
    if (!currentOrg) return;
    setIsLoading(true);
    try {
      const res = await api.get(`/organizations/${currentOrg.id}/api-keys`);
      if (Array.isArray(res.data)) {
        setKeys(res.data);
      } else {
        setKeys([]);
      }
    } catch (err) {
      console.warn("Could not load API keys:", err);
      setKeys([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadKeys();
  }, [currentOrg]);

  const handleKeyCreated = (secret: string, name: string, prefix: string) => {
    loadKeys();
    setCreatedSecret(secret);
    setCreatedKeyName(name);
  };

  const handleRevoke = async (keyId: string) => {
    if (!currentOrg) return;
    if (confirm("Are you sure you want to revoke this API key? Applications using it will immediately fail.")) {
      try {
        await api.delete(`/organizations/${currentOrg.id}/api-keys/${keyId}`);
        setKeys((prev) => prev.filter((k) => k.id !== keyId));
      } catch (err) {
        alert("Failed to revoke API key.");
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Free Plan Lock Notice */}
      {!allowsApiKeys && (
        <div className="p-5 bg-gradient-to-r from-[#FDF2F8] via-[#FAF5FF] to-[#F5F3FF] border border-fuchsia-200/80 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-fuchsia-100 text-fuchsia-600 flex items-center justify-center shrink-0 shadow-2xs">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-extrabold text-slate-900">API Keys are gated on Pro & Enterprise Plans</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Your workspace is currently on the <strong>Free Plan</strong>. Upgrade to unlock production API keys and server-to-server gateway access.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onOpenUpgrade}
            className="px-4 py-2.5 bg-fuchsia-600 hover:bg-fuchsia-700 active:bg-fuchsia-800 text-white rounded-xl text-xs font-bold shrink-0 shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Upgrade to Pro</span>
          </button>
        </div>
      )}

      {/* Header & Create Button */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs p-6 flex items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Production API Keys</span>
            <span className="text-[10px] bg-amber-100 text-amber-700 font-bold px-2 py-0.5 rounded-full">
              Bearer X-API-Key
            </span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Authenticate direct server-to-server requests to the Support AI Gateway.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            if (!allowsApiKeys) {
              onOpenUpgrade();
            } else {
              setIsCreateOpen(true);
            }
          }}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs font-semibold shadow-xs transition cursor-pointer ${
            allowsApiKeys
              ? "bg-slate-950 hover:bg-black text-white"
              : "bg-slate-100 text-slate-500 hover:bg-slate-200"
          }`}
        >
          {!allowsApiKeys ? <Lock className="w-3.5 h-3.5 text-fuchsia-600" /> : <Plus className="w-3.5 h-3.5" />}
          <span>{allowsApiKeys ? "Generate New Key" : "Unlock API Keys (Pro)"}</span>
        </button>
      </div>

      {/* Keys Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs p-6 space-y-4">
        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400 text-xs">
            <Loader2 className="w-5 h-5 animate-spin text-fuchsia-600" />
            <span>Loading API keys...</span>
          </div>
        ) : keys.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">
            <Key className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="font-bold text-slate-700">No API keys created yet</p>
            <p className="mt-0.5">
              {allowsApiKeys
                ? "Click 'Generate New Key' above to create your first production API key."
                : "Upgrade your workspace to Pro to generate production secret keys."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {keys.map((k) => (
              <div
                key={k.id}
                className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center border shrink-0 ${
                      k.is_active
                        ? "bg-amber-50 text-amber-600 border-amber-100"
                        : "bg-slate-100 text-slate-400 border-slate-200"
                    }`}
                  >
                    <Key className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">{k.name}</h4>
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded-md uppercase ${
                          k.is_active
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                            : "bg-rose-50 text-rose-700 border border-rose-200/60"
                        }`}
                      >
                        {k.is_active ? "Active" : "Revoked"}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                      <span className="font-mono text-slate-600 font-bold">{k.key_prefix}</span>
                      <span>•</span>
                      <span>Created: {new Date(k.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div>
                  {k.is_active && (
                    <button
                      type="button"
                      onClick={() => handleRevoke(k.id)}
                      className="px-3 py-1.5 rounded-xl border border-rose-200 hover:bg-rose-50 text-rose-600 text-xs font-semibold transition cursor-pointer flex items-center gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Revoke</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Key Modal */}
      <CreateApiKeyModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onKeyCreated={handleKeyCreated}
        onOpenUpgrade={onOpenUpgrade}
      />

      {/* Show Secret Modal Once */}
      <ApiKeySecretModal
        isOpen={!!createdSecret}
        onClose={() => setCreatedSecret(null)}
        rawSecretKey={createdSecret || ""}
        keyName={createdKeyName}
      />
    </div>
  );
}
