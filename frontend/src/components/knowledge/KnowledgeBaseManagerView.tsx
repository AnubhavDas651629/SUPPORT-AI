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
  AlertCircle,
} from "lucide-react";
import { DocumentUploaderArea } from "./DocumentUploaderArea";
import { DocumentsListTable } from "./DocumentsListTable";
import { VectorSearchTester } from "./VectorSearchTester";
import { ChunkInspectorModal } from "./ChunkInspectorModal";
import { CreateKbModal } from "./CreateKbModal";
import { EditKbModal } from "./EditKbModal";
import { DeleteKbModal } from "./DeleteKbModal";
import { UpgradeModal } from "@/components/dashboard/UpgradeModal";
import { KnowledgeDocument } from "@/types/dashboard";
import { useOrganization } from "@/context/OrganizationContext";
import { api } from "@/lib/api";
import { Pencil, Trash2 } from "lucide-react";

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
  const [isEditKbOpen, setIsEditKbOpen] = useState(false);
  const [isDeleteKbOpen, setIsDeleteKbOpen] = useState(false);
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);

  // 1. Load Knowledge Bases for currentOrg
  useEffect(() => {
    if (!currentOrg) return;
    async function loadKbs() {
      setIsLoading(true);
      try {
        const res = await api.get(`/organizations/${currentOrg!.id}/knowledge-bases`);
        if (Array.isArray(res.data) && res.data.length > 0) {
          setKbs(res.data);
          setSelectedKbId((prev) => {
            const exists = res.data.some((k: any) => k.id === prev);
            return exists ? prev : res.data[0].id;
          });
        } else {
          setKbs([]);
          setSelectedKbId("");
        }
      } catch (err) {
        console.warn("Could not load knowledge bases:", err);
        setKbs([]);
        setSelectedKbId("");
      } finally {
        setIsLoading(false);
      }
    }
    loadKbs();
  }, [currentOrg]);

  // 2. Load Documents for selected KB
  useEffect(() => {
    if (!currentOrg || !selectedKbId) {
      setDocs([]);
      return;
    }

    async function loadDocuments() {
      try {
        const res = await api.get(
          `/organizations/${currentOrg!.id}/knowledge-bases/${selectedKbId}/documents`
        );
        if (Array.isArray(res.data)) {
          const mapped: KnowledgeDocument[] = res.data.map((d: any) => ({
            id: d.id,
            title: d.original_filename?.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ") || "Document",
            file_name: d.original_filename,
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

  const activeKb = kbs.find((k) => k.id === selectedKbId) || null;

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

  const handleKbUpdated = (updatedKb: KnowledgeBaseItem) => {
    setKbs((prev) => prev.map((k) => (k.id === updatedKb.id ? updatedKb : k)));
  };

  const handleKbDeleted = (deletedKbId: string) => {
    setKbs((prev) => {
      const filtered = prev.filter((k) => k.id !== deletedKbId);
      if (selectedKbId === deletedKbId) {
        setSelectedKbId(filtered.length > 0 ? filtered[0].id : "");
      }
      return filtered;
    });
    if (selectedKbId === deletedKbId) {
      setDocs([]);
    }
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
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
              {activeKb ? activeKb.name : "No Knowledge Base Selected"}
            </h2>
            {activeKb && (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setIsEditKbOpen(true)}
                  title="Edit Knowledge Base"
                  className="flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition cursor-pointer"
                >
                  <Pencil className="w-3 h-3 text-slate-500" />
                  <span>Edit</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsDeleteKbOpen(true)}
                  title="Delete Knowledge Base"
                  className="flex items-center gap-1 px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-semibold transition cursor-pointer"
                >
                  <Trash2 className="w-3 h-3 text-rose-500" />
                  <span>Delete</span>
                </button>
              </div>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            {activeKb ? activeKb.description || "No description provided." : "Create a Knowledge Base to organize, chunk, and index documents for your AI assistant."}
          </p>
        </div>

        {/* KB Switcher Tabs & + New KB Button */}
        <div className="flex items-center gap-2 flex-wrap">
          {kbs.length > 0 && (
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
          )}

          <button
            type="button"
            onClick={() => setIsCreateKbOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-950 hover:bg-black text-white text-xs font-semibold shadow-xs transition cursor-pointer"
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
              {docs.length > 0 ? "100% Synced" : activeKb ? "Ready for Docs" : "Create KB First"}
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
      <VectorSearchTester documentsCount={docs.length} kbId={selectedKbId} />

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
        kbId={selectedKbId}
      />

      {/* Create KB Modal */}
      <CreateKbModal
        isOpen={isCreateKbOpen}
        onClose={() => setIsCreateKbOpen(false)}
        onCreated={handleKbCreated}
        onOpenUpgrade={() => setIsUpgradeOpen(true)}
      />

      {/* Edit KB Modal */}
      <EditKbModal
        isOpen={isEditKbOpen}
        onClose={() => setIsEditKbOpen(false)}
        kb={activeKb}
        onUpdated={handleKbUpdated}
      />

      {/* Delete KB Modal */}
      <DeleteKbModal
        isOpen={isDeleteKbOpen}
        onClose={() => setIsDeleteKbOpen(false)}
        kb={activeKb}
        documentsCount={docs.length}
        onDeleted={handleKbDeleted}
      />

      {/* Upgrade Modal */}
      <UpgradeModal
        isOpen={isUpgradeOpen}
        onClose={() => setIsUpgradeOpen(false)}
      />
    </div>
  );
}
