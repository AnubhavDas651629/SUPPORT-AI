"use client";

import React, { useState } from "react";
import { Upload, FileText, CheckCircle2, AlertCircle, Loader2, Sparkles, BookOpen } from "lucide-react";
import { KnowledgeDocument } from "@/types/dashboard";
import { useOrganization } from "@/context/OrganizationContext";
import { api } from "@/lib/api";

export function DocumentUploaderArea({
  onDocumentAdded,
  kbId,
}: {
  onDocumentAdded: (doc: KnowledgeDocument) => void;
  kbId?: string;
}) {
  const { currentOrg } = useOrganization();
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingFile, setUploadingFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [ingestionStage, setIngestionStage] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!kbId) {
    return (
      <div className="w-full bg-white rounded-3xl border border-slate-200/80 shadow-2xs p-6 text-center">
        <div className="p-8 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center space-y-2 bg-slate-50/50">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center">
            <BookOpen className="w-6 h-6" />
          </div>
          <h4 className="text-xs font-bold text-slate-800">No Knowledge Base Selected</h4>
          <p className="text-[11px] text-slate-400 max-w-sm">
            Documents must belong to a Knowledge Base. Please create or select a Knowledge Base before uploading files.
          </p>
        </div>
      </div>
    );
  }

  const handleFile = async (file: File) => {
    if (!file || !currentOrg || !kbId) return;
    setUploadingFile(file);
    setIsProcessing(true);
    setUploadProgress(20);
    setIngestionStage("Uploading document to pgvector knowledge base...");
    setErrorMessage(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await api.post(
        `/organizations/${currentOrg.id}/knowledge-bases/${kbId}/documents`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      const backendDoc = res.data;

      setUploadProgress(60);
      setIngestionStage("Generating embeddings & indexing vectors...");

      setTimeout(() => {
        setUploadProgress(100);
        setIngestionStage("Stored & indexed in PostgreSQL pgvector!");

        const newDoc: KnowledgeDocument = {
          id: backendDoc?.id || `doc_${Date.now()}`,
          title: file.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " "),
          file_name: file.name,
          file_size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
          chunks_count: backendDoc?.chunk_count || 32,
          status: "READY",
          uploaded_at: "Just now",
        };

        setTimeout(() => {
          onDocumentAdded(newDoc);
          setIsProcessing(false);
          setUploadingFile(null);
          setUploadProgress(0);
        }, 500);
      }, 700);
    } catch (err: any) {
      console.error("Backend upload error:", err);
      const detail = err.response?.data?.detail;
      setErrorMessage(typeof detail === "string" ? detail : "Failed to upload document. Please check file format and plan limits.");
      setIsProcessing(false);
      setUploadingFile(null);
      setUploadProgress(0);
    }
  };

  return (
    <div className="w-full bg-white rounded-3xl border border-slate-200/80 shadow-2xs p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Document Ingestion Engine</span>
            <span className="text-[10px] bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded-full">
              PostgreSQL pgvector
            </span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Upload PDF, DOCX, or TXT documents. We automatically chunk, vectorize, and index them into pgvector.
          </p>
        </div>
      </div>

      {errorMessage && (
        <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Drag & Drop Box */}
      {!isProcessing ? (
        <label
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
          }}
          className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition ${
            isDragging
              ? "border-fuchsia-500 bg-fuchsia-50/40"
              : "border-slate-200 hover:border-fuchsia-400 bg-slate-50/50 hover:bg-fuchsia-50/20"
          }`}
        >
          <div className="w-12 h-12 rounded-2xl bg-fuchsia-50 text-fuchsia-600 flex items-center justify-center mb-3 shadow-2xs border border-fuchsia-100">
            <Upload className="w-6 h-6 stroke-[2.2]" />
          </div>
          <span className="text-xs font-bold text-slate-900">
            Click to upload or drag & drop documents
          </span>
          <span className="text-[11px] text-slate-400 mt-1">
            Supports PDF, DOCX, or TXT up to 100MB
          </span>
          <input
            type="file"
            accept=".pdf,.txt,.docx"
            onChange={(e) => {
              if (e.target.files?.[0]) handleFile(e.target.files[0]);
            }}
            className="hidden"
          />
        </label>
      ) : (
        /* Active Ingestion Progress Card */
        <div className="p-6 rounded-2xl bg-gradient-to-r from-[#FDF2F8]/80 to-[#F5F3FF]/80 border border-fuchsia-200/80 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-white text-fuchsia-600 flex items-center justify-center shadow-2xs">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 truncate">
                  {uploadingFile?.name}
                </h4>
                <div className="text-[11px] text-fuchsia-700 font-semibold mt-0.5">
                  {ingestionStage}
                </div>
              </div>
            </div>
            <span className="text-xs font-bold font-mono text-fuchsia-600">
              {uploadProgress}%
            </span>
          </div>

          <div className="w-full h-2 bg-white rounded-full overflow-hidden shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-fuchsia-500 to-indigo-600 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
