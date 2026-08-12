"use client";

import React, { useState } from "react";
import {
  BookOpen,
  Plus,
  Layers,
  Database,
  CheckCircle2,
  HardDrive,
  Upload,
  Sparkles,
} from "lucide-react";
import { DocumentUploaderArea } from "./DocumentUploaderArea";
import { DocumentsListTable } from "./DocumentsListTable";
import { VectorSearchTester } from "./VectorSearchTester";
import { ChunkInspectorModal } from "./ChunkInspectorModal";
import { CreateKbModal } from "./CreateKbModal";
import { KnowledgeDocument } from "@/types/dashboard";

interface KnowledgeBaseItem {
  id: string;
  name: string;
  description: string;
}

const INITIAL_KBS: KnowledgeBaseItem[] = [
  {
    id: "kb_1",
    name: "Customer Support & Policies",
    description: "Standard shipping times, returns, warranty coverage, and RMA guidelines.",
  },
  {
    id: "kb_2",
    name: "Developer API & Webhooks",
    description: "SDK references, endpoints, rate limits, and HMAC signature algorithms.",
  },
];

const INITIAL_DOCS: KnowledgeDocument[] = [
  {
    id: "doc_1",
    title: "Global Shipping and Return Policies 2026",
    file_name: "Shipping_and_Return_Policies.pdf",
    file_size: "2.4 MB",
    chunks_count: 320,
    status: "READY",
    uploaded_at: "Aug 10, 2026",
  },
  {
    id: "doc_2",
    title: "Product Warranty Terms and RMA Guide v3",
    file_name: "Warranty_Terms_and_RMA_v3.docx",
    file_size: "1.1 MB",
    chunks_count: 184,
    status: "READY",
    uploaded_at: "Aug 11, 2026",
  },
  {
    id: "doc_3",
    title: "Enterprise Developer API Guide",
    file_name: "Developer_API_Guide.txt",
    file_size: "480 KB",
    chunks_count: 96,
    status: "READY",
    uploaded_at: "Yesterday",
  },
];

export function KnowledgeBaseManagerView() {
  const [kbs, setKbs] = useState<KnowledgeBaseItem[]>(INITIAL_KBS);
  const [selectedKbId, setSelectedKbId] = useState<string>(INITIAL_KBS[0].id);
  const [docs, setDocs] = useState<KnowledgeDocument[]>(INITIAL_DOCS);
  const [inspectingDoc, setInspectingDoc] = useState<KnowledgeDocument | null>(null);
  const [isCreateKbOpen, setIsCreateKbOpen] = useState(false);

  const activeKb = kbs.find((k) => k.id === selectedKbId) || kbs[0];

  const totalChunks = docs.reduce((acc, d) => acc + d.chunks_count, 0);

  const handleDocumentAdded = (newDoc: KnowledgeDocument) => {
    setDocs((prev) => [newDoc, ...prev]);
  };

  const handleDeleteDocument = (docId: string) => {
    setDocs((prev) => prev.filter((d) => d.id !== docId));
  };

  const handleKbCreated = (newKb: any) => {
    const formatted: KnowledgeBaseItem = {
      id: newKb.id,
      name: newKb.name,
      description: newKb.description || "Custom Knowledge Base",
    };
    setKbs((prev) => [...prev, formatted]);
    setSelectedKbId(formatted.id);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Knowledge Base Header Bar */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full uppercase">
              RAG KNOWLEDGE BASE
            </span>
            <span className="text-xs text-slate-400">• pgvector Cosine Search</span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight mt-1">
            {activeKb.name}
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            {activeKb.description}
          </p>
        </div>

        {/* KB Switcher Tabs & + New KB Button */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-2xl border border-slate-200/70">
            {kbs.map((kb) => (
              <button
                key={kb.id}
                type="button"
                onClick={() => setSelectedKbId(kb.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer truncate max-w-[180px] ${
                  selectedKbId === kb.id
                    ? "bg-white text-slate-900 shadow-2xs font-bold"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {kb.name}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setIsCreateKbOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-950 hover:bg-black text-white text-xs font-semibold shadow-xs transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New KB</span>
          </button>
        </div>
      </div>

      {/* Stats Summary Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="p-4 bg-white rounded-3xl border border-slate-200/80 shadow-2xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-fuchsia-50 text-fuchsia-600 flex items-center justify-center border border-fuchsia-100">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase">Documents</div>
            <div className="text-lg font-extrabold text-slate-900">{docs.length} Active Files</div>
          </div>
        </div>

        <div className="p-4 bg-white rounded-3xl border border-slate-200/80 shadow-2xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase">Vector Chunks</div>
            <div className="text-lg font-extrabold text-slate-900">{totalChunks.toLocaleString()} in pgvector</div>
          </div>
        </div>

        <div className="p-4 bg-white rounded-3xl border border-slate-200/80 shadow-2xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase">Indexing Health</div>
            <div className="text-lg font-extrabold text-emerald-600">100% Synced</div>
          </div>
        </div>
      </div>

      {/* Document Ingestion Drag & Drop Uploader */}
      <DocumentUploaderArea onDocumentAdded={handleDocumentAdded} />

      {/* Semantic Search Retrieval Query Tester */}
      <VectorSearchTester />

      {/* Documents Table */}
      <DocumentsListTable
        documents={docs}
        onInspectDocument={(doc) => setInspectingDoc(doc)}
        onDeleteDocument={handleDeleteDocument}
      />

      {/* Chunk Inspector Modal */}
      <ChunkInspectorModal
        isOpen={!!inspectingDoc}
        onClose={() => setInspectingDoc(null)}
        document={inspectingDoc}
      />

      {/* Create KB Modal */}
      <CreateKbModal
        isOpen={isCreateKbOpen}
        onClose={() => setIsCreateKbOpen(false)}
        onCreated={handleKbCreated}
      />
    </div>
  );
}
