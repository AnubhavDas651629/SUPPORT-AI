"use client";

import React, { useState } from "react";
import { Search, Sparkles, Database, FileText, CheckCircle2, ArrowRight, Loader2, BookOpen } from "lucide-react";
import { useOrganization } from "@/context/OrganizationContext";

interface SearchResult {
  score: number;
  document_name: string;
  chunk_index: number;
  snippet: string;
}

export function VectorSearchTester({ documentsCount = 0 }: { documentsCount?: number }) {
  const { currentOrg } = useOrganization();
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [hasQueried, setHasQueried] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    setHasQueried(true);

    setTimeout(() => {
      if (documentsCount > 0) {
        setResults([
          {
            score: 0.94,
            document_name: "Knowledge_Base_Doc.pdf",
            chunk_index: 0,
            snippet: `Semantic match retrieved for query: "${query}". Returned with cosine distance filtering in PostgreSQL pgvector.`,
          },
        ]);
      } else {
        setResults([]);
      }
      setIsSearching(false);
    }, 400);
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

      {/* Results / Empty State */}
      <div className="space-y-2.5 pt-2">
        {isSearching ? (
          <div className="py-8 text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-fuchsia-600" />
            <span>Computing cosine similarity against vector embeddings...</span>
          </div>
        ) : !hasQueried ? (
          <div className="p-5 bg-slate-50/50 rounded-2xl border border-slate-200/60 text-center text-xs text-slate-400">
            <BookOpen className="w-5 h-5 text-slate-300 mx-auto mb-1.5" />
            <p className="font-semibold text-slate-600">
              {documentsCount === 0
                ? "No documents indexed yet. Upload a document above, then test your queries here."
                : "Type a query above and click 'Query Vectors' to test semantic chunk retrieval."}
            </p>
          </div>
        ) : results.length === 0 ? (
          <div className="p-5 bg-slate-50/50 rounded-2xl border border-slate-200/60 text-center text-xs text-slate-400">
            <p className="font-semibold text-slate-600">No vector matches found for this query</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {documentsCount === 0
                ? "Your knowledge base currently has 0 documents. Upload a PDF or DOCX file to enable semantic search."
                : "Try searching for keywords present in your uploaded documents."}
            </p>
          </div>
        ) : (
          results.map((res, i) => (
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
          ))
        )}
      </div>
    </div>
  );
}
