"use client";

import React, { useState } from "react";
import { X, Copy, CheckCircle2, AlertTriangle, Key, ShieldCheck } from "lucide-react";

export function ApiKeySecretModal({
  isOpen,
  onClose,
  rawSecretKey,
  keyName,
}: {
  isOpen: boolean;
  onClose: () => void;
  rawSecretKey: string;
  keyName: string;
}) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !rawSecretKey) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(rawSecretKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 sm:p-8 animate-in zoom-in-95 duration-150">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
            <Key className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900">API Key Created Successfully</h3>
            <p className="text-xs text-slate-400">{keyName}</p>
          </div>
        </div>

        {/* Security Warning Alert */}
        <div className="my-4 p-3.5 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3 text-xs text-amber-900">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block">Save this key now</span>
            <span>
              This is the <strong>only time</strong> your secret key will be displayed. If you lose it, you will need to revoke it and generate a new key.
            </span>
          </div>
        </div>

        {/* Raw Secret Key Box */}
        <div className="p-3.5 bg-slate-950 text-emerald-400 font-mono text-xs rounded-2xl flex items-center justify-between gap-3 shadow-inner">
          <code className="truncate select-all">{rawSecretKey}</code>
          <button
            type="button"
            onClick={handleCopy}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white transition shrink-0 cursor-pointer flex items-center gap-1 font-sans font-semibold text-xs"
          >
            {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? "Copied" : "Copy"}</span>
          </button>
        </div>

        <div className="flex items-center justify-end pt-5 border-t border-slate-100 mt-5">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-slate-950 hover:bg-black text-white text-xs font-semibold shadow-xs transition cursor-pointer"
          >
            I have stored it safely
          </button>
        </div>
      </div>
    </div>
  );
}
