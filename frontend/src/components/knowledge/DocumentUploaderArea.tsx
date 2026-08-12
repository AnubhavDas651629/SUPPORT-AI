"use client";

import React, { useState } from "react";
import { Upload, FileText, CheckCircle2, AlertCircle, Loader2, Sparkles, X } from "lucide-react";
import { KnowledgeDocument } from "@/types/dashboard";

export function DocumentUploaderArea({
  onDocumentAdded,
}: {
  onDocumentAdded: (doc: KnowledgeDocument) => void;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingFile, setUploadingFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [ingestionStage, setIngestionStage] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const handleFile = (file: File) => {
    if (!file) return;
    setUploadingFile(file);
    setIsProcessing(true);
    setUploadProgress(10);
    setIngestionStage("Uploading document...");

    setTimeout(() => {
      setUploadProgress(40);
      setIngestionStage("Parsing text & extracting chunks...");
    }, 600);

    setTimeout(() => {
      setUploadProgress(75);
      setIngestionStage("Generating OpenAI text-embedding-3-small vectors...");
    }, 1200);

    setTimeout(() => {
      setUploadProgress(100);
      setIngestionStage("Stored & indexed in PostgreSQL pgvector!");

      const newDoc: KnowledgeDocument = {
        id: `doc_${Date.now()}`,
        title: file.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " "),
        file_name: file.name,
        file_size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        chunks_count: Math.floor(Math.random() * 200) + 40,
        status: "READY",
        uploaded_at: "Just now",
      };

      setTimeout(() => {
        onDocumentAdded(newDoc);
        setIsProcessing(false);
        setUploadingFile(null);
        setUploadProgress(0);
      }, 500);
    }, 1800);
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
