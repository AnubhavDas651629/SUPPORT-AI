"use client";

import React, { useState, useEffect } from "react";
import {
  BookOpen,
  Plus,
  Layers,
  Database,
  ArrowRight,
  Pencil,
  Trash2,
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
    <div className="space-y-10 max-w-7xl mx-auto pb-16">
      
      {/* RAG Pipeline Overview Graphic (Subtle) */}
      <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400 border-b border-slate-200 pb-4">
        <span className="font-bold text-slate-600">PIPELINE</span>
        <ArrowRight className="w-3 h-3 text-slate-300" />
        <span>Document</span>
        <ArrowRight className="w-3 h-3 text-slate-300" />
        <span>Chunking</span>
        <ArrowRight className="w-3 h-3 text-slate-300" />
        <span>Embeddings</span>
        <ArrowRight className="w-3 h-3 text-slate-300" />
        <span>pgvector</span>
        <ArrowRight className="w-3 h-3 text-slate-300" />
        <span className="text-emerald-600 font-medium">Retrieval</span>
      </div>

      {/* KB Selector and Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              {activeKb ? activeKb.name : "Knowledge Bases"}
            </h2>
            {activeKb && (
              <div className="flex items-center gap-1.5 border-l border-slate-300 pl-3">
                <button
                  type="button"
                  onClick={() => setIsEditKbOpen(true)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition cursor-pointer"
                  title="Edit KB"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsDeleteKbOpen(true)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer"
                  title="Delete KB"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
          <p className="text-sm text-slate-500 mt-1 max-w-2xl">
            {activeKb ? activeKb.description || "Manage documents and test retrieval for this knowledge base." : "Select or create a knowledge base to manage RAG documents."}
          </p>
        </div>

        {/* KB Switcher Tabs & + New KB Button */}
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          {kbs.length > 0 && (
            <div className="flex items-center gap-1 bg-slate-100/50 p-1 rounded-md border border-slate-200">
              {kbs.map((kb) => (
                <button
                  key={kb.id}
                  type="button"
                  onClick={() => setSelectedKbId(kb.id)}
                  className={`px-3 py-1.5 rounded-sm text-xs font-medium transition cursor-pointer max-w-[150px] truncate ${
                    selectedKbId === kb.id
                      ? "bg-white text-slate-900 shadow-sm border border-slate-200"
                      : "text-slate-500 hover:text-slate-700"
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
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New KB</span>
          </button>
        </div>
      </div>

      {/* Stats Summary Strip */}
      <div className="flex items-center gap-8 border-y border-slate-200 py-3">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-medium text-slate-700">{docs.length} Documents</span>
        </div>
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-medium text-slate-700">{totalChunks.toLocaleString()} Vector Chunks</span>
        </div>
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-slate-400" />
          <span className={`text-sm font-medium ${docs.length > 0 ? "text-emerald-600" : "text-slate-500"}`}>
            {docs.length > 0 ? "Indexes synced" : "Pending documents"}
          </span>
        </div>
      </div>

      {/* Document Ingestion & Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2 space-y-8">
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
              1. Document Ingestion
            </h3>
            <DocumentUploaderArea
              onDocumentAdded={handleDocumentAdded}
              kbId={selectedKbId}
            />
          </div>

          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
              2. Indexed Documents
            </h3>
            <DocumentsListTable
              documents={docs}
              onInspectDocument={(doc) => setInspectingDoc(doc)}
              onDeleteDocument={handleDeleteDocument}
            />
          </div>
        </div>

        {/* Semantic Search Retrieval Query Tester */}
        <div className="lg:col-span-1 border-l border-slate-200 pl-8 space-y-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            3. Retrieval Testing
          </h3>
          <VectorSearchTester documentsCount={docs.length} kbId={selectedKbId} />
        </div>
      </div>

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
