"use client";

import React from "react";
import { X, Layers, CheckCircle2, Copy, Hash } from "lucide-react";
import { KnowledgeDocument } from "@/types/dashboard";

export function ChunkInspectorModal({
  isOpen,
  onClose,
  document,
}: {
  isOpen: boolean;
  onClose: () => void;
  document: KnowledgeDocument | null;
}) {
  if (!isOpen || !document) return null;

  const sampleChunks = [
    {
      chunk_index: 0,
      token_count: 342,
      content:
        "SECTION 1: GLOBAL SHIPPING POLICIES. Standard domestic shipping orders process within 24 business hours. Ground delivery to continental United States addresses typically takes 3 to 5 business days. Express overnight orders must be placed before 2:00 PM EST for guaranteed next-day morning delivery.",
    },
    {
      chunk_index: 1,
      token_count: 298,
      content:
        "SECTION 2: DAMAGED ITEMS AND RMA PROCEDURES. If any items arrive damaged or defective during transit, customers are entitled to an immediate direct replacement or a 100% full refund upon providing photo verification. Requests under $50.00 are automated instantly; requests exceeding $50.00 are routed to human specialists.",
    },
    {
      chunk_index: 2,
      token_count: 260,
      content:
        "SECTION 3: INTERNATIONAL CUSTOMS AND DUTIES. International packages sent to Japan, United Kingdom, and the European Union include all VAT and local import tariffs prepaid at checkout. No additional courier fees will be requested upon arrival.",
    },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-fuchsia-50 text-fuchsia-600 flex items-center justify-center border border-fuchsia-100">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">pgvector Chunk Inspector</h3>
              <p className="text-[11px] text-slate-400 truncate max-w-md">{document.file_name} • {document.chunks_count} chunks indexed</p>
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

        <div className="my-4 space-y-3 max-h-[60vh] overflow-y-auto pr-1">
          {sampleChunks.map((chunk) => (
            <div
              key={chunk.chunk_index}
              className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2 text-xs"
            >
              <div className="flex items-center justify-between text-slate-400">
                <span className="font-mono text-[10px] font-bold text-fuchsia-600 bg-fuchsia-50 px-2 py-0.5 rounded-md">
                  Chunk #{chunk.chunk_index}
                </span>
                <span className="text-[10px] font-semibold text-slate-500">
                  {chunk.token_count} tokens • 1536 dim vector
                </span>
              </div>
              <p className="text-slate-800 leading-relaxed font-sans">{chunk.content}</p>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-end pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-950 hover:bg-black text-white text-xs font-semibold shadow-xs transition cursor-pointer"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
}
