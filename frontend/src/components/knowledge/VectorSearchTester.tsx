"use client";

import React, { useState } from "react";
import { Search, Sparkles, Database, FileText, CheckCircle2, ArrowRight, Loader2 } from "lucide-react";

interface SearchResult {
  score: number;
  document_name: string;
  chunk_index: number;
  snippet: string;
}

export function VectorSearchTester() {
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([
    {
      score: 0.94,
      document_name: "Shipping_and_Return_Policies.pdf",
      chunk_index: 1,
      snippet:
        "SECTION 2: DAMAGED ITEMS AND RMA PROCEDURES. If any items arrive damaged or defective during transit, customers are entitled to an immediate direct replacement or a 100% full refund upon photo verification...",
    },
    {
      score: 0.88,
      document_name: "Warranty_Terms_2026.docx",
      chunk_index: 0,
      snippet:
        "All hardware units are covered by a 1-year comprehensive factory defect warranty. Express advance replacement units are dispatched within 24 hours...",
    },
  ]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    setTimeout(() => {
      setResults([
        {
          score: 0.96,
          document_name: "Shipping_and_Return_Policies.pdf",
          chunk_index: 0,
          snippet: `Ground shipping takes 3 to 5 business days for domestic orders. Express overnight deliveries arrive guaranteed next-day before noon. Matched query: "${query}"`,
        },
        {
          score: 0.84,
          document_name: "Developer_API_Guide.txt",
          chunk_index: 2,
          snippet: "API endpoint /api/v1/widget/chat/stream supports streaming SSE tokens in real-time with pgvector cosine distance filtering.",
        },
      ]);
      setIsSearching(false);
    }, 450);
  };

  return (
    <div className="w-full bg-white rounded-3xl border border-slate-200/80 shadow-2xs p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">
              pgvector Similarity Retrieval Simulator
            </h3>
            <p className="text-xs text-slate-400">
              Test semantic search and inspect cosine similarity matches returned from your embeddings.
            </p>
          </div>
        </div>
      </div>

      {/* Query Bar */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a sample customer question (e.g. How does refund work?)..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/20 focus:border-fuchsia-500 transition"
          />
        </div>
        <button
          type="submit"
          disabled={!query.trim() || isSearching}
          className="px-5 py-2.5 rounded-2xl bg-fuchsia-600 hover:bg-fuchsia-700 text-white text-xs font-semibold shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
        >
          {isSearching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Database className="w-3.5 h-3.5" />}
          <span>Query Vectors</span>
        </button>
      </form>

      {/* Retrieved Chunks Results */}
      <div className="space-y-2.5 pt-2">
        {results.map((res, i) => (
          <div
            key={i}
            className="p-3.5 bg-slate-50/70 rounded-2xl border border-slate-200/70 text-xs space-y-1.5"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-fuchsia-600" />
                <span className="font-bold text-slate-800">{res.document_name}</span>
                <span className="text-[10px] text-slate-400">(Chunk #{res.chunk_index})</span>
              </div>
              <span className="text-[11px] font-mono font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                {(res.score * 100).toFixed(0)}% Match
              </span>
            </div>
            <p className="text-slate-600 leading-relaxed pl-5 font-sans">{res.snippet}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
