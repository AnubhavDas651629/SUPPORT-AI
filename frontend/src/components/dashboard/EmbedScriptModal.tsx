"use client";

import React, { useState } from "react";
import { X, Copy, CheckCircle2, Code2 } from "lucide-react";
import { useOrganization } from "@/context/OrganizationContext";

export function EmbedScriptModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { currentOrg } = useOrganization();
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const scriptCode = `<script src="http://localhost:8000/static/widget.js" data-org-id="${
    currentOrg?.id || "your-org-id"
  }" defer></script>`;

  const handleCopy = () => {
    navigator.clipboard.writeText(scriptCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
              <Code2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">HTML Widget Embed Code</h3>
              <p className="text-[11px] text-slate-400">Install the live AI support bubble on any webpage</p>
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

        <div className="mt-4 space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            Copy and paste this snippet right before the closing <code className="text-fuchsia-600 bg-fuchsia-50 px-1 py-0.5 rounded font-mono">&lt;/body&gt;</code> tag of your website HTML or React template.
          </p>

          <div className="p-3.5 bg-slate-950 text-slate-100 rounded-2xl font-mono text-xs flex items-center justify-between gap-3 shadow-inner">
            <code className="truncate">{scriptCode}</code>
            <button
              type="button"
              onClick={handleCopy}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white transition shrink-0 cursor-pointer flex items-center gap-1 text-xs font-sans font-medium"
            >
              {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? "Copied" : "Copy"}</span>
            </button>
          </div>

          <div className="flex items-center justify-end pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-fuchsia-600 hover:bg-fuchsia-700 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
