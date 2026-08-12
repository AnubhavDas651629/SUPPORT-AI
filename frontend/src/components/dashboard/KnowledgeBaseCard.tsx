"use client";

import React, { useState, useEffect } from "react";
import { BookOpen, FileText, CheckCircle2, Upload, Trash2, ArrowUpRight, Loader2 } from "lucide-react";
import { KnowledgeDocument } from "@/types/dashboard";
import { useOrganization } from "@/context/OrganizationContext";
import { api } from "@/lib/api";

export function KnowledgeBaseCard({ onOpenUploadModal }: { onOpenUploadModal: () => void }) {
  const { currentOrg } = useOrganization();
  const [docs, setDocs] = useState<KnowledgeDocument[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!currentOrg) return;

    async function loadDocs() {
      setIsLoading(true);
      try {
        const kbRes = await api.get(`/organizations/${currentOrg!.id}/knowledge-bases`);
        const kbs = Array.isArray(kbRes.data) ? kbRes.data : [];
        if (kbs.length > 0) {
          const docRes = await api.get(
            `/organizations/${currentOrg!.id}/knowledge-bases/${kbs[0].id}/documents`
          );
          if (Array.isArray(docRes.data)) {
            const mapped: KnowledgeDocument[] = docRes.data.map((d: any) => ({
              id: d.id,
              title: d.filename?.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ") || "Document",
              file_name: d.filename,
              file_size: `${((d.file_size || 1024 * 500) / (1024 * 1024)).toFixed(1)} MB`,
              chunks_count: d.chunk_count || 32,
              status: "READY",
              uploaded_at: new Date(d.created_at || Date.now()).toLocaleDateString(),
            }));
            setDocs(mapped);
          }
        }
      } catch (err) {
        console.warn("Could not load overview docs:", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadDocs();
  }, [currentOrg]);

  return (
    <div className="w-full bg-white rounded-3xl border border-slate-200/80 shadow-2xs p-5 sm:p-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">
              Knowledge Base Documents (pgvector)
            </h3>
            <p className="text-xs text-slate-400">
              Active documents chunked and indexed for instant AI semantic retrieval.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenUploadModal}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-black text-white text-xs font-semibold shadow-xs transition cursor-pointer"
        >
          <Upload className="w-3.5 h-3.5" />
          <span>Upload Document</span>
        </button>
      </div>

      {/* Document List */}
      <div className="space-y-2">
        {isLoading ? (
          <div className="py-8 flex flex-col items-center justify-center gap-2 text-slate-400 text-xs">
            <Loader2 className="w-4 h-4 animate-spin text-fuchsia-600" />
            <span>Loading documents...</span>
          </div>
        ) : docs.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            <BookOpen className="w-6 h-6 text-slate-300 mx-auto mb-2" />
            <p className="font-bold text-slate-700">No documents indexed in pgvector yet</p>
            <p className="mt-0.5">Upload a PDF, DOCX, or TXT document to provide instant knowledge to your AI assistant.</p>
          </div>
        ) : (
          docs.map((doc) => (
            <div
              key={doc.id}
              className="p-3 bg-slate-50/60 hover:bg-slate-50 rounded-2xl border border-slate-200/60 flex items-center justify-between gap-3 transition"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 text-slate-600 flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4 text-fuchsia-600" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-slate-800 truncate">{doc.title}</h4>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                    <span>{doc.file_name}</span>
                    <span>•</span>
                    <span>{doc.file_size}</span>
                    <span>•</span>
                    <span className="font-semibold text-slate-600">{doc.chunks_count} chunks</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-700">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>INDEXED</span>
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
