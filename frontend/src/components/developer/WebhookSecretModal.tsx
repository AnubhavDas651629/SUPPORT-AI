"use client";

import React, { useState } from "react";
import { Copy, CheckCircle2, AlertTriangle, Webhook, ShieldCheck } from "lucide-react";

export function WebhookSecretModal({
  isOpen,
  onClose,
  rawSecret,
  webhookName,
}: {
  isOpen: boolean;
  onClose: () => void;
  rawSecret: string;
  webhookName: string;
}) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !rawSecret) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(rawSecret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 sm:p-8 animate-in zoom-in-95 duration-150">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
            <Webhook className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900">Webhook Registered Successfully</h3>
            <p className="text-xs text-slate-400">{webhookName}</p>
          </div>
        </div>

        {/* Security Warning */}
        <div className="my-4 p-3.5 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3 text-xs text-amber-900">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block">Save your HMAC Signing Secret</span>
            <span>
              Use this secret to verify the <code>X-SupportAI-Signature</code> header on incoming webhook POST payloads. This secret will not be displayed again.
            </span>
          </div>
        </div>

        {/* Raw Signing Secret Box */}
        <div className="p-3.5 bg-slate-950 text-emerald-400 font-mono text-xs rounded-2xl flex items-center justify-between gap-3 shadow-inner">
          <code className="truncate select-all">{rawSecret}</code>
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
            I have saved the secret
          </button>
        </div>
      </div>
    </div>
  );
}
