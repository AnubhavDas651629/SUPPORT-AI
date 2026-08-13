"use client";

import React, { useEffect, useState } from "react";
import { X, Layers, CheckCircle2, Copy, Hash, Loader2 } from "lucide-react";
import { KnowledgeDocument } from "@/types/dashboard";
import { api } from "@/lib/api";
import { useOrganization } from "@/context/OrganizationContext";

interface Chunk {
  id: string;
  chunk_index: number;
  token_count: number;
  content: string;
}

export function ChunkInspectorModal({
  isOpen,
  onClose,
  document,
  kbId,
}: {
  isOpen: boolean;
  onClose: () => void;
  document: KnowledgeDocument | null;
  kbId?: string;
}) {
  const { currentOrg } = useOrganization();
  const [chunks, setChunks] = useState<Chunk[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && document && currentOrg && kbId) {
      setIsLoading(true);
      api
        .get(`/organizations/${currentOrg.id}/knowledge-bases/${kbId}/documents/${document.id}/chunks`)
        .then((res) => setChunks(res.data))
        .catch((err) => console.error(err))
        .finally(() => setIsLoading(false));
    }
  }, [isOpen, document, currentOrg, kbId]);

  if (!isOpen || !document) return null;

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
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin mb-2" />
              <p className="text-xs">Fetching vectors from PostgreSQL...</p>
            </div>
          ) : chunks.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              No chunks found for this document.
            </div>
          ) : (
            chunks.map((chunk) => (
              <div
                key={chunk.id}
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
            ))
          )}
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
