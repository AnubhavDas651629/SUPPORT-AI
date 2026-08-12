"use client";

import React, { useState } from "react";
import {
  FileText,
  CheckCircle2,
  Trash2,
  Eye,
  RotateCw,
  Search,
  Filter,
  Layers,
  ArrowUpDown,
} from "lucide-react";
import { KnowledgeDocument } from "@/types/dashboard";

export function DocumentsListTable({
  documents,
  onInspectDocument,
  onDeleteDocument,
}: {
  documents: KnowledgeDocument[];
  onInspectDocument: (doc: KnowledgeDocument) => void;
  onDeleteDocument: (docId: string) => void;
}) {
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = documents.filter(
    (d) =>
      d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.file_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full bg-white rounded-3xl border border-slate-200/80 shadow-2xs p-6 space-y-4">
      {/* Table Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <h3 className="text-sm font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Indexed Documents</span>
            <span className="text-[10px] bg-emerald-100 text-emerald-700 font-bold px-2 py-0.5 rounded-full">
              {documents.length} Files Ready
            </span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage your knowledge files, view chunk breakdowns, and inspect pgvector tokens.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search documents..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/20 focus:border-fuchsia-500 transition"
          />
        </div>
      </div>

      {/* Document Rows */}
      <div className="divide-y divide-slate-100">
        {filtered.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            No documents found. Upload a file above to get started.
          </div>
        ) : (
          filtered.map((doc) => (
            <div
              key={doc.id}
              className="py-4 px-2 hover:bg-slate-50/70 rounded-2xl transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
            >
              {/* Left File Details */}
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-fuchsia-50 text-fuchsia-600 border border-fuchsia-100 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5 stroke-[2]" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                    {doc.title}
                  </h4>
                  <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                    <span className="font-mono text-[11px] text-slate-500">{doc.file_name}</span>
                    <span>•</span>
                    <span>{doc.file_size}</span>
                    <span>•</span>
                    <span className="font-semibold text-slate-700">{doc.chunks_count} vector chunks</span>
                    <span>•</span>
                    <span>{doc.uploaded_at}</span>
                  </div>
                </div>
              </div>

              {/* Right Status & Action Buttons */}
              <div className="flex items-center gap-3 shrink-0">
                <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.8 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>READY</span>
                </span>

                <button
                  type="button"
                  onClick={() => onInspectDocument(doc)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200/80 transition cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5 text-slate-500" />
                  <span>Inspect Chunks</span>
                </button>

                <button
                  type="button"
                  onClick={() => onDeleteDocument(doc.id)}
                  className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                  title="Delete Document"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
