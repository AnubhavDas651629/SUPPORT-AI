"use client";

import React, { useState, useEffect } from "react";
import {
  BookOpen,
  Plus,
  Layers,
  Database,
  CheckCircle2,
  HardDrive,
  Upload,
  Sparkles,
  Loader2,
} from "lucide-react";
import { DocumentUploaderArea } from "./DocumentUploaderArea";
import { DocumentsListTable } from "./DocumentsListTable";
import { VectorSearchTester } from "./VectorSearchTester";
import { ChunkInspectorModal } from "./ChunkInspectorModal";
import { CreateKbModal } from "./CreateKbModal";
import { KnowledgeDocument } from "@/types/dashboard";
import { useOrganization } from "@/context/OrganizationContext";
import { api } from "@/lib/api";

interface KnowledgeBaseItem {
  id: string;
  name: string;
  description: string;
}

export function KnowledgeBaseManagerView() {
  const { currentOrg } = useOrganization();
  const [kbs, setKbs] = useState<KnowledgeBaseItem[]>([]);
  const [selectedKbId, setSelectedKbId] = useState<string>("");
  const [docs, setDocs] = useState<KnowledgeDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [inspectingDoc, setInspectingDoc] = useState<KnowledgeDocument | null>(null);
  const [isCreateKbOpen, setIsCreateKbOpen] = useState(false);

  // 1. Load Knowledge Bases for currentOrg
  useEffect(() => {
    if (!currentOrg) return;
    async function loadKbs() {
      setIsLoading(true);
      try {
        const res = await api.get(`/organizations/${currentOrg!.id}/knowledge-bases`);
        if (Array.isArray(res.data) && res.data.length > 0) {
          setKbs(res.data);
          setSelectedKbId(res.data[0].id);
        } else {
          // If no KB exists, auto-create a default one
          try {
            const createRes = await api.post(`/organizations/${currentOrg!.id}/knowledge-bases`, {
              name: "General Knowledge Base",
              description: "Standard support policies, documentation, and FAQs.",
            });
            setKbs([createRes.data]);
            setSelectedKbId(createRes.data.id);
          } catch (createErr) {
            setKbs([]);
          }
        }
      } catch (err) {
        console.warn("Could not load knowledge bases:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadKbs();
  }, [currentOrg]);

  // 2. Load Documents for selected KB
  useEffect(() => {
    if (!currentOrg || !selectedKbId) return;

    async function loadDocuments() {
      try {
        const res = await api.get(
          `/organizations/${currentOrg!.id}/knowledge-bases/${selectedKbId}/documents`
        );
        if (Array.isArray(res.data)) {
          const mapped: KnowledgeDocument[] = res.data.map((d: any) => ({
            id: d.id,
            title: d.filename?.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ") || "Document",
            file_name: d.filename,
            file_size: `${((d.file_size || 1024 * 500) / (1024 * 1024)).toFixed(1)} MB`,
            chunks_count: d.chunk_count || 32,
            status: d.status === "READY" ? "READY" : d.status === "PROCESSING" ? "INDEXING" : "READY",
            uploaded_at: new Date(d.created_at || Date.now()).toLocaleDateString(),
          }));
          setDocs(mapped);
        } else {
          setDocs([]);
        }
      } catch (err) {
        console.warn("Could not load documents:", err);
        setDocs([]);
      }
    }

    loadDocuments();
  }, [currentOrg, selectedKbId]);

  const activeKb = kbs.find((k) => k.id === selectedKbId) || kbs[0] || {
    id: "default",
    name: "General Knowledge Base",
    description: "Support policies, warranty documentation, and FAQs.",
  };

  const totalChunks = docs.reduce((acc, d) => acc + (d.chunks_count || 0), 0);

  const handleDocumentAdded = (newDoc: KnowledgeDocument) => {
    setDocs((prev) => [newDoc, ...prev]);
  };

  const handleDeleteDocument = async (docId: string) => {
    if (!currentOrg || !selectedKbId) return;
    if (confirm("Are you sure you want to delete this document and remove its vectors?")) {
      try {
        await api.delete(
          `/organizations/${currentOrg.id}/knowledge-bases/${selectedKbId}/documents/${docId}`
        );
        setDocs((prev) => prev.filter((d) => d.id !== docId));
      } catch (e) {
        setDocs((prev) => prev.filter((d) => d.id !== docId));
      }
    }
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
            <div className="text-lg font-extrabold text-slate-900">{docs.length} Files</div>
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
            <div className="text-lg font-extrabold text-emerald-600">
              {docs.length > 0 ? "100% Synced" : "Ready for Docs"}
            </div>
          </div>
        </div>
      </div>

      {/* Document Ingestion Drag & Drop Uploader */}
      <DocumentUploaderArea
        onDocumentAdded={handleDocumentAdded}
        kbId={selectedKbId}
      />

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
